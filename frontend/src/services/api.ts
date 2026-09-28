/**
 * API service for communicating with the Policy-to-Patient backend.
 */

import type {
  HealthResponse,
  ServiceInfoResponse,
  PolicyUploadResponse,
  PolicyQAResponse,
  ActiveDocumentInfo,
  ProceduresListResponse,
  TreatmentEstimateResponse,
  PolicyReconcileResponse,
  CoverageCalculateRequest,
  CoverageCalculateResponse,
  PolicySummaryResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Fetch the backend health status.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch backend service information.
 */
export async function fetchServiceInfo(): Promise<ServiceInfoResponse> {
  const response = await fetch(`${API_BASE_URL}/api/`);
  if (!response.ok) {
    throw new Error(`Service info failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch currently active policy document status.
 */
export async function fetchActivePolicy(): Promise<ActiveDocumentInfo> {
  const response = await fetch(`${API_BASE_URL}/api/policy/active`);
  if (!response.ok) {
    throw new Error(`Active policy check failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Upload a policy PDF file to the backend for text extraction and Q&A indexing.
 */
export async function uploadPolicy(file: File): Promise<PolicyUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/policy/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Upload failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Ask a natural language question against the active uploaded policy.
 */
export async function askPolicyQuestion(question: string): Promise<PolicyQAResponse> {
  const response = await fetch(`${API_BASE_URL}/api/policy/qa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    let errorMessage = `Q&A request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Fetch verified procedure benchmark entries and source metadata.
 */
export async function fetchProcedures(): Promise<ProceduresListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rates/procedures`);
  if (!response.ok) {
    let errorMessage = `Failed to fetch procedure rates: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Calculate deterministic treatment rate estimate for selected procedure and category options.
 */
export async function calculateEstimate(params: {
  procedure_code: string;
  hospital_accreditation: string;
  ward_entitlement: string;
  city_category?: string;
}): Promise<TreatmentEstimateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rates/estimate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      procedure_code: params.procedure_code,
      hospital_accreditation: params.hospital_accreditation,
      ward_entitlement: params.ward_entitlement,
      city_category: params.city_category || 'Tier 1 (X City)',
    }),
  });

  if (!response.ok) {
    let errorMessage = `Estimate calculation failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Reconcile selected procedure treatment benchmark with active policy wording clauses (Phase 4).
 */
export async function reconcilePolicy(params: {
  procedure_code: string;
  hospital_accreditation: string;
  ward_entitlement: string;
  city_category?: string;
}): Promise<PolicyReconcileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/policy/reconcile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      procedure_code: params.procedure_code,
      hospital_accreditation: params.hospital_accreditation,
      ward_entitlement: params.ward_entitlement,
      city_category: params.city_category || 'Tier 1 (X City)',
    }),
  });

  if (!response.ok) {
    let errorMessage = `Policy reconciliation failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Calculate transparent rule-based estimated coverage and out-of-pocket expenses (Milestone B).
 */
export async function calculateCoverage(
  payload: CoverageCalculateRequest
): Promise<CoverageCalculateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/coverage/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Coverage calculation failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Fetch automatically generated 6-category policy summary cards for active policy (Milestone C).
 */
export async function fetchPolicySummary(): Promise<PolicySummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/policy/summary`);
  if (!response.ok) {
    let errorMessage = `Failed to fetch policy summary cards: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }
  return response.json();
}


