"""
API routes for Policy-to-Patient.
Phase 1: PDF policy upload, page extraction, TOC detection, and neutral term mentions.
Phase 2: RAG policy retrieval and grounded question-answering.
Phase 3: Curated treatment rate benchmark dataset and transparent estimate calculator.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.schemas.requests import PolicyQARequest, TreatmentEstimateRequest
from app.schemas.responses import (
    HealthResponse,
    ServiceInfoResponse,
    PolicyUploadResponse,
    PolicyQAResponse,
    ActiveDocumentInfoResponse,
    ProceduresListResponse,
    TreatmentEstimateResponse,
    ProcedureItemSchema
)
from app.services.pdf_extractor import PolicyExtractor, PDFExtractionError, MAX_FILE_SIZE_BYTES
from app.services.document_store import DocumentStore
from app.services.qa_service import PolicyQAService
from app.services.rate_service import (
    RateService,
    RateServiceError,
    RateNotFoundError,
    InvalidSelectionError
)

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Return application health status."""
    return HealthResponse(
        app="Policy-to-Patient",
        status="ok",
        version="0.4.0",
    )


@router.get("/", response_model=ServiceInfoResponse)
async def service_info():
    """Return concise service information."""
    return ServiceInfoResponse(
        app="Policy-to-Patient",
        description="Insurance Coverage & Treatment Cost Intelligence Assistant",
        version="0.4.0",
        phase="Phase 3 — Treatment Rate Dataset & Transparent Estimate Calculator",
        endpoints=[
            "/api/ — Service information",
            "/api/health — Health check",
            "/api/policy/upload — Upload & extract policy PDF",
            "/api/policy/active — Get active uploaded policy status",
            "/api/policy/qa — Ask questions against active policy",
            "/api/rates/procedures — List verified procedure benchmark dataset",
            "/api/rates/estimate — Calculate transparent treatment estimate",
        ],
    )


@router.get("/policy/active", response_model=ActiveDocumentInfoResponse)
async def get_active_policy():
    """Return information about the currently active uploaded policy document."""
    active_doc = DocumentStore.get_active_document()
    if not active_doc:
        return ActiveDocumentInfoResponse(has_active_document=False)
    
    return ActiveDocumentInfoResponse(
        has_active_document=True,
        filename=active_doc["filename"],
        total_pages=active_doc["total_pages"],
        total_chunks=len(active_doc.get("chunks", []))
    )


@router.post("/policy/upload", response_model=PolicyUploadResponse)
async def upload_policy(file: UploadFile = File(...)):
    """
    Upload a health insurance policy PDF, extract text & structure, and index it for Q&A retrieval.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported. Please upload a valid .pdf document."
        )

    try:
        contents = await file.read()
        
        # Enforce size & validation
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size ({len(contents) / (1024*1024):.1f} MB) exceeds maximum allowed limit of 15 MB."
            )

        extracted = PolicyExtractor.extract_from_bytes(contents, filename=file.filename)
        
        # Index newly uploaded document in DocumentStore for Q&A
        DocumentStore.set_active_document(extracted)

        return PolicyUploadResponse(
            success=True,
            filename=extracted["filename"],
            total_pages=extracted["total_pages"],
            total_characters=extracted["total_characters"],
            empty_pages_count=extracted["empty_pages_count"],
            sections_count=extracted["sections_count"],
            toc_entries=extracted["toc_entries"],
            sections=extracted["sections"],
            term_mentions=extracted["term_mentions"],
            pages=extracted["pages"],
            warnings=extracted["warnings"],
            message=f"Successfully extracted {extracted['total_pages']} pages and indexed for Q&A retrieval from {file.filename}."
        )

    except PDFExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the PDF file. Please verify the document is not corrupt."
        )


@router.post("/policy/qa", response_model=PolicyQAResponse)
async def ask_policy_question(payload: PolicyQARequest):
    """
    Ask a question against the currently active uploaded policy document using RAG.
    """
    if not payload.question or not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty. Please enter a valid question."
        )

    if not DocumentStore.has_active_document():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active policy document found. Please upload a policy PDF first before asking questions."
        )

    try:
        result = PolicyQAService.answer_question(payload.question.strip())
        return PolicyQAResponse(**result)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process question: {str(e)}"
        )


@router.get("/rates/procedures", response_model=ProceduresListResponse)
async def list_rate_procedures():
    """
    List all verified procedure benchmark entries and dataset metadata.
    """
    try:
        procedures = RateService.list_procedures()
        metadata = RateService.get_source_metadata()
        return ProceduresListResponse(
            total_count=len(procedures),
            source_metadata=metadata,
            procedures=[ProcedureItemSchema(**p) for p in procedures]
        )
    except RateServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rate dataset error: {str(e)}"
        )


@router.post("/rates/estimate", response_model=TreatmentEstimateResponse)
async def calculate_treatment_estimate(payload: TreatmentEstimateRequest):
    """
    Calculate exact, transparent rate estimate for selected procedure, accreditation, and ward category.
    """
    try:
        result = RateService.calculate_estimate(
            procedure_code=payload.procedure_code,
            hospital_accreditation=payload.hospital_accreditation,
            ward_entitlement=payload.ward_entitlement,
            city_category=payload.city_category
        )
        return TreatmentEstimateResponse(**result)
    except RateNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except InvalidSelectionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RateServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Estimate calculation error: {str(e)}"
        )
