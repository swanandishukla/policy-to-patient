"""
PDF Text Extraction Service using PyMuPDF (fitz).
Provides page-aware text extraction, Table-of-Contents separation, body section detection,
and neutral term mention tracking with page references and exact source snippets.
"""

import re
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB limit


class PDFExtractionError(Exception):
    """Custom exception for structured PDF extraction errors."""
    pass


class PolicyExtractor:
    """Service to safely extract and structure text from health insurance policy PDFs."""

    KEYWORDS = {
        "room_rent": {
            "label": "Room Rent",
            "terms": ["room rent", "icu charges", "room capping", "suite"]
        },
        "pre_post_hospitalization": {
            "label": "Pre & Post Hospitalization",
            "terms": ["pre-hospitalization", "post-hospitalization", "pre hospitalization", "post hospitalization"]
        },
        "waiting_period": {
            "label": "Waiting Periods",
            "terms": ["waiting period", "initial waiting", "pre-existing disease", "ped waiting"]
        },
        "copay": {
            "label": "Co-payment",
            "terms": ["co-payment", "copay", "co-pay", "percentage co-payment"]
        },
        "no_claim_bonus": {
            "label": "No Claim Bonus",
            "terms": ["no claim bonus", "ncb", "cumulative bonus"]
        },
        "ayush": {
            "label": "AYUSH Treatment",
            "terms": ["ayush", "ayurveda", "homeopathy", "unani", "siddha"]
        },
        "day_care": {
            "label": "Day Care Procedures",
            "terms": ["day care", "daycare", "day-care"]
        },
        "restoration": {
            "label": "Restoration / Recharge",
            "terms": ["restoration", "reinstatement", "refill", "recharge"]
        }
    }

    @classmethod
    def validate_pdf_bytes(cls, pdf_bytes: bytes, filename: str = "uploaded.pdf"):
        """Validate PDF header, size, and encryption before parsing."""
        if not pdf_bytes or len(pdf_bytes) == 0:
            raise PDFExtractionError("Uploaded file is empty. Please upload a valid policy PDF.")

        if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
            raise PDFExtractionError(
                f"File size ({len(pdf_bytes) / (1024*1024):.1f} MB) exceeds maximum allowed limit of 15 MB."
            )

        # Check PDF Magic Bytes signature
        if not pdf_bytes.startswith(b"%PDF-"):
            raise PDFExtractionError(
                "Invalid PDF file format. The file does not have a valid PDF header signature."
            )

    @classmethod
    def extract_from_bytes(cls, pdf_bytes: bytes, filename: str = "uploaded.pdf") -> Dict[str, Any]:
        """Extract text page-by-page, separate TOC from body, and compute neutral term mentions."""
        cls.validate_pdf_bytes(pdf_bytes, filename)

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            raise PDFExtractionError(f"Failed to parse PDF document. The file may be corrupt or malformed. ({str(e)})")

        if doc.is_encrypted:
            doc.close()
            raise PDFExtractionError("Password-protected or encrypted PDF files are not supported.")

        total_pages = len(doc)
        if total_pages == 0:
            doc.close()
            raise PDFExtractionError("PDF document contains 0 pages.")

        pages_data = []
        toc_entries = []
        toc_page_numbers = set()
        warnings = []
        empty_page_count = 0

        # Phase A: Page-by-Page Extraction
        for page_num in range(total_pages):
            physical_page = page_num + 1
            page = doc[page_num]
            text = page.get_text("text") or ""
            clean_text = text.strip()
            char_count = len(clean_text)

            has_text = char_count > 10
            if not has_text:
                empty_page_count += 1

            pages_data.append({
                "page": physical_page,
                "text": clean_text,
                "character_count": char_count,
                "has_text": has_text,
                "is_scanned_warning": not has_text
            })

            # Check if early page (pages 1-3) is Table of Contents
            if physical_page <= 3 and ("table of contents" in clean_text.lower() or "particulars" in clean_text.lower() and "page no" in clean_text.lower()):
                toc_page_numbers.add(physical_page)
                toc_entries.extend(cls._parse_toc_entries(clean_text, physical_page))

        # Check for scanned PDF warning (>80% empty pages)
        if empty_page_count / total_pages > 0.8:
            warnings.append(
                "Warning: Most pages in this PDF have no extractable text. "
                "Note: OCR (Optical Character Recognition) for scanned/image PDFs is not supported in Phase 1."
            )

        # Phase B: Extract Body Sections (excluding TOC pages)
        body_sections = cls._extract_body_sections(pages_data, toc_page_numbers, toc_entries)

        # Phase C: Term Mentions Analysis (Neutral)
        term_mentions = cls._analyze_term_mentions(pages_data, toc_page_numbers)

        doc.close()

        total_characters = sum(p["character_count"] for p in pages_data)

        return {
            "filename": filename,
            "total_pages": total_pages,
            "total_characters": total_characters,
            "empty_pages_count": empty_page_count,
            "toc_entries": toc_entries,
            "sections_count": len(body_sections),
            "sections": body_sections[:50],
            "term_mentions": term_mentions,
            "pages": pages_data,
            "warnings": warnings
        }

    @classmethod
    def _parse_toc_entries(cls, text: str, toc_page: int) -> List[Dict[str, Any]]:
        """Parse structured Table of Contents entries from a TOC page."""
        entries = []
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        i = 0
        while i < len(lines):
            line = lines[i]
            # Ignore headers / footers / company info / table headers
            if any(k in line.lower() for k in ["hdfc", "policy wording", "table of contents", "particulars", "sr. no", "page no", "uin", "leela business"]):
                i += 1
                continue

            if i + 1 < len(lines) and lines[i+1].isdigit():
                clean_title = line.strip()
                if len(clean_title) > 2:
                    entries.append({
                        "title": clean_title,
                        "printed_page": int(lines[i+1]),
                        "toc_page_number": toc_page,
                        "is_toc_entry": True
                    })
                i += 2
            elif i + 2 < len(lines) and lines[i+2].isdigit() and not lines[i+1].isdigit():
                clean_title = f"{line} {lines[i+1]}".strip()
                if len(clean_title) > 2:
                    entries.append({
                        "title": clean_title,
                        "printed_page": int(lines[i+2]),
                        "toc_page_number": toc_page,
                        "is_toc_entry": True
                    })
                i += 3
            else:
                i += 1
        return entries

    @classmethod
    def _extract_body_sections(
        cls,
        pages_data: List[Dict[str, Any]],
        toc_page_numbers: set,
        toc_entries: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify clause body sections from body pages (skipping TOC pages)."""
        sections = []
        current_section: Optional[Dict[str, Any]] = None

        # Build TOC lookup map by printed page if available
        toc_by_printed_page = {e["printed_page"]: e["title"] for e in toc_entries}

        for page in pages_data:
            p_num = page["page"]
            if p_num in toc_page_numbers or not page["has_text"]:
                continue

            lines = [l.strip() for l in page["text"].split('\n') if l.strip()]
            for line in lines:
                # Header detection logic
                is_heading = cls._is_body_heading(line, p_num, toc_by_printed_page)
                
                if is_heading:
                    if current_section and current_section["lines"]:
                        sections.append(cls._build_section_object(current_section))

                    current_section = {
                        "title": line,
                        "page_number": p_num,
                        "printed_page": p_num,  # matching physical page
                        "lines": [line],
                        "is_toc_entry": False
                    }
                else:
                    if current_section:
                        current_section["lines"].append(line)
                    else:
                        # Preamble / initial section before first explicit header
                        current_section = {
                            "title": f"Page {p_num} Clause",
                            "page_number": p_num,
                            "printed_page": p_num,
                            "lines": [line],
                            "is_toc_entry": False
                        }

        if current_section and current_section["lines"]:
            sections.append(cls._build_section_object(current_section))

        return sections

    @classmethod
    def _is_body_heading(cls, line: str, page_num: int, toc_by_printed_page: Dict[int, str]) -> bool:
        """Cautiously check if line is a legitimate clause heading in the body."""
        if len(line) < 4 or len(line) > 120:
            return False

        # Ignore header/footer lines
        if "HDFC ERGO" in line or "Policy Wording" in line or "IRDAI Reg" in line or line.isdigit():
            return False

        # Check regex heading patterns
        patterns = [
            r'^(?:SECTION|PART|CHAPTER|ANNEXURE)\s+[A-Z0-9\.\s]+',
            r'^[A-Z]\.[0-9]+\s+[A-Z\s]{3,}',
            r'^(?:COVERAGE|EXCLUSIONS|WAITING PERIOD|DEFINITIONS|CLAIM PROCEDURE|GENERAL TERMS|OPERATIVE CLAUSE|PREAMBLE)',
            r'^[0-9]+\.\s+(?:Waiting Periods|Base Coverage|Optional Coverage|Exclusions)',
            r'^Def\.\s+[0-9]+\.',
        ]
        for pat in patterns:
            if re.search(pat, line, re.IGNORECASE):
                return True

        # Check if matches a known TOC title for this page
        if page_num in toc_by_printed_page:
            toc_title = toc_by_printed_page[page_num].lower()
            if line.lower() in toc_title or toc_title in line.lower():
                return True

        return False

    @classmethod
    def _build_section_object(cls, sec_dict: Dict[str, Any]) -> Dict[str, Any]:
        full_text = "\n".join(sec_dict["lines"])
        preview = " ".join(sec_dict["lines"])[:250]
        if len(" ".join(sec_dict["lines"])) > 250:
            preview += "..."

        return {
            "section_title": sec_dict["title"],
            "page_number": sec_dict["page_number"],
            "printed_page": sec_dict["printed_page"],
            "text_preview": preview,
            "full_text": full_text,
            "char_count": len(full_text),
            "is_toc_entry": False
        }

    @classmethod
    def _analyze_term_mentions(
        cls,
        pages_data: List[Dict[str, Any]],
        toc_page_numbers: set
    ) -> Dict[str, Any]:
        """Perform neutral term mention detection with physical page references and short snippets."""
        results = {}

        for key, info in cls.KEYWORDS.items():
            label = info["label"]
            terms = info["terms"]

            body_page_refs = []
            toc_page_refs = []
            snippets = []
            mention_count = 0

            for page in pages_data:
                p_num = page["page"]
                text_lower = page["text"].lower()

                matched_term = None
                for t in terms:
                    if t in text_lower:
                        matched_term = t
                        break

                if matched_term:
                    mention_count += text_lower.count(matched_term)
                    if p_num in toc_page_numbers:
                        toc_page_refs.append(p_num)
                    else:
                        body_page_refs.append(p_num)
                        # Extract exact snippet (max 3 snippets per term)
                        if len(snippets) < 3:
                            idx = text_lower.find(matched_term)
                            start = max(0, idx - 60)
                            end = min(len(page["text"]), idx + len(matched_term) + 90)
                            snippet_text = page["text"][start:end].replace("\n", " ").strip()
                            snippets.append({
                                "page": p_num,
                                "snippet": f"...{snippet_text}..."
                            })

            is_mentioned = (len(body_page_refs) > 0) or (len(toc_page_refs) > 0)
            in_toc_only = (len(body_page_refs) == 0) and (len(toc_page_refs) > 0)

            results[key] = {
                "key": key,
                "label": label,
                "is_mentioned": is_mentioned,
                "mention_count": mention_count,
                "page_references": body_page_refs if body_page_refs else toc_page_refs,
                "in_toc_only": in_toc_only,
                "snippets": snippets
            }

        return results
