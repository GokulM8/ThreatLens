"""ThreatLens FastAPI backend — AI-powered phishing & synthetic media
detection for India's securities markets (SEBI TechSprint)."""
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Root .env.local is the single source of truth; backend/.env (if present)
# only fills in anything not already set there, since load_dotenv never
# overrides existing values by default.
load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
load_dotenv()

from .routers import analyze, dashboard, verify  # noqa: E402

app = FastAPI(
    title="ThreatLens API",
    description="Hybrid ML + heuristic phishing, scam-text, synthetic media, "
    "and communication-authenticity detection for retail investors.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(verify.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health():
    import os

    url_model_ready = os.path.exists(
        os.path.join(os.path.dirname(__file__), "ml", "artifacts", "url_model.pkl")
    )
    text_model_ready = os.path.exists(
        os.path.join(os.path.dirname(__file__), "ml", "artifacts", "text_model.pkl")
    )
    return {
        "status": "ok",
        "url_model_ready": url_model_ready,
        "text_model_ready": text_model_ready,
    }
