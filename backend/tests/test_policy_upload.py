"""
Comprehensive unit & integration tests for PDF policy upload, PyMuPDF extraction,
TOC detection, neutral term mentions, file validation, and real policy PDF verification.
"""

import os
import fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.pdf_extractor import MAX_FILE_SIZE_BYTES

client = TestClient(app)


def create_sample_pdf_bytes(title: str = "Sample Policy") -> bytes:
    """Helper to generate a minimal valid 2-page sample PDF in memory."""
    doc = fitz.open()
    
    # Page 1: TOC Page
    page1 = doc.new_page()
    page1.insert_text(
        (50, 50),
        "Table of Contents\nParticulars Page No.\n1. Base Coverage 2\n2. Waiting Periods 2\n"
    )
    
    # Page 2: Body Page
    page2 = doc.new_page()
    page2.insert_text(
        (50, 50),
        "SECTION B. Base Coverage\nThis health insurance policy covers hospital room rent, ICU charges, and day care procedures.\n"
        "SECTION C. Waiting Periods\nInitial waiting period of 30 days applies. Co-payment of 10% is required."
    )
    
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_upload_policy_pdf_success():
    pdf_bytes = create_sample_pdf_bytes()
    response = client.post(
        "/api/policy/upload",
        files={"file": ("sample_policy.pdf", pdf_bytes, "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["filename"] == "sample_policy.pdf"
    assert data["total_pages"] == 2
    assert "term_mentions" in data
    assert data["term_mentions"]["room_rent"]["is_mentioned"] is True
    assert data["term_mentions"]["room_rent"]["page_references"] == [2]
    assert len(data["term_mentions"]["room_rent"]["snippets"]) > 0


def test_real_policy_wording_pdf_verification():
    """Verify real policy PDF at data/policies/policy_wording.pdf programmatically."""
    real_pdf_path = os.path.join("..", "data", "policies", "policy_wording.pdf")
    assert os.path.exists(real_pdf_path), f"Real policy PDF not found at {real_pdf_path}"

    with open(real_pdf_path, "rb") as f:
        pdf_bytes = f.read()

    response = client.post(
        "/api/policy/upload",
        files={"file": ("policy_wording.pdf", pdf_bytes, "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()

    # Confirm actual PDF physical page count = 69
    assert data["total_pages"] == 69
    assert len(data["pages"]) == 69

    # Check 1-indexed page numbering
    assert data["pages"][0]["page"] == 1
    assert data["pages"][68]["page"] == 69

    # Verify TOC entries detected from Page 1
    assert len(data["toc_entries"]) >= 10
    toc_titles = [t["title"] for t in data["toc_entries"]]
    assert any("Waiting Periods" in title for title in toc_titles)

    # Check neutral term mentions
    mentions = data["term_mentions"]
    assert mentions["room_rent"]["is_mentioned"] is True
    assert mentions["waiting_period"]["is_mentioned"] is True
    assert mentions["copay"]["is_mentioned"] is True

    # Check page references for room_rent
    assert len(mentions["room_rent"]["page_references"]) > 0
    # Room rent is mentioned on physical page 8 (Def. 41 Room Rent)
    assert 8 in mentions["room_rent"]["page_references"]


def test_upload_non_pdf_fails():
    response = client.post(
        "/api/policy/upload",
        files={"file": ("test.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 400
    assert "Only PDF files are supported" in response.json()["detail"]


def test_fake_pdf_magic_bytes_fails():
    """Text file renamed as .pdf should be rejected by magic bytes check."""
    fake_pdf = b"This is not a PDF header, it is plain text."
    response = client.post(
        "/api/policy/upload",
        files={"file": ("fake.pdf", fake_pdf, "application/pdf")}
    )
    assert response.status_code == 400
    assert "Invalid PDF file format" in response.json()["detail"]


def test_malformed_unreadable_pdf_fails():
    """Malformed PDF starting with %PDF- but containing corrupt structure."""
    corrupt_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nCORRUPT_GARBAGE_DATA_WITHOUT_XREF"
    response = client.post(
        "/api/policy/upload",
        files={"file": ("corrupt.pdf", corrupt_pdf, "application/pdf")}
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "0 pages" in detail or "failed to parse" in detail or "corrupt" in detail


def test_valid_pdf_no_extractable_text_warning():
    """Valid PDF containing blank page with no text layer."""
    doc = fitz.open()
    doc.new_page()  # Blank page
    pdf_bytes = doc.tobytes()
    doc.close()

    response = client.post(
        "/api/policy/upload",
        files={"file": ("blank.pdf", pdf_bytes, "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_pages"] == 1
    assert data["pages"][0]["has_text"] is False
    assert data["pages"][0]["is_scanned_warning"] is True
    assert len(data["warnings"]) > 0
    assert "no extractable text" in data["warnings"][0].lower()


def test_upload_empty_file_fails():
    response = client.post(
        "/api/policy/upload",
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_oversized_file_fails():
    """Files exceeding 15 MB limit should be rejected."""
    large_bytes = b"%PDF-1.4 " + b"0" * (MAX_FILE_SIZE_BYTES + 100)
    response = client.post(
        "/api/policy/upload",
        files={"file": ("large.pdf", large_bytes, "application/pdf")}
    )
    assert response.status_code == 400
    assert "exceeds maximum allowed limit" in response.json()["detail"]


def test_encrypted_pdf_rejection():
    """Test handling of encrypted/password-protected PDFs."""
    doc = fitz.open()
    doc.new_page()
    encrypt_perm = fitz.PDF_PERM_ACCESSIBILITY
    pdf_bytes = doc.tobytes(encryption=fitz.PDF_ENCRYPT_AES_256, owner_pw="owner", user_pw="user", permissions=encrypt_perm)
    doc.close()

    response = client.post(
        "/api/policy/upload",
        files={"file": ("encrypted.pdf", pdf_bytes, "application/pdf")}
    )
    assert response.status_code == 400
    assert "encrypted" in response.json()["detail"].lower() or "password" in response.json()["detail"].lower()
