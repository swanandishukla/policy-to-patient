"""
Service for loading, validating, and performing deterministic treatment-rate benchmark lookups
using verified CGHS 2025 dataset records.
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Optional

# Resolve data path relative to project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_RATES_DIR = BASE_DIR / "data" / "rates"
METADATA_FILE = DATA_RATES_DIR / "source_metadata.json"
RATES_FILE = DATA_RATES_DIR / "cghs_rates_mvp.json"


class RateServiceError(Exception):
    """Custom exception for rate service operations."""
    pass


class RateNotFoundError(RateServiceError):
    """Exception when a procedure code is not found."""
    pass


class InvalidSelectionError(RateServiceError):
    """Exception when invalid accreditation or ward category is selected."""
    pass


class RateService:
    _metadata: Optional[Dict[str, Any]] = None
    _procedures: Optional[List[Dict[str, Any]]] = None
    _by_code: Optional[Dict[str, Dict[str, Any]]] = None

    @classmethod
    def _ensure_loaded(cls):
        """Lazy load and validate datasets."""
        if cls._procedures is not None and cls._metadata is not None:
            return

        if not METADATA_FILE.exists():
            raise RateServiceError(f"Metadata file missing at {METADATA_FILE}")
        if not RATES_FILE.exists():
            raise RateServiceError(f"Rates dataset file missing at {RATES_FILE}")

        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                cls._metadata = json.load(f)

            with open(RATES_FILE, "r", encoding="utf-8") as f:
                cls._procedures = json.load(f)

            # Validate each record structure
            cls._by_code = {}
            for item in cls._procedures:
                code = item.get("procedure_code")
                if not code or not item.get("procedure_name") or "rates_inr" not in item:
                    raise RateServiceError(f"Malformed rate record: {item}")
                cls._by_code[code] = item

        except json.JSONDecodeError as e:
            raise RateServiceError(f"Failed to parse rate JSON file: {e}")

    @classmethod
    def get_source_metadata(cls) -> Dict[str, Any]:
        """Return dataset source metadata."""
        cls._ensure_loaded()
        return cls._metadata or {}

    @classmethod
    def list_procedures(cls) -> List[Dict[str, Any]]:
        """Return list of available procedure summaries and available options."""
        cls._ensure_loaded()
        procedures_list = []
        for p in cls._procedures or []:
            procedures_list.append({
                "procedure_code": p["procedure_code"],
                "procedure_name": p["procedure_name"],
                "speciality": p["speciality"],
                "city_category": p["city_category"],
                "hospital_accreditation_options": p["hospital_accreditation_options"],
                "ward_entitlement_options": p["ward_entitlement_options"],
                "is_ward_dependent": p["is_ward_dependent"],
                "rate_unit_or_package_basis": p["rate_unit_or_package_basis"],
                "source_page_or_table": p["source_page_or_table"]
            })
        return procedures_list

    @classmethod
    def calculate_estimate(
        cls,
        procedure_code: str,
        hospital_accreditation: str,
        ward_entitlement: str,
        city_category: str = "Tier 1 (X City)"
    ) -> Dict[str, Any]:
        """
        Perform exact deterministic benchmark calculation.
        """
        cls._ensure_loaded()
        if not cls._by_code or procedure_code not in cls._by_code:
            raise RateNotFoundError(f"Procedure code '{procedure_code}' is not available in the verified benchmark dataset.")

        record = cls._by_code[procedure_code]

        # Validate accreditation selection
        valid_accreditations = record.get("hospital_accreditation_options", [])
        if hospital_accreditation not in valid_accreditations:
            raise InvalidSelectionError(
                f"Invalid accreditation '{hospital_accreditation}' for procedure {procedure_code}. "
                f"Valid options: {', '.join(valid_accreditations)}"
            )

        # Validate ward entitlement selection
        valid_wards = record.get("ward_entitlement_options", [])
        if ward_entitlement not in valid_wards:
            raise InvalidSelectionError(
                f"Invalid ward entitlement '{ward_entitlement}'. "
                f"Valid options: {', '.join(valid_wards)}"
            )

        # Base rate for chosen accreditation
        rates_map = record.get("rates_inr", {})
        if hospital_accreditation not in rates_map:
            raise InvalidSelectionError(f"No rate defined for accreditation '{hospital_accreditation}'")

        base_rate = float(rates_map[hospital_accreditation])
        is_ward_dependent = record.get("is_ward_dependent", False)

        # Ward adjustment logic
        ward_adj_percent = 0.0
        ward_adj_inr = 0.0
        final_rate = base_rate

        if is_ward_dependent:
            if ward_entitlement == "General Ward":
                ward_adj_percent = -5.0
                ward_adj_inr = round(base_rate * -0.05, 2)
                final_rate = round(base_rate * 0.95, 2)
            elif ward_entitlement == "Private Ward":
                ward_adj_percent = +5.0
                ward_adj_inr = round(base_rate * 0.05, 2)
                final_rate = round(base_rate * 1.05, 2)
            else:
                # Semi-Private Ward (Base Rate)
                ward_adj_percent = 0.0
                ward_adj_inr = 0.0
                final_rate = base_rate
            
            breakdown_lines = [
                f"1. Base rate lookup for '{record['procedure_name']}' [{record['procedure_code']}] with accreditation '{hospital_accreditation}' = ₹{base_rate:,.2f} INR.",
                f"2. Selected Ward: {ward_entitlement} ({ward_adj_percent:+.1f}% adjustment on semi-private base rate).",
                f"3. Ward Adjustment Amount: {ward_adj_inr:+,.2f} INR.",
                f"4. Final Benchmark Rate = ₹{base_rate:,.2f} {ward_adj_inr:+,.2f} = ₹{final_rate:,.2f} INR."
            ]
        else:
            # Uniform investigation / OPD rate across ward entitlements (CGHS Rule 2e)
            breakdown_lines = [
                f"1. Base rate lookup for '{record['procedure_name']}' [{record['procedure_code']}] with accreditation '{hospital_accreditation}' = ₹{base_rate:,.2f} INR.",
                f"2. Ward Entitlement Note: Uniform rate applies across all ward entitlements for consultations and investigations as per CGHS OM Rule 2(e).",
                f"3. Final Benchmark Rate = ₹{final_rate:,.2f} INR."
            ]

        disclaimer = (
            "NOTICE: The benchmark rate displayed above (₹{:,.2f} INR) is an official CGHS (2025) reference benchmark rate. "
            "It is NOT a hospital billing quotation, an insurance policy claim authorization, a coverage guarantee, or "
            "a calculation of patient out-of-pocket expenses. Policy wording Q&A and treatment-rate benchmarking are separate functions."
        ).format(final_rate)

        return {
            "procedure_code": record["procedure_code"],
            "procedure_name": record["procedure_name"],
            "speciality": record["speciality"],
            "city_category": city_category,
            "hospital_accreditation": hospital_accreditation,
            "ward_entitlement": ward_entitlement,
            "base_rate_inr": base_rate,
            "is_ward_dependent": is_ward_dependent,
            "ward_adjustment_percent": ward_adj_percent,
            "ward_adjustment_inr": ward_adj_inr,
            "final_benchmark_rate_inr": final_rate,
            "rate_unit_or_package_basis": record["rate_unit_or_package_basis"],
            "calculation_breakdown": "\n".join(breakdown_lines),
            "source_details": {
                "source_document": record["source_document"],
                "source_url": record["source_url"],
                "effective_from": record["effective_from"],
                "source_page_or_table": record["source_page_or_table"],
                "verification_status": record["verification_status"],
                "notes": record["notes"]
            },
            "disclaimer": disclaimer
        }
