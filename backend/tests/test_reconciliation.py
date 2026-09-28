"""
Focused service-level unit tests for PolicyReconciliationService (Phase 4 Milestone 4.2).
Tests deterministic reconciliation logic without external network dependencies.
"""

import pytest
from app.services.reconciliation_service import PolicyReconciliationService
from app.services.rate_service import RateNotFoundError, InvalidSelectionError
from app.services.document_store import DocumentStore


@pytest.fixture(autouse=True)
def reset_document_store():
    """Ensure DocumentStore state is cleared before and after each test."""
    DocumentStore.clear()
    yield
    DocumentStore.clear()


def test_reconcile_no_active_policy():
    """Test reconciliation behavior when no policy document is loaded in DocumentStore."""
    res = PolicyReconciliationService.reconcile_policy_and_treatment(
        procedure_code="OP099",
        hospital_accreditation="NABH",
        ward_entitlement="Semi-Private Ward"
    )

    assert res.has_active_policy is False
    assert res.policy_filename is None
    assert res.has_relevant_clauses is False
    assert res.retrieved_policy_clauses == []
    assert res.benchmark_rate is not None
    assert res.benchmark_rate.final_benchmark_rate_inr == 13400.0
    assert "No policy document is currently uploaded" in res.clause_summary
    assert "Confirm how lens/IOL costs are treated" in res.tpa_verification_checklist[1]
    # Verify no coverage verdict
    assert "covered" not in res.clause_summary.lower()
    assert "reimbursable" not in res.clause_summary.lower()


def test_reconcile_active_policy_with_relevant_clauses():
    """Test reconciliation with an active indexed policy PDF containing relevant procedure clauses."""
    # Mock active document in DocumentStore
    fake_extracted = {
        "filename": "sample_health_policy.pdf",
        "total_pages": 40,
        "total_characters": 15000,
        "pages": [
            {
                "page": 31,
                "text": "Section C.1.b Specified Disease waiting period: Cataract and disorders of lens are excluded for 24 months from inception.",
                "has_text": True
            },
            {
                "page": 11,
                "text": "In-patient care and Day Care treatment expenses for surgical procedures undertaken in less than 24 hours.",
                "has_text": True
            }
        ],
        "toc_entries": [],
        "sections": [{"page_number": 31, "section_title": "Specified Disease Waiting Period"}]
    }
    DocumentStore.set_active_document(fake_extracted)

    res = PolicyReconciliationService.reconcile_policy_and_treatment(
        procedure_code="OP099",
        hospital_accreditation="NABH",
        ward_entitlement="Semi-Private Ward"
    )

    assert res.has_active_policy is True
    assert res.policy_filename == "sample_health_policy.pdf"
    assert res.has_relevant_clauses is True
    assert len(res.retrieved_policy_clauses) > 0

    # Verify physical page citation preservation
    first_clause = res.retrieved_policy_clauses[0]
    assert first_clause.page_number in [11, 31]
    assert "Cataract" in first_clause.text or "Day Care" in first_clause.text

    # Verify neutral grounded explanation & checklist
    assert "Page" in res.clause_summary
    assert "Confirm how lens/IOL costs are treated" in res.tpa_verification_checklist[1]

    # Enforce no financial verdicts
    assert "approved" not in res.clause_summary.lower()
    assert "reimbursement amount" not in res.clause_summary.lower()
    assert "out-of-pocket" not in res.clause_summary.lower()


def test_reconcile_active_policy_no_relevant_clauses():
    """Test reconciliation when active policy chunks contain no matches for procedure query."""
    # Policy document with unrelated content (e.g. travel insurance terms)
    fake_unrelated = {
        "filename": "unrelated_policy.pdf",
        "total_pages": 10,
        "total_characters": 3000,
        "pages": [
            {
                "page": 2,
                "text": "Baggage loss and flight delay reimbursement provisions for international travel.",
                "has_text": True
            }
        ],
        "toc_entries": [],
        "sections": []
    }
    DocumentStore.set_active_document(fake_unrelated)

    res = PolicyReconciliationService.reconcile_policy_and_treatment(
        procedure_code="OP099",
        hospital_accreditation="NABH",
        ward_entitlement="Semi-Private Ward"
    )

    assert res.has_active_policy is True
    assert res.policy_filename == "unrelated_policy.pdf"
    assert res.has_relevant_clauses is False
    assert res.retrieved_policy_clauses == []
    # Verify exact cautious wording required for missing search results
    assert "No relevant clause was found in the passages retrieved" in res.clause_summary


def test_reconcile_unknown_procedure_code():
    """Test 404 RateNotFoundError for unknown procedure code."""
    with pytest.raises(RateNotFoundError):
        PolicyReconciliationService.reconcile_policy_and_treatment(
            procedure_code="UNKNOWN_999",
            hospital_accreditation="NABH",
            ward_entitlement="Semi-Private Ward"
        )


def test_reconcile_invalid_accreditation():
    """Test 400 InvalidSelectionError for invalid hospital accreditation."""
    with pytest.raises(InvalidSelectionError):
        PolicyReconciliationService.reconcile_policy_and_treatment(
            procedure_code="OP099",
            hospital_accreditation="INVALID_FACILITY",
            ward_entitlement="Semi-Private Ward"
        )


# ============================================================================
# API Integration Tests (POST /api/policy/reconcile)
# ============================================================================

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_reconcile_valid_active_policy_with_relevant_clauses():
    """Integration test: Valid request with active policy and relevant clauses returns 200 OK."""
    fake_extracted = {
        "filename": "star_comprehensive_policy.pdf",
        "total_pages": 35,
        "total_characters": 12000,
        "pages": [
            {
                "page": 31,
                "text": "Specific waiting period: Cataract treatment expenses subject to 24 month waiting period.",
                "has_text": True
            }
        ],
        "toc_entries": [],
        "sections": []
    }
    DocumentStore.set_active_document(fake_extracted)

    payload = {
        "procedure_code": "OP099",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward",
        "city_category": "Tier 1 (X City)"
    }
    response = client.post("/api/policy/reconcile", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert data["has_active_policy"] is True
    assert data["policy_filename"] == "star_comprehensive_policy.pdf"
    assert data["has_relevant_clauses"] is True
    assert len(data["retrieved_policy_clauses"]) > 0
    assert data["retrieved_policy_clauses"][0]["page_number"] == 31
    assert "Cataract" in data["retrieved_policy_clauses"][0]["text"]
    assert data["benchmark_rate"]["procedure_code"] == "OP099"
    assert data["benchmark_rate"]["final_benchmark_rate_inr"] == 13400.0
    assert "Page 31" in data["clause_summary"]
    assert len(data["tpa_verification_checklist"]) > 0


def test_api_reconcile_valid_active_policy_no_relevant_clauses():
    """Integration test: Valid request with active policy but no matching clauses returns 200 OK."""
    fake_unrelated = {
        "filename": "dental_policy.pdf",
        "total_pages": 5,
        "total_characters": 2000,
        "pages": [
            {
                "page": 1,
                "text": "Routine dental cleaning and checkups are covered annually.",
                "has_text": True
            }
        ],
        "toc_entries": [],
        "sections": []
    }
    DocumentStore.set_active_document(fake_unrelated)

    payload = {
        "procedure_code": "OP099",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward"
    }
    response = client.post("/api/policy/reconcile", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert data["has_active_policy"] is True
    assert data["policy_filename"] == "dental_policy.pdf"
    assert data["has_relevant_clauses"] is False
    assert data["retrieved_policy_clauses"] == []
    assert "No relevant clause was found in the passages retrieved" in data["clause_summary"]
    assert data["benchmark_rate"]["procedure_code"] == "OP099"


def test_api_reconcile_valid_no_active_policy():
    """Integration test: Valid request when no active policy exists returns 200 OK informational response."""
    payload = {
        "procedure_code": "OP099",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward"
    }
    response = client.post("/api/policy/reconcile", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert data["has_active_policy"] is False
    assert data["policy_filename"] is None
    assert data["has_relevant_clauses"] is False
    assert data["retrieved_policy_clauses"] == []
    assert data["benchmark_rate"]["final_benchmark_rate_inr"] == 13400.0
    assert "No policy document is currently uploaded" in data["clause_summary"]


def test_api_reconcile_unknown_procedure_code():
    """Integration test: Unknown procedure code returns 404 Not Found without stack trace."""
    payload = {
        "procedure_code": "INVALID_PROC_999",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward"
    }
    response = client.post("/api/policy/reconcile", json=payload)

    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "INVALID_PROC_999" in data["detail"]
    assert "not available in the verified benchmark dataset" in data["detail"]
    assert "Traceback" not in response.text
    assert "Exception" not in response.text


def test_api_reconcile_invalid_accreditation_and_ward():
    """Integration test: Invalid accreditation or ward entitlement returns 400 Bad Request without stack trace."""
    # Invalid accreditation
    payload1 = {
        "procedure_code": "OP099",
        "hospital_accreditation": "NON_EXISTENT_ACCREDITATION",
        "ward_entitlement": "Semi-Private Ward"
    }
    response1 = client.post("/api/policy/reconcile", json=payload1)
    assert response1.status_code == 400
    data1 = response1.json()
    assert "Invalid accreditation" in data1["detail"]
    assert "Traceback" not in response1.text

    # Invalid ward entitlement
    payload2 = {
        "procedure_code": "OP099",
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Luxury Presidential Suite"
    }
    response2 = client.post("/api/policy/reconcile", json=payload2)
    assert response2.status_code == 400
    data2 = response2.json()
    assert "Invalid ward entitlement" in data2["detail"]
    assert "Traceback" not in response2.text


def test_api_reconcile_malformed_request_schema_validation():
    """Integration test: Missing required fields return 422 Unprocessable Entity standard validation response."""
    # Missing procedure_code
    payload = {
        "hospital_accreditation": "NABH",
        "ward_entitlement": "Semi-Private Ward"
    }
    response = client.post("/api/policy/reconcile", json=payload)

    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert data["detail"][0]["loc"] == ["body", "procedure_code"]
    assert data["detail"][0]["type"] == "missing"
    assert "Traceback" not in response.text


def test_api_reconcile_response_shape_and_citations():
    """Integration test: Verify response shape and exact physical page citations are preserved in json response."""
    fake_extracted = {
        "filename": "policy_wording.pdf",
        "total_pages": 40,
        "total_characters": 15000,
        "pages": [
            {
                "page": 11,
                "text": "In-patient treatment and day care procedures in less than 24 hours.",
                "has_text": True
            }
        ],
        "toc_entries": [],
        "sections": []
    }
    DocumentStore.set_active_document(fake_extracted)

    payload = {
        "procedure_code": "AG095",
        "hospital_accreditation": "Non-NABH",
        "ward_entitlement": "General Ward"
    }
    response = client.post("/api/policy/reconcile", json=payload)

    assert response.status_code == 200
    data = response.json()

    # Schema shape check
    assert "procedure_code" in data
    assert data["procedure_code"] == "AG095"
    assert "procedure_name" in data
    assert data["procedure_name"] == "Laparoscopic Appendectomy"
    assert "benchmark_rate" in data
    assert data["benchmark_rate"]["base_rate_inr"] == 28050.0
    assert data["benchmark_rate"]["final_benchmark_rate_inr"] == 26647.5
    assert data["benchmark_rate"]["hospital_accreditation"] == "Non-NABH"
    assert data["benchmark_rate"]["ward_entitlement"] == "General Ward"

    assert "retrieved_policy_clauses" in data
    assert isinstance(data["retrieved_policy_clauses"], list)
    for clause in data["retrieved_policy_clauses"]:
        assert "chunk_id" in clause
        assert "page_number" in clause
        assert isinstance(clause["page_number"], int)
        assert "section_title" in clause
        assert "text" in clause

    assert "clause_summary" in data
    assert "tpa_verification_checklist" in data
    assert isinstance(data["tpa_verification_checklist"], list)


