"""
Unit and API integration tests for CoverageCalculationService (Milestone B).
Verifies deterministic coverage calculation, arithmetic reasoning trails,
input validation, and error sanitization.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.coverage_service import CoverageCalculationService
from app.services.rate_service import RateNotFoundError, InvalidSelectionError

client = TestClient(app)


def test_coverage_no_sublimit_zero_copay():
    """1. No sub-limit, zero co-pay."""
    res = CoverageCalculationService.calculate_coverage_estimate(
        procedure_code="OP099",
        hospital_accreditation="NABH",
        ward_entitlement="Semi-Private Ward",
        sum_insured=500000.0,
        co_pay_percent=0.0,
        applicable_sub_limit=None
    )
    assert res["benchmark_amount_inr"] == 13400.0
    assert res["applicable_amount_inr"] == 13400.0
    assert res["estimated_insurer_payable_inr"] == 13400.0
    assert res["estimated_out_of_pocket_inr"] == 0.0
    assert len(res["reasoning_trail"]) == 5
    assert "User-entered" in res["provenance_notes"]["verification_status"]


def test_coverage_no_sublimit_nonzero_copay():
    """2. No sub-limit, 10% co-pay."""
    res = CoverageCalculationService.calculate_coverage_estimate(
        procedure_code="OP099",
        hospital_accreditation="NABH",
        ward_entitlement="Semi-Private Ward",
        sum_insured=500000.0,
        co_pay_percent=10.0,
        applicable_sub_limit=None
    )
    # 13400 * 0.9 = 12060 payable, 1340 out of pocket
    assert res["benchmark_amount_inr"] == 13400.0
    assert res["estimated_insurer_payable_inr"] == 12060.0
    assert res["estimated_out_of_pocket_inr"] == 1340.0


def test_coverage_sublimit_below_benchmark():
    """3. Sub-limit below the benchmark (e.g. Cataract sub-limit ₹10,000 vs ₹13,400 benchmark)."""
    res = CoverageCalculationService.calculate_coverage_estimate(
        procedure_code="OP099",
        hospital_accreditation="NABH",
        ward_entitlement="Semi-Private Ward",
        sum_insured=500000.0,
        co_pay_percent=10.0,
        applicable_sub_limit=10000.0
    )
    # applicable_amount = min(13400, 10000) = 10000
    # insurer payable = 10000 * 0.9 = 9000
    # out of pocket = 13400 - 9000 = 4400
    assert res["benchmark_amount_inr"] == 13400.0
    assert res["user_sub_limit_inr"] == 10000.0
    assert res["applicable_amount_inr"] == 10000.0
    assert res["estimated_insurer_payable_inr"] == 9000.0
    assert res["estimated_out_of_pocket_inr"] == 4400.0


def test_coverage_sublimit_above_benchmark():
    """4. Sub-limit above the benchmark (e.g. ₹50,000 sub-limit vs ₹13,400 benchmark)."""
    res = CoverageCalculationService.calculate_coverage_estimate(
        procedure_code="OP099",
        hospital_accreditation="NABH",
        ward_entitlement="Semi-Private Ward",
        sum_insured=500000.0,
        co_pay_percent=20.0,
        applicable_sub_limit=50000.0
    )
    # applicable_amount = min(13400, 50000) = 13400
    # insurer payable = 13400 * 0.8 = 10720
    # out of pocket = 13400 - 10720 = 2680
    assert res["benchmark_amount_inr"] == 13400.0
    assert res["applicable_amount_inr"] == 13400.0
    assert res["estimated_insurer_payable_inr"] == 10720.0
    assert res["estimated_out_of_pocket_inr"] == 2680.0


def test_coverage_100_percent_copay():
    """5. 100% co-pay."""
    res = CoverageCalculationService.calculate_coverage_estimate(
        procedure_code="OP099",
        hospital_accreditation="NABH",
        ward_entitlement="Semi-Private Ward",
        sum_insured=500000.0,
        co_pay_percent=100.0,
        applicable_sub_limit=None
    )
    assert res["estimated_insurer_payable_inr"] == 0.0
    assert res["estimated_out_of_pocket_inr"] == 13400.0


def test_coverage_invalid_copay_percent():
    """6. Invalid co-pay below 0 or above 100."""
    with pytest.raises(ValueError):
        CoverageCalculationService.calculate_coverage_estimate(
            procedure_code="OP099",
            hospital_accreditation="NABH",
            ward_entitlement="Semi-Private Ward",
            sum_insured=500000.0,
            co_pay_percent=-5.0
        )

    with pytest.raises(ValueError):
        CoverageCalculationService.calculate_coverage_estimate(
            procedure_code="OP099",
            hospital_accreditation="NABH",
            ward_entitlement="Semi-Private Ward",
            sum_insured=500000.0,
            co_pay_percent=105.0
        )


def test_coverage_negative_or_malformed_values():
    """7. Negative or malformed monetary values."""
    with pytest.raises(ValueError):
        CoverageCalculationService.calculate_coverage_estimate(
            procedure_code="OP099",
            hospital_accreditation="NABH",
            ward_entitlement="Semi-Private Ward",
            sum_insured=-100.0
        )

    with pytest.raises(ValueError):
        CoverageCalculationService.calculate_coverage_estimate(
            procedure_code="OP099",
            hospital_accreditation="NABH",
            ward_entitlement="Semi-Private Ward",
            sum_insured=500000.0,
            applicable_sub_limit=-5000.0
        )


def test_api_coverage_calculate_missing_sum_insured():
    """8. Missing required sum insured via API returns 422 Unprocessable Entity."""
    payload = {
        "procedure_code": "OP099",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward",
        "co_pay_percent": 10.0
    }
    response = client.post("/api/coverage/calculate", json=payload)
    assert response.status_code == 422


def test_api_coverage_calculate_unknown_procedure():
    """9. Unknown procedure returns 404 Not Found."""
    payload = {
        "procedure_code": "UNKNOWN_999",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward",
        "sum_insured": 500000.0
    }
    response = client.post("/api/coverage/calculate", json=payload)
    assert response.status_code == 404


def test_api_coverage_calculate_valid_reasoning_trail_and_provenance():
    """10 & 11. Valid API request returns structured reasoning trail and user-entered provenance."""
    payload = {
        "procedure_code": "OP099",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward",
        "city_category": "Tier 1 (X City)",
        "sum_insured": 500000.0,
        "co_pay_percent": 15.0,
        "applicable_sub_limit": 12000.0,
        "copay_clause_reference": "Section C.4",
        "sublimit_clause_reference": "Page 31 Clause 3"
    }
    response = client.post("/api/coverage/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["procedure_code"] == "OP099"
    assert data["benchmark_amount_inr"] == 13400.0
    assert data["user_sum_insured_inr"] == 500000.0
    assert data["user_co_pay_percent"] == 15.0
    assert data["user_sub_limit_inr"] == 12000.0
    assert data["applicable_amount_inr"] == 12000.0
    assert data["estimated_insurer_payable_inr"] == 10200.0  # 12000 * 0.85
    assert data["estimated_out_of_pocket_inr"] == 3200.0   # 13400 - 10200

    assert len(data["reasoning_trail"]) == 5
    assert "Section C.4" in data["provenance_notes"]["co_pay"]
    assert "Page 31 Clause 3" in data["provenance_notes"]["sub_limit"]
    assert "User-entered" in data["provenance_notes"]["verification_status"]
    assert "Disclaimer:" in data["disclaimer"]
