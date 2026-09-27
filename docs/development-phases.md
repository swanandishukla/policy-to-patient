# Development Phases

## Phase 0 — Foundation
- Project structure and tooling
- Design system and CSS tokens
- Dashboard layout (sidebar, header, content)
- Four pages: Overview, Policy Analysis, Treatment Estimate, Sources & About
- Responsive layout (desktop, tablet, mobile)
- FastAPI backend with health check
- Frontend ↔ backend connection status
- Documentation (README, architecture, this file)
Status: ✅ Completed

## Phase 1 — Policy Upload & Extraction
- Download a publicly available Indian health insurance policy PDF
- Implement PDF upload endpoint
- Text extraction with page-aware chunking
- Source metadata tracking (page numbers, section identifiers)
- Display extracted policy sections in the frontend
Status: ✅ Completed

## Phase 2 — AI & Retrieval
- Configure LLM API (Google Gemini API)
- Build retrieval-augmented generation (RAG) pipeline
- Policy Q&A with exact citation to page/section
- Grounded citations and insufficient evidence detection
- Chat interface in the frontend
Status: ✅ Completed

## Phase 3 — Treatment Cost Data & Calculator
- Download official CGHS treatment-rate document (CGHS Rate List 2025, F.No.5-16/CGHS(HQ)/HEC/2024(Part I))
- Save unmodified PDF to `data/rates/source/cghs_rate.pdf` and create `source_metadata.json`
- Extract 10 verified MVP procedure records with complete provenance fields in `data/rates/cghs_rates_mvp.json`
- Build deterministic rate calculation service with ward entitlement modifier math (+5% private, -5% general, 0% semi-private)
- Expose `/api/rates/procedures` and `/api/rates/estimate` API endpoints
- Build interactive Treatment Estimate page with procedure dropdown, category dimensions, arithmetic breakdown, and reference disclaimers
- Add backend PyTest suite, frontend TypeScript checks, and Vite production build
Status: ✅ Completed

## Phase 4 — Policy Rules & Calculator
- Map verified policy rules to calculation logic
- Build deterministic coverage calculator
- Flag missing or unverified information
- Show transparent assumption details
- Illustrative estimate display
Status: ⏳ Upcoming

## Phase 5 — Testing & Demonstration
- Synthetic test scenarios
- End-to-end verification
- Demo preparation with public data only
- No real personal medical information
Status: ⏳ Upcoming
