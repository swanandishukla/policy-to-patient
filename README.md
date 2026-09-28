# Policy-to-Patient

**Insurance Coverage & Treatment Cost Intelligence Assistant**

HackMatrix 5.0 · Finance Track · FIN-01

---

## What is Policy-to-Patient?

Policy-to-Patient is an AI-powered insurance policy intelligence assistant that helps users:

1. Upload a health insurance policy PDF
2. Understand coverage, exclusions, waiting periods, deductibles, co-payments, and sub-limits
3. Ask questions in natural language with exact policy physical page citations
4. View verified reference treatment rates from official CGHS 2025 schedules
5. Calculate transparent, deterministic treatment benchmark estimates with traceable line-item arithmetic

> **Important:** This is an informational decision-support prototype, not an insurance claim approval system.

---

## Tech Stack

| Layer    | Technology                              |
|----------|----------------------------------------|
| Frontend | React · TypeScript · Vite · React Router · Lucide React |
| Backend  | Python 3 · FastAPI · Uvicorn · PyMuPDF (fitz) · Google Gemini API · Pydantic |

---

## Quick Start (Windows PowerShell)

### Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Python** ≥ 3.10

### 1. Clone and set up environment

```powershell
# Copy the environment template
Copy-Item .env.example .env
```

To enable AI Q&A text generation, add your Google Gemini API key to `.env`:
```env
GEMINI_API_KEY=your_actual_key_here
```
*(Note: If no API key is set, the app runs in Grounded Lexical Retrieval Mode, returning exact source passages with page citations directly from your policy!)*

### 2. Start the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`. Verify: `http://127.0.0.1:8000/api/health`

### 3. Run Backend Tests

```powershell
cd backend
python -m pytest -v
```

### 4. Start the frontend (separate terminal)

```powershell
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Run Frontend Type-Check & Production Build

```powershell
cd frontend
npx tsc --noEmit
npm run build
```

---

## Treatment Rate Benchmark Data Source (Phase 3)

Phase 3 implements a deterministic, traceable treatment rate calculator grounded in official government data:

- **Official Source Document**: CGHS Rate List 2025 (`cghs_rate.pdf`)
- **Document Reference**: `F.No.5-16/CGHS(HQ)/HEC/2024(Part I)`
- **Issuing Authority**: Directorate General of Central Government Health Scheme, MoHFW, Govt of India
- **Effective Date**: **13 October 2025**
- **Official Download URL**: [https://dgehs.delhi.gov.in/sites/default/files/DGHS/universal/cghs_rate.pdf](https://dgehs.delhi.gov.in/sites/default/files/DGHS/universal/cghs_rate.pdf)
- **Local Source Document**: `data/rates/source/cghs_rate.pdf`
- **Structured Dataset Files**: `data/rates/source_metadata.json`, `data/rates/cghs_rates_mvp.json`

### Calculation & Ward Rules

1. **Base Rate**: Base package rates in Annexure-I Part A are specified for **Semi-Private Ward** in Tier 1 (X) cities.
2. **General Ward**: -5% adjustment on admissible package rate ($F = A \times 0.95$).
3. **Private Ward**: +5% adjustment on admissible package rate ($F = A \times 1.05$).
4. **Uniform Investigation & OPD Rule**: Consultations, OPD visits, and diagnostic investigations remain uniform across all ward entitlements as per CGHS OM Rule 2(e).
5. **No ML / LLM Price Prediction**: Estimates are strictly deterministic arithmetic lookups against verified dataset records.

---

## API Endpoints

| Method | Endpoint               | Description                                           |
|--------|------------------------|-------------------------------------------------------|
| GET    | `/api/health`          | Health check                                          |
| GET    | `/api/`                | Service information                                   |
| GET    | `/api/policy/active`   | Active uploaded policy status                         |
| POST   | `/api/policy/upload`   | Upload policy PDF, extract & index for Q&A            |
| POST   | `/api/policy/qa`       | Ask questions against active policy using Grounded Lexical Passage Retrieval |
| GET    | `/api/rates/procedures`| List verified procedure benchmark dataset & metadata  |
| POST   | `/api/rates/estimate`  | Calculate transparent, deterministic treatment rate   |

---

## Development Phases

| Phase | Focus                        | Status    |
|-------|------------------------------|-----------|
| 0     | Foundation & UI Shell        | ✅ Completed |
| 1     | Policy Upload & Extraction   | ✅ Completed |
| 2     | AI & Lexical Passage Retrieval | ✅ Completed |
| 3     | Treatment Cost Data & Calc   | ✅ Completed |
| 4     | Policy Rules & Reconciliation| Upcoming  |
| 5     | Testing & Demonstration      | Upcoming  |

---

## License

Hackathon project — HackMatrix 5.0
