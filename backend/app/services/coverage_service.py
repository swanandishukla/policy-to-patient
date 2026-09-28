"""
Coverage Calculation Service for Policy-to-Patient.
Combines official CGHS reference benchmarks with user-confirmed policy values
(Sum Insured, Co-pay percentage, Sub-limits) to produce transparent, rule-based
out-of-pocket estimates and step-by-step arithmetic reasoning trails.
"""

import math
from typing import Dict, Any, List, Optional
from app.services.rate_service import RateService, RateNotFoundError, InvalidSelectionError


class CoverageCalculationService:
    """Service to compute rule-based coverage and out-of-pocket estimates."""

    @classmethod
    def calculate_coverage_estimate(
        cls,
        procedure_code: str,
        hospital_accreditation: str,
        ward_entitlement: str,
        sum_insured: float,
        co_pay_percent: float = 0.0,
        applicable_sub_limit: Optional[float] = None,
        city_category: str = "Tier 1 (X City)",
        copay_clause_reference: Optional[str] = None,
        sublimit_clause_reference: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calculate deterministic estimated insurer payable and patient out-of-pocket expense.
        """
        # Validate numeric types & finite bounds
        cls._validate_numeric_input("sum_insured", sum_insured)
        cls._validate_numeric_input("co_pay_percent", co_pay_percent)
        if applicable_sub_limit is not None:
            cls._validate_numeric_input("applicable_sub_limit", applicable_sub_limit)

        if sum_insured <= 0:
            raise ValueError("Sum insured must be a positive monetary amount.")

        if co_pay_percent < 0.0 or co_pay_percent > 100.0:
            raise ValueError("Co-payment percentage must be between 0 and 100 inclusive.")

        if applicable_sub_limit is not None and applicable_sub_limit <= 0:
            raise ValueError("Applicable procedure sub-limit must be a positive monetary amount.")

        # 1. Fetch benchmark rate using existing RateService
        rate_result = RateService.calculate_estimate(
            procedure_code=procedure_code,
            hospital_accreditation=hospital_accreditation,
            ward_entitlement=ward_entitlement,
            city_category=city_category
        )

        benchmark_amount = round(rate_result["final_benchmark_rate_inr"], 2)
        procedure_name = rate_result["procedure_name"]

        # 2. Determine applicable baseline amount (sub-limit logic)
        sub_limit_applied = False
        sub_limit_val = None
        if applicable_sub_limit is not None and applicable_sub_limit > 0:
            sub_limit_val = round(applicable_sub_limit, 2)
            applicable_amount = min(benchmark_amount, sub_limit_val)
            sub_limit_applied = True
        else:
            applicable_amount = benchmark_amount

        # 3. Calculate estimated insurer payable and patient out-of-pocket
        copay_factor = 1.0 - (co_pay_percent / 100.0)
        insurer_payable = round(applicable_amount * copay_factor, 2)
        out_of_pocket = round(benchmark_amount - insurer_payable, 2)

        # Build reasoning trail
        reasoning_trail = []
        reasoning_trail.append(
            f"1. Benchmark Reference Rate: Selected procedure '{procedure_name}' ({procedure_code}) at {hospital_accreditation} facility with {ward_entitlement} entitlement yields an official CGHS benchmark of ₹{benchmark_amount:,.2f} INR."
        )

        if sub_limit_applied:
            reasoning_trail.append(
                f"2. Sub-Limit Applied: User-confirmed procedure sub-limit of ₹{sub_limit_val:,.2f} INR applies. Applicable baseline amount is min(₹{benchmark_amount:,.2f}, ₹{sub_limit_val:,.2f}) = ₹{applicable_amount:,.2f} INR."
            )
        else:
            reasoning_trail.append(
                f"2. Sub-Limit Check: No procedure sub-limit was supplied. Full benchmark rate of ₹{benchmark_amount:,.2f} INR is used as the baseline amount."
            )

        reasoning_trail.append(
            f"3. Co-Payment Calculation: Applying user-confirmed co-pay of {co_pay_percent}% to applicable baseline amount (₹{applicable_amount:,.2f} × {copay_factor:.4f}) yields Estimated Insurer Payable of ₹{insurer_payable:,.2f} INR."
        )

        reasoning_trail.append(
            f"4. Out-of-Pocket Expense: Estimated patient out-of-pocket cost = CGHS Benchmark (₹{benchmark_amount:,.2f}) - Insurer Payable (₹{insurer_payable:,.2f}) = ₹{out_of_pocket:,.2f} INR."
        )

        reasoning_trail.append(
            f"5. Sum Insured Context: User-confirmed policy Sum Insured is ₹{sum_insured:,.2f} INR. (Note: This simplified estimate assumes remaining policy balance is sufficient and does not model annual pool exhaustion)."
        )

        # Provenance notes
        copay_ref_text = f" ({copay_clause_reference})" if copay_clause_reference and copay_clause_reference.strip() else " (No clause reference provided)"
        sublimit_ref_text = f" ({sublimit_clause_reference})" if sublimit_clause_reference and sublimit_clause_reference.strip() else " (No clause reference provided)"

        provenance_notes = {
            "sum_insured": f"₹{sum_insured:,.2f} INR — User-confirmed policy parameter (Manually entered)",
            "co_pay": f"{co_pay_percent}% — User-confirmed policy parameter{copay_ref_text}",
            "sub_limit": f"₹{sub_limit_val:,.2f} INR{sublimit_ref_text}" if sub_limit_applied else f"Not applied in this estimate{sublimit_ref_text}",
            "verification_status": "User-entered policy inputs (Manually confirmed from policy schedule, not independently verified by system or insurer)"
        }

        disclaimer = (
            "Disclaimer: This rule-based estimate combines official CGHS reference benchmark rates with user-confirmed policy parameters. "
            "It is an informational calculation tool only and does NOT constitute a guaranteed reimbursement quote, formal claim decision, or medical/financial advice."
        )

        return {
            "procedure_code": procedure_code,
            "procedure_name": procedure_name,
            "benchmark_amount_inr": benchmark_amount,
            "user_sum_insured_inr": round(sum_insured, 2),
            "user_co_pay_percent": round(co_pay_percent, 2),
            "user_sub_limit_inr": sub_limit_val,
            "applicable_amount_inr": applicable_amount,
            "estimated_insurer_payable_inr": insurer_payable,
            "estimated_out_of_pocket_inr": out_of_pocket,
            "reasoning_trail": reasoning_trail,
            "provenance_notes": provenance_notes,
            "disclaimer": disclaimer,
        }

    @staticmethod
    def _validate_numeric_input(name: str, value: Any) -> None:
        """Verify numeric input is a valid finite float/int."""
        if not isinstance(value, (int, float)) or math.isnan(value) or math.isinf(value):
            raise ValueError(f"Invalid numeric input for {name}: must be a finite number.")
