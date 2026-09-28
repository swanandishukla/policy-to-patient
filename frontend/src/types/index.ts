/**
 * API response types for Policy-to-Patient backend.
 */

export interface HealthResponse {
  app: string;
  status: string;
  version: string;
}

export interface ServiceInfoResponse {
  app: string;
  description: string;
  version: string;
  phase: string;
  endpoints: string[];
}

export interface TOCEntry {
  title: string;
  printed_page: number;
  toc_page_number: number;
  is_toc_entry: boolean;
}

export interface TermSnippet {
  page: number;
  snippet: string;
}

export interface TermMention {
  key: string;
  label: string;
  is_mentioned: boolean;
  mention_count: number;
  page_references: number[];
  in_toc_only: boolean;
  snippets: TermSnippet[];
}

export interface PolicySection {
  section_title: string;
  page_number: number;
  printed_page?: number;
  text_preview: string;
  full_text: string;
  char_count: number;
  is_toc_entry?: boolean;
}

export interface PageData {
  page: number;
  text: string;
  character_count: number;
  has_text: boolean;
  is_scanned_warning: boolean;
}

export interface PolicyUploadResponse {
  success: boolean;
  filename: string;
  total_pages: number;
  total_characters: number;
  empty_pages_count: number;
  sections_count: number;
  toc_entries: TOCEntry[];
  sections: PolicySection[];
  term_mentions: Record<string, TermMention>;
  pages: PageData[];
  warnings: string[];
  message: string;
}

export interface EvidencePassage {
  chunk_id: string;
  page_number: number;
  section_title: string;
  text: string;
  relevance_score: number;
}

export interface PolicyQAResponse {
  question: string;
  filename: string;
  answer: string;
  is_grounded: boolean;
  has_sufficient_evidence: boolean;
  llm_configured: boolean;
  citations: string[];
  evidence_passages: EvidencePassage[];
  warning?: string | null;
}

export interface ActiveDocumentInfo {
  has_active_document: boolean;
  filename?: string | null;
  total_pages?: number | null;
  total_chunks?: number | null;
}

export interface ProcedureItem {
  procedure_code: string;
  procedure_name: string;
  speciality: string;
  city_category: string;
  hospital_accreditation_options: string[];
  ward_entitlement_options: string[];
  is_ward_dependent: boolean;
  rate_unit_or_package_basis: string;
  source_page_or_table: string;
}

export interface ProceduresListResponse {
  total_count: number;
  source_metadata: Record<string, any>;
  procedures: ProcedureItem[];
}

export interface SourceDetails {
  source_document: string;
  source_url: string;
  effective_from: string;
  source_page_or_table: string;
  verification_status: string;
  notes: string;
}

export interface TreatmentEstimateResponse {
  procedure_code: string;
  procedure_name: string;
  speciality: string;
  city_category: string;
  hospital_accreditation: string;
  ward_entitlement: string;
  base_rate_inr: number;
  is_ward_dependent: boolean;
  ward_adjustment_percent: number;
  ward_adjustment_inr: number;
  final_benchmark_rate_inr: number;
  rate_unit_or_package_basis: string;
  calculation_breakdown: string;
  source_details: SourceDetails;
  disclaimer: string;
}

export interface ReconciledClause {
  chunk_id: string;
  page_number: number;
  section_title: string;
  text: string;
  relevance_score: number;
}

export interface PolicyReconcileResponse {
  procedure_code: string;
  procedure_name: string;
  has_active_policy: boolean;
  policy_filename?: string | null;
  benchmark_rate?: TreatmentEstimateResponse | null;
  retrieved_policy_clauses: ReconciledClause[];
  has_relevant_clauses: boolean;
  clause_summary: string;
  tpa_verification_checklist: string[];
  disclaimer: string;
}

export interface CoverageCalculateRequest {
  procedure_code: string;
  hospital_accreditation: string;
  ward_entitlement: string;
  city_category?: string;
  sum_insured: number;
  co_pay_percent: number;
  applicable_sub_limit?: number | null;
  copay_clause_reference?: string | null;
  sublimit_clause_reference?: string | null;
}

export interface CoverageCalculateResponse {
  procedure_code: string;
  procedure_name: string;
  benchmark_amount_inr: number;
  user_sum_insured_inr: number;
  user_co_pay_percent: number;
  user_sub_limit_inr?: number | null;
  applicable_amount_inr: number;
  estimated_insurer_payable_inr: number;
  estimated_out_of_pocket_inr: number;
  reasoning_trail: string[];
  provenance_notes: Record<string, string>;
  disclaimer: string;
}

export interface PolicySummaryCategory {
  category_key: string;
  category_label: string;
  summary_text: string;
  has_evidence: boolean;
  page_number?: number | null;
  section_title?: string | null;
  evidence_snippet?: string | null;
  disclaimer_note?: string | null;
}

export interface PolicySummaryResponse {
  has_active_policy: boolean;
  filename?: string | null;
  total_pages?: number | null;
  categories: PolicySummaryCategory[];
  message: string;
}

/**
 * Connection state for backend health check.
 */
export type ConnectionStatus = 'loading' | 'connected' | 'disconnected';

/**
 * Navigation item definition.
 */
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  description: string;
}

