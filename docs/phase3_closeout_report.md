# Phase 3 Closeout Report — Treatment Rate Dataset & Estimate Calculator

**Project:** Policy-to-Patient — Insurance Coverage & Treatment Cost Intelligence  
**Track:** Finance · FIN-01  
**Status:** **PASS** (Phase 3 Ready for Sign-Off)  
**Date:** September 27, 2026  

---

## 1. Executive Summary & Overall Status

Phase 3 is complete and ready for sign-off. The treatment-rate benchmark calculator provides deterministic, auditable price estimations grounded directly in the official **Central Government Health Scheme (CGHS 2025)** treatment rate schedule.

- **No ML / LLM Model Predictions**: Calculations rely exclusively on exact arithmetic lookups against verified dataset records.
- **Traceable Source Provenance**: All 10 MVP procedure entries were extracted from the official CGHS 2025 PDF schedule (`cghs_rate.pdf`) and verified line-by-line.
- **Automated Verification**: Backend PyTest suite (25/25 passed), frontend TypeScript check (0 errors), Vite production build (succeeded), browser end-to-end testing (verified on live UI), and Phase 1/2 API regression tests passed without errors.

---

## 2. Exact Files Inspected

### **Data & Source Files**
- [`data/rates/source/cghs_rate.pdf`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/data/rates/source/cghs_rate.pdf) — Original 123-page official CGHS 2025 schedule PDF (`1,013,375` bytes).
- [`data/rates/source_metadata.json`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/data/rates/source_metadata.json) — Source document title, reference, effective date, and retrieval provenance.
- [`data/rates/cghs_rates_mvp.json`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/data/rates/cghs_rates_mvp.json) — Curated 10-record rate dataset.

### **Backend Implementation**
- [`backend/app/services/rate_service.py`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/backend/app/services/rate_service.py) — Rate service logic, dataset validation, and ward adjustment arithmetic.
- [`backend/app/schemas/requests.py`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/backend/app/schemas/requests.py) — Pydantic request schema `TreatmentEstimateRequest`.
- [`backend/app/schemas/responses.py`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/backend/app/schemas/responses.py) — Response schemas `ProceduresListResponse` and `TreatmentEstimateResponse`.
- [`backend/app/api/routes.py`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/backend/app/api/routes.py) — API endpoints `GET /api/rates/procedures` and `POST /api/rates/estimate`.
- [`backend/tests/test_rates.py`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/backend/tests/test_rates.py) — PyTest suite for Phase 3 rate service and endpoints.

### **Frontend Implementation & Documentation**
- [`frontend/src/types/index.ts`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/types/index.ts) — TypeScript interfaces for procedure items and estimates.
- [`frontend/src/services/api.ts`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/services/api.ts) — API client functions `fetchProcedures()` and `calculateEstimate()`.
- [`frontend/src/pages/TreatmentEstimatePage.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/pages/TreatmentEstimatePage.tsx) — Calculator UI with procedure selection, category dimensions, line-item arithmetic breakdown, and disclaimers.
- [`README.md`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/README.md) & [`docs/development-phases.md`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/docs/development-phases.md) — Documentation.

---

## 3. Official Source Metadata & Schedule Scope

| Field | Recorded Project Value |
|---|---|
| **Document Title** | CGHS rates applicable for treatment at healthcare organisation |
| **Document Reference** | `F.No.5-16/CGHS(HQ)/HEC/2024(Part I)` (Comp No. 8365027) |
| **Issuing Authority** | Directorate General of Central Government Health Scheme, MoHFW, Govt of India |
| **Issue Date** | 03.10.2025 |
| **Effective Date** | **13 October 2025** |
| **Official Source URL** | [https://dgehs.delhi.gov.in/sites/default/files/DGHS/universal/cghs_rate.pdf](https://dgehs.delhi.gov.in/sites/default/files/DGHS/universal/cghs_rate.pdf) |
| **Geographic Scope** | Tier 1 (X Cities: Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad) |
| **Local Source Copy** | `data/rates/source/cghs_rate.pdf` |

---

## 4. Source Verification Table (All 10 MVP Records)

All 10 curated procedure entries were cross-checked line-by-line against `cghs_rate.pdf`:

| # | Code | Official Description | Speciality | Source Location | Non-NABH (INR) | NABH (INR) | Super Spec (INR) | Classification & Supporting Rule | Verification Status |
|---|---|---|---|---|---|---|---|---|---|
| **1** | `CN001` | Consultation OPD | Consultation | Page 7, Sr. 1 | ₹350 | ₹350 | ₹350 | **Uniform (0%)**: OPD Consultations remain uniform across all ward categories per OM Rule 2(e). | ✅ Verified |
| **2** | `LB055` | Blood Glucose Random / Blood Glucose Fasting / Blood Glucose PP | Laboratory Investigation | Page 9, Sr. 58 | ₹34 | ₹40 | ₹40 | **Uniform (0%)**: Lab investigations remain uniform across ward categories per OM Rule 2(e) & Sec 2. | ✅ Verified |
| **3** | `CI001` | Electrocardiogram (ECG) | Cardiology Investigation | Page 57, Sr. 1186 | ₹149 | ₹175 | ₹175 | **Uniform (0%)**: Cardiology tests remain uniform across ward categories per OM Rule 2(e). | ✅ Verified |
| **4** | `RI034` | X Ray Chest PA / AP / Oblique view (one film) | Radiological Investigation | Page 21, Sr. 372 | ₹196 | ₹230 | ₹230 | **Uniform (0%)**: Radiological tests remain uniform across ward categories per OM Rule 2(e) & Sec 2. | ✅ Verified |
| **5** | `RI001` | 2D echocardiography | Radiological Investigation | Page 20, Sr. 339 | ₹1,254 | ₹1,475 | ₹1,475 | **Uniform (0%)**: Diagnostic echo remains uniform across ward categories per OM Rule 2(e). | ✅ Verified |
| **6** | `RI089` | MRI Head / Brain – Without Contrast | Radiological Investigation | Page 23, Sr. 427 | ₹2,338 | ₹2,750 | ₹2,750 | **Uniform (0%)**: Diagnostic MRI scan remains uniform across ward categories per OM Rule 2(e). | ✅ Verified |
| **7** | `OP099` | Small Incision Cataract Surgery (SICS) with IOL excluding cost of IOL per eye | Ophthalmology Procedure | Page 49, Sr. 988 | ₹11,390 | ₹13,400 | ₹13,400 | **Ward-Dependent**: Package rate for Semi-Private ward base. General = -5%, Private = +5% per OM Sec 2. | ✅ Verified |
| **8** | `NU122` | Haemodialysis for Sero negative cases including Dialyser and all Consumables | Nephrology And Urology Procedure | Page 92, Sr. 1686 | ₹2,125 | ₹2,500 | ₹2,500 | **Ward-Dependent**: Dialysis package rate for Semi-Private ward base. General = -5%, Private = +5% per OM Sec 2. | ✅ Verified |
| **9** | `AG095` | Laparoscopic Appendectomy | Abdomen/GI Surgery Procedure | Page 75, Sr. 1443 | ₹28,050 | ₹33,000 | ₹37,950 | **Ward-Dependent**: Surgical package rate for Semi-Private ward base. General = -5%, Private = +5% per OM Sec 2. | ✅ Verified |
| **10** | `OR089` | Total Knee Joint Replacement (TKR) - Unilateral | Orthopaedics Procedure | Page 103, Sr. 1918 | ₹1,29,200 | ₹1,52,000 | ₹1,74,800 | **Ward-Dependent**: Surgical package rate for Semi-Private ward base. General = -5%, Private = +5% per OM Sec 2. | ✅ Verified |

---

## 5. Ward Adjustment Rules & Calculation Implementation

### **Schedule Rules**
1. **Semi-Private Ward (Base Rate)**: Published rates $A$ in Annexure-I Part A are specified for Semi-Private Ward entitlement.
2. **General Ward**: $-5\%$ adjustment ($F = \text{round}(A \times 0.95, 2)$).
3. **Private Ward**: $+5\%$ adjustment ($F = \text{round}(A \times 1.05, 2)$).
4. **Uniform Investigation & OPD Rule**: Consultations, OPD visits, and diagnostic investigations remain uniform across all ward entitlements ($F = A$) as per CGHS OM Rule 2(e) & Section 2.

### **Safety Controls**
- **Single Adjustment Guarantee**: Base rates in JSON are raw semi-private rates; adjustments are calculated dynamically at query time and never written back or compounded.
- **Strict Input Validation**: Unsupported procedure codes return HTTP 404 (`RateNotFoundError`); invalid accreditation or ward selections return HTTP 400 (`InvalidSelectionError`).

---

## 6. Verification & Test Execution Results

| Verification Check | Executed Command | Observed Result | Status |
|---|---|---|---|
| **Backend Unit & Integration Tests** | `python -m pytest -v` | **25 / 25 passed** in 33.40s | **PASS** |
| **Frontend TypeScript Type-Check** | `npx tsc --noEmit` | **0 errors** | **PASS** |
| **Frontend Production Build** | `npm run build` | **Succeeded** in 1.45s (`dist/assets/index-DFLU6Qzg.js`) | **PASS** |
| **Live Browser E2E Interaction** | `browser_subagent` on `http://localhost:5173/treatment` | Procedure loading, ward adjustments (Semi-Private ₹33k, Private ₹34.65k, General ₹31.35k), uniform rates (Consultation ₹350), and mobile layout verified clean. | **PASS** |
| **Phase 1 & 2 API Regression Check** | Live HTTP requests (`upload_policy`, `policy/qa`) | Uploaded 69-page policy, retrieved grounded Q&A with physical page citations (`Page 30`), handled unanswerable questions cleanly. | **PASS** |

---

## 7. Defects Found & Fixes Made

1. **Test Coverage Expansion for Double-Adjustment Prevention**:
   - *Fix*: Added `test_prevention_of_double_adjustment` and `test_exact_arithmetic_knee_replacement` to [`backend/tests/test_rates.py`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/backend/tests/test_rates.py).
2. **Frontend UI Text Explicit Scope & Disclaimer Clarification**:
   - *Fix*: Updated [`TreatmentEstimatePage.tsx`](file:///c:/Users/thaka/OneDrive/Desktop/Hackathon/HackMatrix/policy-to-patient/frontend/src/pages/TreatmentEstimatePage.tsx) to explicitly highlight that the dataset is a curated MVP benchmark subset of 10 entries (not a full catalogue), effective Oct 13, 2025 (may be subject to future amendments), scoped to Tier 1 (X Cities), and serves as a reference benchmark rather than a hospital quote or claim approval.

---

## 8. Remaining Scope & Limitations

1. **Curated MVP Scope**: Dataset contains 10 curated procedures representing Tier 1 (X Cities) CGHS 2025 rates.
2. **Separation of Concerns**: Policy Q&A analysis and treatment rate benchmarking operate independently in Phase 3. No patient out-of-pocket payment estimations or insurance claim reconciliations are performed in this phase.
3. **Phase 4 Boundary**: No work on Phase 4 (policy-to-cost reconciliation or claims adjudication) has been started.

---

## 9. Final Sign-Off Statement

**Phase 3 is fully verified, documented, and ready for sign-off.** All required source data, calculation rules, automated test suites, production builds, and user interface disclaimers are complete and evidence-backed.
