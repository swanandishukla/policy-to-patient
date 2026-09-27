"""
Pydantic response schemas for the API.
Phase 1: PDF policy upload, page extraction, TOC detection, and neutral term mentions.
Phase 2: RAG Q&A retrieval and grounded answer responses.
Phase 3: Curated treatment rate benchmark dataset and transparent estimate calculator.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    app: str
    status: str
    version: str


class ServiceInfoResponse(BaseModel):
    app: str
    description: str
    version: str
    phase: str
    endpoints: List[str]


class TOCEntrySchema(BaseModel):
    title: str
    printed_page: int
    toc_page_number: int
    is_toc_entry: bool = True


class TermSnippetSchema(BaseModel):
    page: int
    snippet: str


class TermMentionSchema(BaseModel):
    key: str
    label: str
    is_mentioned: bool
    mention_count: int
    page_references: List[int]
    in_toc_only: bool
    snippets: List[TermSnippetSchema]


class PolicySectionSchema(BaseModel):
    section_title: str
    page_number: int
    printed_page: Optional[int] = None
    text_preview: str
    full_text: str
    char_count: int
    is_toc_entry: bool = False


class PageDataSchema(BaseModel):
    page: int
    text: str
    character_count: int
    has_text: bool = True
    is_scanned_warning: bool = False


class PolicyUploadResponse(BaseModel):
    success: bool
    filename: str
    total_pages: int
    total_characters: int
    empty_pages_count: int
    sections_count: int
    toc_entries: List[TOCEntrySchema]
    sections: List[PolicySectionSchema]
    term_mentions: Dict[str, TermMentionSchema]
    pages: List[PageDataSchema]
    warnings: List[str]
    message: str


class EvidencePassageSchema(BaseModel):
    chunk_id: str
    page_number: int
    section_title: str
    text: str
    relevance_score: float


class PolicyQAResponse(BaseModel):
    question: str
    filename: str
    answer: str
    is_grounded: bool
    has_sufficient_evidence: bool
    llm_configured: bool
    citations: List[str]
    evidence_passages: List[EvidencePassageSchema]
    warning: Optional[str] = None


class ActiveDocumentInfoResponse(BaseModel):
    has_active_document: bool
    filename: Optional[str] = None
    total_pages: Optional[int] = None
    total_chunks: Optional[int] = None


class ProcedureItemSchema(BaseModel):
    procedure_code: str
    procedure_name: str
    speciality: str
    city_category: str
    hospital_accreditation_options: List[str]
    ward_entitlement_options: List[str]
    is_ward_dependent: bool
    rate_unit_or_package_basis: str
    source_page_or_table: str


class ProceduresListResponse(BaseModel):
    total_count: int
    source_metadata: Dict[str, Any]
    procedures: List[ProcedureItemSchema]


class SourceDetailsSchema(BaseModel):
    source_document: str
    source_url: str
    effective_from: str
    source_page_or_table: str
    verification_status: str
    notes: str


class TreatmentEstimateResponse(BaseModel):
    procedure_code: str
    procedure_name: str
    speciality: str
    city_category: str
    hospital_accreditation: str
    ward_entitlement: str
    base_rate_inr: float
    is_ward_dependent: bool
    ward_adjustment_percent: float
    ward_adjustment_inr: float
    final_benchmark_rate_inr: float
    rate_unit_or_package_basis: str
    calculation_breakdown: str
    source_details: SourceDetailsSchema
    disclaimer: str
