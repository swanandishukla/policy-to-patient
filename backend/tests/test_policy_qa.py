"""
Unit and integration tests for Phase 2 RAG Policy Q&A pipeline.
Tests text chunking, page retention, TOC exclusion, passage retrieval,
grounded citations, missing API key handling, and DocumentStore reset behavior.
"""

import os
import fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.pdf_extractor import PolicyExtractor
from app.services.document_store import DocumentStore
from app.services.policy_retriever import PolicyRetriever
from app.services.qa_service import PolicyQAService

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_document_store():
    """Reset DocumentStore state before each test."""
    DocumentStore.clear()
    yield
    DocumentStore.clear()


def create_sample_policy_bytes() -> bytes:
    """Helper to generate a valid 3-page sample PDF in memory."""
    doc = fitz.open()

    # Page 1: TOC
    p1 = doc.new_page()
    p1.insert_text((50, 50), "Table of Contents\nParticulars Page No.\n1. Room Rent 2\n2. Exclusions 3\n")

    # Page 2: Room Rent Clause
    p2 = doc.new_page()
    p2.insert_text((50, 50), "SECTION 1. Room Rent Coverage\nRoom rent limit is capped at Rs. 5,000 per day for normal rooms and Rs. 10,000 for ICU boarding.")

    # Page 3: Exclusions Clause
    p3 = doc.new_page()
    p3.insert_text((50, 50), "SECTION 2. Exclusions\nCosmetic surgery, obesity treatment, and unproven therapies are permanently excluded from coverage.")

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_chunking_preserves_page_numbers_and_sections():
    """Verify chunking preserves 1-indexed physical page numbers and section headers."""
    pdf_bytes = create_sample_policy_bytes()
    extracted = PolicyExtractor.extract_from_bytes(pdf_bytes, "sample.pdf")
    doc_rec = DocumentStore.set_active_document(extracted)

    chunks = doc_rec["chunks"]
    assert len(chunks) > 0

    # Physical Page 1 (TOC) must be excluded from clause chunks
    page_numbers = {c["page_number"] for c in chunks}
    assert 1 not in page_numbers
    assert 2 in page_numbers
    assert 3 in page_numbers

    # Verify section titles
    p2_chunk = next(c for c in chunks if c["page_number"] == 2)
    assert "Room Rent" in p2_chunk["section_title"]
    assert "chk_p2_" in p2_chunk["chunk_id"]


def test_qa_retrieves_relevant_passages():
    """Verify asking a question retrieves matching page passages."""
    pdf_bytes = create_sample_policy_bytes()
    client.post("/api/policy/upload", files={"file": ("sample.pdf", pdf_bytes, "application/pdf")})

    response = client.post("/api/policy/qa", json={"question": "What is the room rent limit?"})
    assert response.status_code == 200
    data = response.json()
    assert data["has_sufficient_evidence"] is True
    assert len(data["evidence_passages"]) > 0

    # Top passage should be from Page 2
    top_passage = data["evidence_passages"][0]
    assert top_passage["page_number"] == 2
    assert "Rs. 5,000" in top_passage["text"]


def test_qa_insufficient_evidence_for_unrelated_query():
    """Verify query with no evidence in document returns insufficient evidence state."""
    pdf_bytes = create_sample_policy_bytes()
    client.post("/api/policy/upload", files={"file": ("sample.pdf", pdf_bytes, "application/pdf")})

    response = client.post("/api/policy/qa", json={"question": "What is the policy limit for quantum computing equipment?"})
    assert response.status_code == 200
    data = response.json()
    assert data["has_sufficient_evidence"] is False
    assert "not enough" in data["answer"].lower()


def test_missing_api_key_returns_clear_configuration_notice():
    """Verify missing GEMINI_API_KEY returns helpful notice without fabricated AI answer."""
    # Ensure GEMINI_API_KEY is not set or placeholder
    original_key = os.environ.get("GEMINI_API_KEY")
    if "GEMINI_API_KEY" in os.environ:
        del os.environ["GEMINI_API_KEY"]

    try:
        pdf_bytes = create_sample_policy_bytes()
        client.post("/api/policy/upload", files={"file": ("sample.pdf", pdf_bytes, "application/pdf")})

        response = client.post("/api/policy/qa", json={"question": "What is the room rent cap?"})
        assert response.status_code == 200
        data = response.json()

        assert data["llm_configured"] is False
        assert data["has_sufficient_evidence"] is True
        assert len(data["evidence_passages"]) > 0
        assert "GEMINI_API_KEY" in data["answer"] or "GEMINI_API_KEY" in (data["warning"] or "")
    finally:
        if original_key:
            os.environ["GEMINI_API_KEY"] = original_key


def test_qa_without_uploaded_document_fails():
    """Verify Q&A fails cleanly with HTTP 400 when no document has been uploaded."""
    response = client.post("/api/policy/qa", json={"question": "What is covered?"})
    assert response.status_code == 400
    assert "No active policy document found" in response.json()["detail"]


def test_uploading_new_policy_resets_document_store():
    """Verify uploading a new PDF completely overwrites the active document store."""
    pdf1 = create_sample_policy_bytes()
    client.post("/api/policy/upload", files={"file": ("first_policy.pdf", pdf1, "application/pdf")})
    assert DocumentStore.get_active_document()["filename"] == "first_policy.pdf"

    # Upload second PDF
    doc2 = fitz.open()
    p = doc2.new_page()
    p.insert_text((50, 50), "SECTION 1. Dental Care Coverage\nDental procedures covered up to Rs 20000.")
    pdf2 = doc2.tobytes()
    doc2.close()

    client.post("/api/policy/upload", files={"file": ("second_policy.pdf", pdf2, "application/pdf")})
    assert DocumentStore.get_active_document()["filename"] == "second_policy.pdf"

    # Ask question on new policy
    res = client.post("/api/policy/qa", json={"question": "What is covered for dental?"})
    assert res.status_code == 200
    assert res.json()["filename"] == "second_policy.pdf"


def test_real_policy_wording_pdf_qa_smoke_test():
    """Smoke test Q&A on real policy_wording.pdf."""
    real_pdf_path = os.path.join("..", "data", "policies", "policy_wording.pdf")
    if not os.path.exists(real_pdf_path):
        pytest.skip("Real policy PDF not found")

    with open(real_pdf_path, "rb") as f:
        pdf_bytes = f.read()

    upload_res = client.post("/api/policy/upload", files={"file": ("policy_wording.pdf", pdf_bytes, "application/pdf")})
    assert upload_res.status_code == 200

    qa_res = client.post("/api/policy/qa", json={"question": "What is the waiting period for pre-existing disease?"})
    assert qa_res.status_code == 200
    data = qa_res.json()
    assert data["has_sufficient_evidence"] is True
    assert len(data["evidence_passages"]) > 0
    # Confirm citations contain page references
    assert len(data["citations"]) > 0
    assert "Page" in data["citations"][0]
