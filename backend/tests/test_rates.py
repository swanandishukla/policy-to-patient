"""
Unit and integration tests for Phase 3 Treatment Rate Benchmark API and RateService.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.rate_service import RateService, RateNotFoundError, InvalidSelectionError, RateServiceError

client = TestClient(app)


def test_rate_service_list_procedures():
    """Verify rate service loads procedure list and source metadata correctly."""
    metadata = RateService.get_source_metadata()
    assert metadata["source_document_title"] == "CGHS rates applicable for treatment at healthcare organisation"
    assert metadata["effective_date"] == "2025-10-13"

    procedures = RateService.list_procedures()
    assert len(procedures) >= 8
    codes = [p["procedure_code"] for p in procedures]
    assert "CN001" in codes
    assert "AG095" in codes
    assert "OR089" in codes


def test_api_list_procedures():
    """Test GET /api/rates/procedures endpoint."""
    response = client.get("/api/rates/procedures")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] >= 8
    assert "source_metadata" in data
    assert "procedures" in data
    assert len(data["procedures"]) == data["total_count"]


def test_api_estimate_uniform_rate():
    """Test estimate calculation for uniform rate procedure (Consultation CN001)."""
    for ward in ["General Ward", "Semi-Private Ward", "Private Ward"]:
        payload = {
            "procedure_code": "CN001",
            "hospital_accreditation": "NABH",
            "ward_entitlement": ward,
            "city_category": "Tier 1 (X City)"
        }
        response = client.post("/api/rates/estimate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["procedure_code"] == "CN001"
        assert data["base_rate_inr"] == 350.0
        assert data["ward_adjustment_percent"] == 0.0
        assert data["final_benchmark_rate_inr"] == 350.0
        assert "Uniform rate applies" in data["calculation_breakdown"]


def test_api_estimate_package_rate_variants():
    """Test estimate calculation for package procedure (AG095 Laparoscopic Appendectomy)."""
    # 1. Semi-Private Ward (Base rate)
    res_semi = client.post("/api/rates/estimate", json={
        "procedure_code": "AG095",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward"
    })
    assert res_semi.status_code == 200
    data_semi = res_semi.json()
    assert data_semi["base_rate_inr"] == 33000.0
    assert data_semi["ward_adjustment_percent"] == 0.0
    assert data_semi["final_benchmark_rate_inr"] == 33000.0

    # 2. Private Ward (+5%)
    res_priv = client.post("/api/rates/estimate", json={
        "procedure_code": "AG095",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Private Ward"
    })
    assert res_priv.status_code == 200
    data_priv = res_priv.json()
    assert data_priv["base_rate_inr"] == 33000.0
    assert data_priv["ward_adjustment_percent"] == 5.0
    assert data_priv["ward_adjustment_inr"] == 1650.0
    assert data_priv["final_benchmark_rate_inr"] == 34650.0

    # 3. General Ward (-5%)
    res_gen = client.post("/api/rates/estimate", json={
        "procedure_code": "AG095",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "General Ward"
    })
    assert res_gen.status_code == 200
    data_gen = res_gen.json()
    assert data_gen["base_rate_inr"] == 33000.0
    assert data_gen["ward_adjustment_percent"] == -5.0
    assert data_gen["ward_adjustment_inr"] == -1650.0
    assert data_gen["final_benchmark_rate_inr"] == 31350.0


def test_prevention_of_double_adjustment():
    """Verify multiple consecutive estimate calls do not mutate base rate or compound adjustments."""
    res1 = RateService.calculate_estimate("AG095", "NABH", "Private Ward")
    res2 = RateService.calculate_estimate("AG095", "NABH", "Private Ward")
    assert res1["base_rate_inr"] == 33000.0
    assert res2["base_rate_inr"] == 33000.0
    assert res1["final_benchmark_rate_inr"] == 34650.0
    assert res2["final_benchmark_rate_inr"] == 34650.0


def test_exact_arithmetic_knee_replacement():
    """Verify exact arithmetic for knee replacement (OR089) Super Speciality rate (174,800)."""
    # Private ward: 174,800 + 5% (8,740) = 183,540
    res_priv = RateService.calculate_estimate("OR089", "Super Speciality", "Private Ward")
    assert res_priv["base_rate_inr"] == 174800.0
    assert res_priv["ward_adjustment_inr"] == 8740.0
    assert res_priv["final_benchmark_rate_inr"] == 183540.0

    # General ward: 174,800 - 5% (8,740) = 166,060
    res_gen = RateService.calculate_estimate("OR089", "Super Speciality", "General Ward")
    assert res_gen["base_rate_inr"] == 174800.0
    assert res_gen["ward_adjustment_inr"] == -8740.0
    assert res_gen["final_benchmark_rate_inr"] == 166060.0


def test_api_estimate_unknown_procedure():
    """Test 404 response for unknown procedure code."""
    payload = {
        "procedure_code": "UNKNOWN_99",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward"
    }
    response = client.post("/api/rates/estimate", json=payload)
    assert response.status_code == 404
    assert "is not available in the verified benchmark dataset" in response.json()["detail"]


def test_api_estimate_invalid_accreditation():
    """Test 400 response for invalid accreditation choice."""
    payload = {
        "procedure_code": "AG095",
        "hospital_accreditation": "INVALID_ACCREDITATION",
        "ward_entitlement": "Semi-Private Ward"
    }
    response = client.post("/api/rates/estimate", json=payload)
    assert response.status_code == 400
    assert "Invalid accreditation" in response.json()["detail"]


def test_api_estimate_invalid_ward():
    """Test 400 response for invalid ward entitlement choice."""
    payload = {
        "procedure_code": "AG095",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Deluxe VIP Suite"
    }
    response = client.post("/api/rates/estimate", json=payload)
    assert response.status_code == 400
    assert "Invalid ward entitlement" in response.json()["detail"]
