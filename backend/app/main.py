"""
Policy-to-Patient — Backend Application
Insurance Coverage & Treatment Cost Intelligence Assistant
"""

from pathlib import Path
from dotenv import load_dotenv

# Resolve project root .env path relative to this file (__file__ -> backend/app/main.py -> policy-to-patient/.env)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"

# Load project-root .env before importing routes or services that use environment variables
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(
    title="Policy-to-Patient API",
    description="Insurance Coverage & Treatment Cost Intelligence Assistant",
    version="0.3.0",
)

# CORS — allow local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
