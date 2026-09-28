"""
Policy Summary Service for Policy-to-Patient.
Automatically retrieves 6 key policy topics (Waiting Periods, Room Rent Limit,
Co-Payment, Key Exclusions, Pre-existing Disease, Sum Insured) from the active policy
using the existing PolicyRetriever passage ranking pipeline.
"""

from typing import Dict, Any, List, Optional
from app.services.document_store import DocumentStore
from app.services.policy_retriever import PolicyRetriever


class PolicySummaryService:
    """Service to generate automatic evidence-grounded policy summary cards."""

    FIXED_CATEGORIES = [
        {
            "category_key": "waiting_periods",
            "category_label": "Waiting Periods",
            "query": "waiting period initial waiting period specific illness 24 months waiting period"
        },
        {
            "category_key": "room_rent_limit",
            "category_label": "Room Rent Limit",
            "query": "room rent room capping ICU room rent limit percentage single private room"
        },
        {
            "category_key": "co_payment",
            "category_label": "Co-Payment",
            "query": "co-payment copay percentage co payment deductible member contribution"
        },
        {
            "category_key": "key_exclusions",
            "category_label": "Key Exclusions",
            "query": "exclusions excluded not covered permanent exclusions policy exclusions"
        },
        {
            "category_key": "pre_existing_disease",
            "category_label": "Pre-existing Disease",
            "query": "pre-existing disease PED waiting period pre existing condition 36 months 48 months"
        },
        {
            "category_key": "sum_insured",
            "category_label": "Sum Insured",
            "query": "sum insured policy limit maximum sum insured coverage amount schedule of insurance"
        },
    ]

    @classmethod
    def generate_policy_summary(cls) -> Dict[str, Any]:
        """
        Generate evidence-grounded summary cards for all 6 fixed policy categories
        against the currently active policy in DocumentStore.
        """
        active_doc = DocumentStore.get_active_document()
        if not active_doc:
            return {
                "has_active_policy": False,
                "filename": None,
                "total_pages": None,
                "categories": [],
                "message": "No active policy document is currently loaded. Upload a policy PDF to generate an automatic policy summary."
            }

        filename = active_doc.get("filename", "uploaded_policy.pdf")
        total_pages = active_doc.get("total_pages", 0)
        chunks = active_doc.get("chunks", [])

        category_cards = []

        for cat_def in cls.FIXED_CATEGORIES:
            key = cat_def["category_key"]
            label = cat_def["category_label"]
            query = cat_def["query"]

            # Retrieve top chunks for category query
            retrieved = PolicyRetriever.retrieve_relevant_chunks(query, chunks, top_k=3)

            has_evidence = len(retrieved) > 0 and retrieved[0].get("relevance_score", 0.0) >= 0.15

            if has_evidence:
                top_clause = retrieved[0]
                page_num = top_clause.get("page_number")
                sec_title = top_clause.get("section_title", f"Page {page_num} Clause")
                snippet = top_clause.get("text", "")

                if key == "sum_insured":
                    summary_text = (
                        f"Retrieved policy wording passage from Page {page_num} ({sec_title}). "
                        "Note: Policy wording documents describe benefit structures and limits; your individual selected Sum Insured must be confirmed on your Policy Schedule or Certificate of Insurance."
                    )
                else:
                    summary_text = f"Retrieved policy clause from Page {page_num} ({sec_title}): \"{snippet[:220]}...\"" if len(snippet) > 220 else f"Retrieved policy clause from Page {page_num} ({sec_title}): \"{snippet}\""

                category_cards.append({
                    "category_key": key,
                    "category_label": label,
                    "summary_text": summary_text,
                    "has_evidence": True,
                    "page_number": page_num,
                    "section_title": sec_title,
                    "evidence_snippet": snippet,
                    "disclaimer_note": "Grounded in active policy PDF passages."
                })
            else:
                category_cards.append({
                    "category_key": key,
                    "category_label": label,
                    "summary_text": "No relevant clause was found in the passages retrieved for this topic. Please inspect your full policy schedule or confirm details with your insurer/TPA.",
                    "has_evidence": False,
                    "page_number": None,
                    "section_title": None,
                    "evidence_snippet": None,
                    "disclaimer_note": "No matching evidence retrieved."
                })

        return {
            "has_active_policy": True,
            "filename": filename,
            "total_pages": total_pages,
            "categories": category_cards,
            "message": f"Automatically generated summary cards for active policy: {filename}"
        }
