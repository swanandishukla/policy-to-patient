"""
Policy Reconciliation Service for Policy-to-Patient (Phase 4 Milestone 4.2).
Connects CGHS treatment rate benchmark estimates with grounded policy wording clause retrieval.
Does NOT make coverage verdicts, claim approvals, or out-of-pocket payment determinations.
"""

from typing import Dict, Any, List, Optional
from app.services.rate_service import RateService, RateNotFoundError, InvalidSelectionError
from app.services.document_store import DocumentStore
from app.services.policy_retriever import PolicyRetriever
from app.schemas.responses import (
    PolicyReconcileResponse,
    ReconciledClauseSchema,
    TreatmentEstimateResponse
)


class PolicyReconciliationService:
    """Service for reconciling treatment benchmarks with active policy wording clauses."""

    # Deterministic search query mapping for curated procedures
    PROCEDURE_QUERY_MAP: Dict[str, str] = {
        "CN001": "consultation OPD doctor medical practitioner examination",
        "LB055": "blood glucose test laboratory investigation sample",
        "CI001": "electrocardiogram ECG test cardiology investigation leads",
        "RI034": "X Ray chest radiological investigation film",
        "RI001": "2D echocardiography diagnostic investigation heart",
        "RI089": "MRI Head Brain diagnostic scan investigation contrast",
        "OP099": "cataract lens surgery specific disease waiting period eye",
        "NU122": "haemodialysis dialysis day care renal treatment consumables",
        "AG095": "appendectomy laparoscopic surgery day care inpatient hospitalization",
        "OR089": "knee replacement joint surgery specific disease waiting period orthopaedic"
    }

    @classmethod
    def reconcile_policy_and_treatment(
        cls,
        procedure_code: str,
        hospital_accreditation: str,
        ward_entitlement: str,
        city_category: str = "Tier 1 (X City)"
    ) -> PolicyReconcileResponse:
        """
        Reconcile procedure benchmark estimate with active policy wording clauses.
        """
        # 1. Calculate CGHS Benchmark Rate (raises RateNotFoundError or InvalidSelectionError if invalid)
        estimate_dict = RateService.calculate_estimate(
            procedure_code=procedure_code,
            hospital_accreditation=hospital_accreditation,
            ward_entitlement=ward_entitlement,
            city_category=city_category
        )
        benchmark_response = TreatmentEstimateResponse(**estimate_dict)

        standard_disclaimer = (
            "NOTICE: This tool presents CGHS reference benchmarks and retrieved policy wording clauses "
            "for informational decision-support purposes only. It does NOT determine coverage, calculate "
            "out-of-pocket costs, or guarantee claim approval. Always verify terms directly with your insurer/TPA."
        )

        # 2. Check Active Policy Status
        if not DocumentStore.has_active_document():
            return PolicyReconcileResponse(
                procedure_code=benchmark_response.procedure_code,
                procedure_name=benchmark_response.procedure_name,
                has_active_policy=False,
                policy_filename=None,
                benchmark_rate=benchmark_response,
                retrieved_policy_clauses=[],
                has_relevant_clauses=False,
                clause_summary=(
                    "No policy document is currently uploaded. Upload a policy PDF in Policy Analysis "
                    "to view relevant policy wording clauses alongside this benchmark rate."
                ),
                tpa_verification_checklist=[
                    "Upload your policy PDF to inspect procedure-specific waiting periods and sub-limits.",
                    "Confirm how lens/IOL costs are treated under your policy schedule and with your insurer/TPA.",
                    "Verify hospital network empanelment status for cashless pre-authorization."
                ],
                disclaimer=standard_disclaimer
            )

        active_doc = DocumentStore.get_active_document() or {}
        filename = active_doc.get("filename", "uploaded_policy.pdf")
        chunks = active_doc.get("chunks", [])

        # 3. Retrieve Relevant Policy Clauses
        search_query = cls.PROCEDURE_QUERY_MAP.get(
            procedure_code,
            f"{benchmark_response.procedure_name} waiting period sublimit hospitalization"
        )
        retrieved_chunks = PolicyRetriever.retrieve_relevant_chunks(search_query, chunks, top_k=4)

        if not retrieved_chunks:
            return PolicyReconcileResponse(
                procedure_code=benchmark_response.procedure_code,
                procedure_name=benchmark_response.procedure_name,
                has_active_policy=True,
                policy_filename=filename,
                benchmark_rate=benchmark_response,
                retrieved_policy_clauses=[],
                has_relevant_clauses=False,
                clause_summary=(
                    "No relevant clause was found in the passages retrieved. Review the complete policy wording "
                    "and confirm terms with your insurer/TPA."
                ),
                tpa_verification_checklist=[
                    "Review your complete policy schedule to confirm if specific waiting periods or sub-limits apply.",
                    "Confirm how lens/IOL costs are treated under your policy schedule and with your insurer/TPA.",
                    "Verify hospital network empanelment status for cashless pre-authorization."
                ],
                disclaimer=standard_disclaimer
            )

        # 4. Process Retrieved Clauses and Citations
        clause_schemas: List[ReconciledClauseSchema] = []
        page_numbers: List[int] = []

        for chk in retrieved_chunks:
            clause_schemas.append(
                ReconciledClauseSchema(
                    chunk_id=chk["chunk_id"],
                    page_number=chk["page_number"],
                    section_title=chk["section_title"],
                    text=chk["text"],
                    relevance_score=chk["relevance_score"]
                )
            )
            if chk["page_number"] not in page_numbers:
                page_numbers.append(chk["page_number"])

        page_numbers.sort()
        pages_str = ", ".join([f"Page {p}" for p in page_numbers])

        # 5. Synthesize Grounded Neutral Explanation & Checklist
        summary = (
            f"Retrieved relevant policy wording passages from physical PDF page(s) {pages_str} for "
            f"'{benchmark_response.procedure_name}'. Review the exact excerpts below for clause terms, "
            f"definitions, and waiting period details."
        )

        checklist = [
            f"Check if your policy inception date satisfies applicable waiting period rules referenced on physical PDF page(s) {pages_str}.",
            "Confirm how lens/IOL costs are treated under your policy schedule and with your insurer/TPA.",
            "Verify your specific Policy Schedule room rent category limits and hospital network empanelment status for pre-authorization."
        ]

        return PolicyReconcileResponse(
            procedure_code=benchmark_response.procedure_code,
            procedure_name=benchmark_response.procedure_name,
            has_active_policy=True,
            policy_filename=filename,
            benchmark_rate=benchmark_response,
            retrieved_policy_clauses=clause_schemas,
            has_relevant_clauses=True,
            clause_summary=summary,
            tpa_verification_checklist=checklist,
            disclaimer=standard_disclaimer
        )
