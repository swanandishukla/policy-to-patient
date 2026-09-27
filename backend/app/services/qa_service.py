"""
Grounded Policy Question Answering Service for Policy-to-Patient.
Combines PolicyRetriever evidence passages with Google Gemini API
to generate cited, grounded policy answers.
"""

import os
from typing import Dict, Any, List, Optional
from app.services.document_store import DocumentStore
from app.services.policy_retriever import PolicyRetriever


class PolicyQAService:
    """Service to process policy questions using RAG (Retrieval-Augmented Generation)."""

    @classmethod
    def answer_question(cls, question: str) -> Dict[str, Any]:
        """
        Retrieve evidence passages from the active uploaded policy and generate a cited answer.
        """
        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")

        active_doc = DocumentStore.get_active_document()
        if not active_doc:
            raise ValueError("No active policy document found. Please upload a policy PDF first.")

        filename = active_doc["filename"]
        chunks = active_doc["chunks"]

        # Step 1: Retrieve evidence passages
        retrieved_passages = PolicyRetriever.retrieve_relevant_chunks(question, chunks, top_k=5)

        has_sufficient_evidence = len(retrieved_passages) > 0 and retrieved_passages[0]["relevance_score"] >= 0.15

        # Check for Gemini API key in environment
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_KEY") or os.getenv("GOOGLE_API_KEY")
        is_llm_configured = bool(api_key and api_key.strip() and not api_key.startswith("your_"))

        citations = []
        for p in retrieved_passages:
            cite_str = f"Page {p['page_number']} - {p['section_title']}"
            if cite_str not in citations:
                citations.append(cite_str)

        # If LLM key is unconfigured or not present, return evidence passages with clear notice
        if not is_llm_configured:
            if not has_sufficient_evidence:
                return {
                    "question": question,
                    "filename": filename,
                    "answer": "Not enough relevant information found in the uploaded policy to answer this question.",
                    "is_grounded": True,
                    "has_sufficient_evidence": False,
                    "llm_configured": False,
                    "citations": [],
                    "evidence_passages": [],
                    "warning": "GEMINI_API_KEY is not configured in backend environment (.env). Feature is running in offline evidence retrieval mode."
                }

            return {
                "question": question,
                "filename": filename,
                "answer": (
                    f"Evidence passages were retrieved from your policy ({filename}), but GEMINI_API_KEY is unconfigured in the backend environment.\n\n"
                    "Please set GEMINI_API_KEY in your `.env` file to enable AI answer generation. "
                    "Below are the top retrieved source passages from your document for this query:"
                ),
                "is_grounded": True,
                "has_sufficient_evidence": True,
                "llm_configured": False,
                "citations": citations,
                "evidence_passages": retrieved_passages,
                "warning": "GEMINI_API_KEY is unconfigured in `.env`. Displaying evidence passages only."
            }

        # Step 2: Generate LLM answer using Gemini API if key is available
        if not has_sufficient_evidence:
            return {
                "question": question,
                "filename": filename,
                "answer": "Not enough relevant information was found in the uploaded policy wording to answer this question accurately.",
                "is_grounded": True,
                "has_sufficient_evidence": False,
                "llm_configured": True,
                "citations": [],
                "evidence_passages": retrieved_passages,
                "warning": None
            }

        # Try generating response with Gemini API
        try:
            answer_text = cls._call_gemini_api(api_key, question, retrieved_passages, filename)
            return {
                "question": question,
                "filename": filename,
                "answer": answer_text,
                "is_grounded": True,
                "has_sufficient_evidence": True,
                "llm_configured": True,
                "citations": citations,
                "evidence_passages": retrieved_passages,
                "warning": None
            }
        except Exception as e:
            # Fallback on LLM API failure
            return {
                "question": question,
                "filename": filename,
                "answer": (
                    f"Retrieved relevant source passages, but Gemini API generation encountered an issue ({str(e)}).\n\n"
                    "You can inspect the exact evidence passages from your policy below:"
                ),
                "is_grounded": True,
                "has_sufficient_evidence": True,
                "llm_configured": True,
                "citations": citations,
                "evidence_passages": retrieved_passages,
                "warning": f"LLM Generation Call Exception: {str(e)}"
            }

    @classmethod
    def _call_gemini_api(
        cls,
        api_key: str,
        question: str,
        passages: List[Dict[str, Any]],
        filename: str
    ) -> str:
        """Call Gemini API with prompt constrained strictly to evidence passages."""
        # Try google.generativeai SDK with gemini-2.5-flash
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            
            # Use available gemini model
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
            except Exception:
                model = genai.GenerativeModel('gemini-flash-latest')

            evidence_text = "\n\n".join([
                f"--- EVIDENCE PASSAGE (Physical Page {p['page_number']} | Section: {p['section_title']}) ---\n{p['text']}"
                for p in passages
            ])

            prompt = f"""
You are an insurance policy assistant. Answer the user's question ONLY using the provided evidence passages from the health insurance policy "{filename}".

INSTRUCTIONS:
1. Answer ONLY based on the facts present in the evidence passages below.
2. For EVERY factual claim or condition in your answer, you MUST cite the physical PDF page number in brackets, e.g. [Page 30] or [Page 8, 11].
3. State section titles when available.
4. If the evidence passages do NOT contain enough information to answer the question, state clearly: "Not enough information found in the policy wording."
5. Do NOT make claim approval decisions, estimate coverage amounts, or give medical advice.
6. Keep your answer concise, accurate, professional, and clear.

USER QUESTION: {question}

EVIDENCE PASSAGES FROM POLICY:
{evidence_text}
"""
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception:
            # Fall back to alternative SDK or REST call if needed
            raise
