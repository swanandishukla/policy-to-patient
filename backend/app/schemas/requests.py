"""
Pydantic request schemas for Policy-to-Patient API endpoints.
"""

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
