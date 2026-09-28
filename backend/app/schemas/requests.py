"""
Pydantic request schemas for Policy-to-Patient API endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field


class PolicyQARequest(BaseModel):
    """Request schema for asking questions against the active uploaded policy."""
    question: str = Field(..., min_length=1, max_length=500, description="The user's policy question.")


class TreatmentEstimateRequest(BaseModel):
    """Request schema for calculating deterministic treatment rate estimates."""
    procedure_code: str = Field(..., description="CGHS procedure code (e.g., AG095).")
    hospital_accreditation: str = Field(..., description="Hospital accreditation category (e.g., Non-NABH, NABH, Super Speciality).")
    ward_entitlement: str = Field(..., description="Ward entitlement level (e.g., General Ward, Semi-Private Ward, Private Ward).")
    city_category: str = Field("Tier 1 (X City)", description="City classification category.")


class PolicyReconcileRequest(BaseModel):
    """Request schema for policy wording and treatment benchmark reconciliation."""
    procedure_code: str = Field(..., description="CGHS procedure code (e.g., OP099).")
    hospital_accreditation: str = Field(..., description="Hospital accreditation category (e.g., Non-NABH, NABH, Super Speciality).")
    ward_entitlement: str = Field(..., description="Ward entitlement level (e.g., General Ward, Semi-Private Ward, Private Ward).")
    city_category: str = Field("Tier 1 (X City)", description="City classification category.")


class CoverageCalculateRequest(BaseModel):
    """Request schema for rule-based coverage and out-of-pocket estimation."""
    procedure_code: str = Field(..., description="CGHS procedure code (e.g., OP099).")
    hospital_accreditation: str = Field(..., description="Hospital accreditation category (e.g., Non-NABH, NABH, Super Speciality).")
    ward_entitlement: str = Field(..., description="Ward entitlement level (e.g., General Ward, Semi-Private Ward, Private Ward).")
    city_category: str = Field("Tier 1 (X City)", description="City classification category.")
    sum_insured: float = Field(..., description="User-confirmed policy sum insured in INR.")
    co_pay_percent: float = Field(0.0, description="User-confirmed co-payment percentage (0 to 100).")
    applicable_sub_limit: Optional[float] = Field(None, description="Optional user-confirmed procedure sub-limit in INR.")
    copay_clause_reference: Optional[str] = Field(None, description="Optional section/page reference for co-pay.")
    sublimit_clause_reference: Optional[str] = Field(None, description="Optional section/page reference for sub-limit.")

