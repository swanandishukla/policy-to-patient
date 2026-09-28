# Policy-to-Patient — UI Redesign Implementation Guide

**Project:** Policy-to-Patient — Insurance Coverage & Treatment Cost Intelligence  
**Document Purpose:** Reference guide for upcoming Google Stitch UI redesign and frontend integration.

---

## 1. Project Architecture & Framework Stack

* **Frontend Framework:** React 18 with TypeScript and Vite
* **Routing:** React Router v6 (`BrowserRouter`)
* **Icons Library:** Lucide React (`lucide-react`)
* **Styling System:** Vanilla CSS with Design Tokens & Variables (`frontend/src/styles/`)
* **Frontend Entry Point:** [`frontend/src/main.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/main.tsx) mounting [`frontend/src/App.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/App.tsx)
* **Backend API Base:** FastAPI service running at `http://127.0.0.1:8000`

---

## 2. Page & Component Map

| View / Page | Key File Path | Features & Purpose |
| :--- | :--- | :--- |
| **Global Shell** | [`DashboardLayout.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/layouts/DashboardLayout.tsx) | Sidebar layout container, header blur bar, and active policy status indicator pill. |
| **Navigation Sidebar** | [`Sidebar.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/components/Sidebar.tsx) | Product branding logo, navigation links, and backend connection status dot. |
| **Overview Page** | [`OverviewPage.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/pages/OverviewPage.tsx) | Active policy status card, quick-start entry cards for Analysis, Q&A, and Cost Estimation. |
| **Policy Analysis Page** | [`PolicyAnalysisPage.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/pages/PolicyAnalysisPage.tsx) | PDF drag-and-drop upload, automatic summary cards grid, and page-cited Policy Q&A. |
| **Automatic Summary Cards** | [`PolicySummaryCardsView.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/components/PolicySummaryCardsView.tsx) | 6 evidence-grounded cards (*Waiting Periods, Room Rent, Co-Pay, Exclusions, PED, Sum Insured*). |
| **Treatment Estimate Page** | [`TreatmentEstimatePage.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/pages/TreatmentEstimatePage.tsx) | Navigation tabs for Coverage Estimator, Reconciliation, and CGHS Benchmark lookup. |
| **Coverage Calculator** | [`CoverageCalculatorView.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/components/CoverageCalculatorView.tsx) | Form inputs (Sum Insured, Co-pay %, Sub-limits), metric results, and arithmetic reasoning trail. |
| **Policy Reconciliation** | [`PolicyReconciliationView.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/components/PolicyReconciliationView.tsx) | Procedure selection, active policy clause comparison, and TPA verification checklist. |
| **Sources & About Page** | [`SourcesAboutPage.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/pages/SourcesAboutPage.tsx) | CGHS 2025 tariff metadata, retrieval methodology, product capabilities matrix, and disclaimers. |

---

## 3. Backend Integration Endpoints

All frontend API calls are centralized in [`frontend/src/services/api.ts`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/services/api.ts):

* `GET /api/health` — Backend connection status
* `GET /api/policy/active` — Currently loaded policy PDF status
* `POST /api/policy/upload` — Upload policy PDF for text parsing and indexing
* `POST /api/policy/qa` — Ask questions against policy with page citations
* `GET /api/policy/summary` — Retrieve 6-category automatic summary cards
* `GET /api/rates/procedures` — List CGHS 2025 procedure benchmarks
* `POST /api/rates/estimate` — Compute CGHS reference rate calculation
* `POST /api/policy/reconcile` — Compare CGHS benchmark with active policy clauses
* `POST /api/coverage/calculate` — Calculate rule-based out-of-pocket expenses

---

## 4. Local Commands for Running & Testing

### Running the App Locally

**Terminal 1 (Backend FastAPI):**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Frontend Vite):**
```powershell
cd frontend
npm run dev
```

### Validation Commands

```powershell
# Frontend Type-Check
cd frontend
npx tsc --noEmit

# Frontend Production Build Test
cd frontend
npm run build

# Backend Automated Test Suite (52 tests)
cd backend
python -m pytest -v
```

---

## 5. UI Redesign Safeguards

1. **Preserve API Contracts:** Do not modify request/response interfaces in `frontend/src/types/index.ts` or `frontend/src/services/api.ts`.
2. **Preserve Business Logic & Math:** Keep deterministic formulas for CGHS benchmark calculations and out-of-pocket estimates unchanged.
3. **Preserve Disclaimers & Citations:** Retain physical PDF page citations (e.g. `[Page 31]`) and informational disclaimers in all redesigned views.
