"""
In-memory Document Store for Policy-to-Patient.
Manages the active uploaded policy, chunks policy text into page-aware passages,
and handles document state resets upon new uploads.
"""

from typing import Dict, Any, List, Optional
import math


class DocumentStore:
    """In-memory store for active uploaded policy document and its retrieval chunks."""

    _active_document: Optional[Dict[str, Any]] = None

    @classmethod
    def set_active_document(cls, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Index a newly extracted policy document and generate retrieval chunks."""
        chunks = cls._generate_chunks(extracted_data)
        
        doc_record = {
            "filename": extracted_data.get("filename", "uploaded_policy.pdf"),
            "total_pages": extracted_data.get("total_pages", 0),
            "total_characters": extracted_data.get("total_characters", 0),
            "toc_entries": extracted_data.get("toc_entries", []),
            "sections": extracted_data.get("sections", []),
            "term_mentions": extracted_data.get("term_mentions", {}),
            "pages": extracted_data.get("pages", []),
            "chunks": chunks
        }
        
        cls._active_document = doc_record
        return doc_record

    @classmethod
    def get_active_document(cls) -> Optional[Dict[str, Any]]:
        """Return the currently active document record, if any."""
        return cls._active_document

    @classmethod
    def has_active_document(cls) -> bool:
        """Check if an active document is currently loaded."""
        return cls._active_document is not None

    @classmethod
    def clear(cls):
        """Clear active document store state."""
        cls._active_document = None

    @classmethod
    def _generate_chunks(cls, extracted_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk policy body pages into overlapping passages (~400 chars, 80 char overlap).
        Excludes TOC-only pages from clause retrieval chunks.
        """
        chunks = []
        pages = extracted_data.get("pages", [])
        toc_page_numbers = {e.get("toc_page_number") for e in extracted_data.get("toc_entries", []) if e.get("toc_page_number")}
        sections = extracted_data.get("sections", [])

        # Build page-to-section map
        page_section_map = {}
        for sec in sections:
            p_num = sec.get("page_number")
            if p_num and p_num not in page_section_map:
                page_section_map[p_num] = sec.get("section_title", f"Page {p_num} Clause")

        chunk_counter = 0

        for page in pages:
            p_num = page.get("page", 1)
            text = page.get("text", "").strip()

            # Skip empty pages or TOC pages for body clause chunking
            is_toc = p_num in toc_page_numbers or "table of contents" in text.lower()
            if is_toc or not page.get("has_text", True) or len(text) < 15:
                continue

            section_title = page_section_map.get(p_num, f"Page {p_num} Clause")

            # Chunk page text into overlapping windows
            chunk_size = 400
            overlap = 80
            step = chunk_size - overlap

            i = 0
            while i < len(text):
                chunk_text = text[i : i + chunk_size].strip()
                if len(chunk_text) >= 20:
                    chunk_counter += 1
                    chunks.append({
                        "chunk_id": f"chk_p{p_num}_{chunk_counter}",
                        "page_number": p_num,
                        "section_title": section_title,
                        "text": chunk_text,
                        "char_count": len(chunk_text)
                    })
                i += step

        return chunks
