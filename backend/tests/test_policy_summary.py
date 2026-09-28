"""
Unit and API integration tests for PolicySummaryService (Milestone C).
Verifies automatic policy summary card generation for 6 fixed categories,
physical PDF page citations, active policy document updates, and insufficient-evidence handling.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.document_store import DocumentStore
from app.services.policy_summary_service import PolicySummaryService

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_document_store():
    """Ensure DocumentStore state is cleared before and after each test."""
    DocumentStore.clear()
    yield
    DocumentStore.clear()


def test_policy_summary_no_active_policy():
    """1. Test GET /api/policy/summary when no policy is loaded in DocumentStore."""
    response = client.get("/api/policy/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["has_active_policy"] is False
    assert data["filename"] is None
    assert data["categories"] == []
    assert "No active policy" in data["message"]


def test_policy_summary_all_6_fixed_categories_generated():
    """2. Test summary generation returns all 6 fixed categories when active document exists."""
    fake_extracted = {
        "filename": "star_comprehensive_health.pdf",
        "total_pages": 40,
        "total_characters": 15000,
        "pages": [
            {
                "page": 5,
                "text": "Waiting Periods: Initial waiting period of 30 days applies from inception. Specific disease waiting period of 24 months applies for Cataract.",
                "has_text": True
            },
            {
                "page": 12,
                "text": "Room Rent Limit: Expenses for Room, Boarding and Nursing capped at 1% of Sum Insured per day. ICU capped at 2%.",
                "has_text": True
            },
            {
                "page": 18,
                "text": "Co-payment: A mandatory co-payment of 10% applies to all claims for persons aged 60 and above.",
                "has_text": True
            },
            {
                "page": 22,
                "text": "Key Exclusions: Treatment for alcoholism, cosmetic surgery, weight loss surgery, and intentional self-injury are permanently excluded.",
                "has_text": True
            },
            {
                "page": 31,
                "text": "Pre-existing Disease (PED): Pre-existing conditions are covered after a waiting period of 36 months of continuous coverage.",
                "has_text": True
            },
            {
                "page": 35,
                "text": "Sum Insured: The maximum aggregate liability of the company for all claims in a policy year shall not exceed the Sum Insured specified in the Policy Schedule.",
                "has_text": True
            }
        ],
        "toc_entries": [],
        "sections": [
            {"page_number": 5, "section_title": "Section B.1 Waiting Periods"},
            {"page_number": 12, "section_title": "Section B.2 Room Rent & ICU"},
            {"page_number": 18, "section_title": "Section B.3 Co-Pay Clause"},
            {"page_number": 22, "section_title": "Section C Permanent Exclusions"},
            {"page_number": 31, "section_title": "Section D Pre-Existing Disease"},
            {"page_number": 35, "section_title": "Section E Policy Schedule & Sum Insured"}
        ]
    }
    DocumentStore.set_active_document(fake_extracted)

    response = client.get("/api/policy/summary")
    assert response.status_code == 200
    data = response.json()

    assert data["has_active_policy"] is True
    assert data["filename"] == "star_comprehensive_health.pdf"
    assert data["total_pages"] == 40

    categories = data["categories"]
    assert len(categories) == 6

    cat_keys = [c["category_key"] for c in categories]
    assert cat_keys == [
        "waiting_periods",
        "room_rent_limit",
        "co_payment",
        "key_exclusions",
        "pre_existing_disease",
        "sum_insured"
    ]

    # Verify each card has evidence and correct physical page citations
    for c in categories:
        assert c["has_evidence"] is True
        assert c["page_number"] in [5, 12, 18, 22, 31, 35]
        assert isinstance(c["section_title"], str)
        assert len(c["evidence_snippet"]) > 10

    # Specific check for sum_insured note preventing misrepresentation
    sum_insured_card = next(c for c in categories if c["category_key"] == "sum_insured")
    assert "individual selected Sum Insured must be confirmed on your Policy Schedule" in sum_insured_card["summary_text"]


def test_policy_summary_insufficient_evidence_category():
    """3. Test that categories without matching policy text return has_evidence=False."""
    # Active document containing ONLY waiting period text
    fake_extracted_sparse = {
        "filename": "sparse_policy.pdf",
        "total_pages": 5,
        "total_characters": 1000,
        "pages": [
            {
                "page": 1,
                "text": "Notice: Waiting Period of 30 days applies for all illness claims except emergency accident treatment.",
                "has_text": True
            }
        ],
        "toc_entries": [],
        "sections": [{"page_number": 1, "section_title": "General Waiting Period"}]
    }
    DocumentStore.set_active_document(fake_extracted_sparse)

    response = client.get("/api/policy/summary")
    assert response.status_code == 200
    data = response.json()

    categories = data["categories"]
    assert len(categories) == 6

    # waiting_periods card should have evidence
    wp_card = next(c for c in categories if c["category_key"] == "waiting_periods")
    assert wp_card["has_evidence"] is True
    assert wp_card["page_number"] == 1

    # room_rent_limit card should have no evidence
    rr_card = next(c for c in categories if c["category_key"] == "room_rent_limit")
    assert rr_card["has_evidence"] is False
    assert rr_card["page_number"] is None
    assert "No relevant clause was found" in rr_card["summary_text"]


def test_policy_summary_refreshes_on_active_policy_change():
    """4. Test that changing the active document instantly updates summary results."""
    # Document 1
    doc1 = {
        "filename": "policy_alpha.pdf",
        "total_pages": 10,
        "pages": [{"page": 2, "text": "Co-payment of 20% applies to senior citizens.", "has_text": True}],
        "sections": [{"page_number": 2, "section_title": "Alpha Copay"}]
    }
    DocumentStore.set_active_document(doc1)
    res1 = client.get("/api/policy/summary").json()
    assert res1["filename"] == "policy_alpha.pdf"

    # Document 2 (Upload new policy)
    doc2 = {
        "filename": "policy_beta.pdf",
        "total_pages": 25,
        "pages": [{"page": 9, "text": "Room Rent Limit capped at single private room.", "has_text": True}],
        "sections": [{"page_number": 9, "section_title": "Beta Room Rent"}]
    }
    DocumentStore.set_active_document(doc2)
    res2 = client.get("/api/policy/summary").json()
    assert res2["filename"] == "policy_beta.pdf"
    assert res2["total_pages"] == 25
    assert res2["filename"] != res1["filename"]
