# Architecture

## Overview

Policy-to-Patient uses a decoupled frontend/backend architecture.

```
┌─────────────┐     HTTP/JSON     ┌──────────────┐
│   Frontend  │ ←──────────────→  │   Backend    │
│  React+Vite │                   │   FastAPI    │
└─────────────┘                   └──────────────┘
                                        │
                                  ┌─────┴─────┐
                                  │  Services  │
                                  │  (future)  │
                                  └───────────┘
```

## Frontend Architecture

- **React** with **TypeScript** for type-safe component development
- **React Router** for client-side navigation
- **CSS design system** with design tokens for consistent styling
- **Service layer** for typed API communication
- **Custom hooks** for shared state (e.g., backend connection status)

## Backend Architecture

- **FastAPI** with async request handling
- **Pydantic** models for request/response validation
- **Modular routing** with `APIRouter`
- **CORS** configured for the Vite dev server

## Future Architecture (Phases 1–5)

- PDF processing pipeline (Phase 1)
- Vector store for policy chunk retrieval (Phase 2)
- LLM integration for Q&A with citations (Phase 2)
- Structured treatment-rate dataset (Phase 3)
- Deterministic coverage calculator (Phase 4)
