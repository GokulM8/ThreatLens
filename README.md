# ThreatLens

AI-powered phishing and synthetic media detection for India's securities markets.
SEBI Securities Market TechSprint 2026 — Track: Investor Protection

## Setup

```bash
# Install all dependencies
make install

# Add environment variables
cp .env.local.example .env.local
# Fill in your Supabase keys in .env.local

# Run frontend + backend together
make dev
```

## URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

## Stack
- Frontend: Next.js 14, Tailwind CSS, shadcn/ui
- Backend: FastAPI, Python
- ML: scikit-learn, XGBoost, SHAP
- Database: Supabase (PostgreSQL + pgvector)
- Deploy: Vercel
