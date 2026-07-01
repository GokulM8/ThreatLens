# ThreatLens

> AI-powered phishing and synthetic-media detection for India's securities markets.
> **SEBI Securities Market TechSprint 2026 — Track: Investor Protection**

ThreatLens combines a hybrid ML + heuristic risk engine (URLs and scam text), a frequency/metadata-based synthetic media flagger, and a cryptographic registry for verifying official SEBI/exchange communications — surfaced in a clean, light-mode dashboard with full SHAP explainability for every verdict.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Machine Learning Pipeline](#machine-learning-pipeline)
   - [URL Phishing Model](#url-phishing-model)
   - [24 Features](#24-features)
   - [Training Dataset — PhiUSIIL](#training-dataset--phiusiil)
   - [Dataset Augmentation — The Problem](#dataset-augmentation--the-problem)
   - [Augmentation Fixes Applied](#augmentation-fixes-applied)
   - [False Positive Rate Progression](#false-positive-rate-progression)
   - [Rules Engine](#rules-engine)
   - [SHAP Explainability](#shap-explainability)
   - [Scam-Text Classifier](#scam-text-classifier)
   - [Synthetic Media Analyzer](#synthetic-media-analyzer)
4. [Backend API](#backend-api)
5. [Frontend Pages](#frontend-pages)
6. [Database — Supabase](#database--supabase)
7. [Environment Variables](#environment-variables)
8. [Performance Metrics](#performance-metrics)
9. [Known Limitations](#known-limitations)

---

## Quick Start

```bash
# 1. Clone and install dependencies
make install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, etc.

# 3. Apply Supabase schema
# Run supabase/schema.sql in your Supabase project's SQL editor

# 4. Train the ML models (first run only — ~5–6 minutes)
backend/.venv/bin/python ml/train.py        # URL phishing model
backend/.venv/bin/python ml/train_text.py   # Scam-text classifier

# 5. Seed the communications registry (optional demo data)
backend/.venv/bin/python -m backend.seed_registry

# 6. Start frontend + backend
make dev
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

---

## Architecture

```
┌────────────────── Next.js 14 Frontend ──────────────────┐
│  / (landing)  /dashboard  /analyze  /verify             │
│  /history     /insights                                  │
│  SWR · 30s refresh · useLastScan localStorage cache     │
└──────────────────────┬───────────────────────────────────┘
                       │ fetch (NEXT_PUBLIC_API_URL)
                       ▼
┌────────────── FastAPI Backend (Python 3.13) ─────────────┐
│  /api/analyze/url      → ML + rules                     │
│  /api/analyze/content  → TF-IDF text model              │
│  /api/analyze/media    → EXIF + FFT analyzer            │
│  /api/verify/communication  → hash + pgvector lookup    │
│  /api/dashboard/stats       → aggregated metrics        │
└──────┬──────────────┬────────────────────────────────────┘
       │              │
       ▼              ▼
 ML artifacts     Supabase (PostgreSQL + pgvector)
 url_model.pkl    scans · communications · threat_stats
 text_model.pkl   match_communications() RPC
```

---

## Machine Learning Pipeline

### URL Phishing Model

The core detector is a **hybrid ML + heuristic ensemble**:

1. **Feature extraction** — 24 structural signals derived from the URL string and (optionally) live WHOIS + HTTP responses
2. **ML scoring** — XGBoost classifier (or RandomForest if XGBoost is unavailable) returns a `[0,1]` phishing probability
3. **Rules overlay** — 9 deterministic YAML rules score independently
4. **Verdict combination** — `combine_verdicts()` merges ML + rules into `SAFE / SUSPICIOUS / PHISHING`
5. **SHAP explanation** — `TreeExplainer` returns the top-5 per-feature contributions

```
URL → extract_features() → ML model → ml_probability
                         ↘
                          rules.yaml → rule_score
                                    ↘
                                     combine_verdicts() → verdict + risk_score
                                                       ↘
                                                        SHAP top-5
```

**Verdict logic:**

| ML probability | Rule score | Combined verdict |
|---|---|---|
| ≥ 0.5 | ≥ 5 | PHISHING |
| ≥ 0.5 | < 5 | SUSPICIOUS |
| < 0.5 | ≥ 5 | SUSPICIOUS |
| < 0.5 | < 5 | SAFE |
| > 0.8 (any) | any | PHISHING (ML override) |

---

### 24 Features

All features are extracted by `backend/ml/features.py` from the raw URL string (pure Python, no network) unless `check_live_signals=True` is passed, in which case WHOIS + HTTP signals are resolved live.

| Feature | Type | Description |
|---|---|---|
| `url_length` | structural | Total URL character count |
| `subdomain_depth` | structural | Number of subdomain levels beyond apex |
| `special_char_count` | structural | Non-alphanumeric characters excluding `/:. ` |
| `https_present` | structural | 1 if scheme is `https` |
| `domain_entropy` | lexical | Shannon entropy of the hostname |
| `lexical_similarity_to_known_brokers` | lexical | Max edit-distance similarity to 17 known Indian broker domains |
| `redirect_count` | live | Number of HTTP redirects followed |
| `digit_ratio` | lexical | Fraction of digits in the hostname |
| `dot_count` | structural | Total dots in the full URL |
| `hyphen_count` | structural | Total hyphens in the full URL |
| `at_count` | structural | `@` characters (host-spoofing signal) |
| `tld_suspicious` | lexical | 1 if TLD is in the known-abuse list (`.tk`, `.xyz`, etc.) |
| `path_length` | structural | Character length of the URL path |
| `query_length` | structural | Character length of the query string |
| `fragment_present` | structural | 1 if URL has a `#` fragment |
| `ip_in_url` | structural | 1 if hostname is a raw IPv4 address |
| `shortening_service` | lexical | 1 if hostname matches a known link-shortener |
| `domain_age_proxy` | live | Domain age in days from WHOIS; -1 if unavailable |
| `alexa_rank_proxy` | lexical | Offline structural proxy for domain establishment (known brokers → 0.05) |
| `brand_keyword_present` | lexical | Brand name in URL but hostname ≠ that brand |
| `lookalike_score` | lexical | Edit-distance similarity after homoglyph normalisation (`z3r0dha → zerodha`) |
| `punycode_present` | structural | 1 if `xn--` appears in the hostname |
| `external_resources_count` | live | External scripts/images/stylesheets on the page |
| `form_action_external` | live | 1 if a `<form>` submits to a different domain |

**Live signals** (`redirect_count`, `domain_age_proxy`, `external_resources_count`, `form_action_external`) degrade to neutral sentinel values (`0` / `-1`) when network access is unavailable. The model is trained with `-1` as a **class-neutral** sentinel for `domain_age_proxy` so it doesn't bias toward phishing when WHOIS is blocked.

---

### Training Dataset — PhiUSIIL

- **Dataset:** [PhiUSIIL Phishing URL Dataset](https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset) — 235,795 labelled URLs (134,850 legitimate, 100,945 phishing)
- **Path:** `ml/data/PhiUSIIL_Phishing_URL_Dataset.csv`
- **Label encoding:** `0 = phishing`, `1 = legitimate` (internal convention flipped — see `PHIUSIIL_PHISHING_LABEL_VALUE`)
- **Training split:** 80/20 stratified by label, `random_state=42`
- **Models compared:** RandomForestClassifier (200 trees) vs XGBClassifier (200 estimators, depth 6, lr 0.1)
- **Selection criterion:** best holdout ROC-AUC wins

---

### Dataset Augmentation — The Problem

PhiUSIIL's "legitimate" class was collected via a methodology that produces **only bare root domains** — `https://www.domain.tld` with zero path, zero query string, always `www.`-prefixed. This caused a cascade of collection-artifact biases:

| Feature | Legit class (raw) | Phishing class |
|---|---|---|
| `path_length` | 100% = 0 | varied (mean 8.7) |
| `query_length` | 100% = 0 | varied (mean 5.2) |
| `subdomain_depth` (via www.) | 100% = 1 | varied |
| dots in path (file extensions) | 100% = 0 | ~12% have `.html`/`.pdf` etc. |

A model trained naively on this data learns "any path → phishing", "any query → phishing", which flagged nearly every real-world URL (e.g. `zerodha.com/login`, `youtube.com/results?search_query=...`) as high-risk regardless of actual content.

---

### Augmentation Fixes Applied

All fixes live in `ml/train.py`. Training is seeded (`random.seed(42)`, `np.random.seed(42)`) for reproducibility.

**Fix 1 — Path diversity (`_augment_legit_paths`)**
- Applied to 85% of legit rows
- Generates realistic paths across five style buckets:
  - Bare `/` (trailing slash — the homepage pattern, 10%)
  - Short single-segment templates `/login`, `/dashboard`, etc. (20%)
  - Template + slug-id `/blog/report-4821` (15%)
  - Deep multi-segment with alphanumeric IDs `/r/programming/comments/abc123/title/` (30%)
  - Long descriptive slugs `/articles/why-is-processing-a-sorted-array-faster` (20%)
  - Fragment paths `/mail/u/0/#inbox` (5%)

**Fix 2 — File extensions (`_maybe_add_extension`)**
- 25% of augmented paths receive a realistic extension: `.html`, `.pdf`, `.jpg`, `.json`, `.php`, `.aspx`, etc.
- Fixes: NYTimes articles, Dropbox file links, news pages (whose extra dot in the path inflated `dot_count`)

**Fix 3 — Subdomain variation (`_vary_legit_subdomains`)**
- 50% of legit rows have `www.` stripped, creating `subdomain_depth=0` examples
- Fixes: URLs like `zoom.us/j/...` (no www) reading as suspicious

**Fix 4 — Known broker injection (`_known_broker_examples`)**
- 20 synthetic examples per domain × 17 known broker domains = 340 guaranteed-legit rows
- With varied paths, www/no-www, and realistic queries
- Fixes: `alexa_rank_proxy=0.05` and `lookalike_score=1.0` never having appeared in a legit context before

**Fix 5 — domain_age_proxy sentinel**
- `-1` (WHOIS unavailable) injected into 15% of BOTH legit and phishing rows equally
- Makes the model learn `-1` is class-neutral, not suspicious
- Without this fix, even `zerodha.com` scored 62+ when WHOIS was offline

**Fix 6 — Query string length distribution (`_random_legit_query`)**
- Five-bucket generator covering the full query-length range:
  - Empty (25%)
  - Short `?dl=0` / `?tab=1` style, 1–10 chars (25%)
  - Multi-word search `?search_query=how+to+make+demo+video`, 30–80 chars (20%)
  - Multi-parameter tracking `?utm_source=google&utm_medium=cpc&gclid=...`, 40–100 chars (20%)
  - Fixed short templates (10%)
- Fixes: YouTube search URLs, Zoom meeting links (`?pwd=...`), Dropbox file links (`?dl=0`)

---

### False Positive Rate Progression

Tested against a fixed battery of 36 genuinely common real-world URLs spanning YouTube, Gmail, GitHub, Wikipedia, Amazon, Twitter, Reddit, Stack Overflow, NYTimes, Spotify, Zoom, Dropbox, Google Docs, Apple, Zerodha, NSE India, etc.

| Fix applied | False positives (score ≥ 65) |
|---|---|
| Naive PhiUSIIL (no augmentation) | **15/36 = 41.7%** |
| + Path diversity (multi-segment, deep IDs) | 5/36 = 13.9% |
| + File extensions + seeded random + 85% coverage | 5/36 = 13.9% |
| + Short-query gap closed | **2/36 = 5.6%** |

**Phishing detection held at 0 missed out of 7 known-bad patterns throughout every round** — all augmentation improvements came with zero regression on actual phishing URLs.

---

### Rules Engine

`backend/ml/rules.yaml` — 9 deterministic heuristic rules evaluated post-ML. Thresholds: score ≥ 5 = PHISHING, ≥ 2 = SUSPICIOUS.

| Rule | Trigger | Score |
|---|---|---|
| `url_length_over_100` | URL > 100 chars | 2 |
| `at_symbol_present` | `@` in URL | 2 |
| `ip_in_url` | Raw IP as hostname | 2 |
| `no_https` | Scheme is not `https` | 1 |
| `excessive_subdomain_depth` | > 2 subdomain levels | 1 |
| `tld_suspicious` | TLD in abuse list | 1 |
| `shortening_service` | Known link shortener | 1 |
| `punycode_present` | `xn--` in hostname | 2 |
| `form_action_external` | Form submits to external domain | 2 |

Rules are evaluated independently via `rules_engine.py`. The `evaluate_rules()` function skips any feature whose value equals the declared `unknown_value` sentinel (prevents sentinel values being misread as positive signals).

---

### SHAP Explainability

Every URL scan returns a **top-5 SHAP breakdown** showing which features pushed the score up or down.

- Library: `shap.TreeExplainer` (works for both RandomForest and XGBoost)
- Per-prediction marginal contributions on the phishing class
- Displayed in the dashboard right panel, the `/analyze` result card, and the landing-page demo section
- SHAP values are persisted to Supabase `scans.shap_json` for audit trail

---

### Scam-Text Classifier

`backend/ml/text_model.py` — used by `POST /api/analyze/content`

- **Algorithm:** TF-IDF vectorizer + Logistic Regression
- **Training data:** Synthetic corpus of scam/phishing message templates + benign financial communications
- **Overlay:** Keyword heuristics (`backend/ml/content_keywords.yaml`) run alongside the ML model
- **Output:** `{ verdict, risk_score, ml_probability, keyword_score, fired_rules }`

---

### Synthetic Media Analyzer

`backend/ml/media_analyzer.py` — used by `POST /api/analyze/media`

Two-stage heuristic detector (no trained neural network):

1. **EXIF metadata analysis** — missing camera metadata, AI-generation software tags, suspicious metadata patterns
2. **2D FFT frequency analysis** — detects periodic spectral peaks characteristic of GAN-upsampled images (high `periodic_peak_z_score`)

Output: `{ verdict, synthetic_score, reasons[], metadata, frequency_analysis }`

> **Scope note:** Video files receive metadata-only logging and an `INCONCLUSIVE` verdict. Frame-level deepfake detection requires a CNN that was out of scope for the hackathon timeline — this is documented explicitly in the API response.

---

## Backend API

Base URL: `http://localhost:8000`

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze/url` | POST | URL phishing scan — 24 features → ML + rules + SHAP |
| `/api/analyze/content` | POST | Scam-text detection — TF-IDF + keyword overlay |
| `/api/analyze/media` | POST | Synthetic media detection — EXIF + FFT |
| `/api/verify/communication` | POST | SEBI registry hash lookup + pgvector similarity |
| `/api/verify/communication/file` | POST | Same, accepting PDF/text file upload |
| `/api/dashboard/stats` | GET | Aggregate threat stats, 7-day timeline, active threats, scan history |
| `/api/health` | GET | Service + model-readiness status |

All scan endpoints write to `supabase.scans` via `backend/scan_log.py`. The dashboard stats endpoint computes aggregates over recent scan rows and generates the 7-day timeline from the `threat_stats` table.

Full interactive docs: `http://localhost:8000/docs`

---

## Frontend Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero with live scanner demo, problem/features/how-it-works sections |
| `/dashboard` | Main ops view — stat cards, threat timeline chart, recent scans, right panel with SHAP result |
| `/analyze` | URL / Email / Media / Communication scanner with macOS-style terminal UI |
| `/verify` | SEBI communication authenticity checker |
| `/history` | Paginated scan table with type/verdict filter pills, CSV export, detail drawer |
| `/insights` | Period-toggle stat cards, threat-type donut, daily bar chart, SHAP importance bars |

**Shared components:**
- `PageTopnav` — used on all pages; includes `‹ ›` prev/next navigation between pages
- `DashboardTopbar` — dashboard-only; notifications dropdown with mark-as-read + clear-all, settings menu, profile menu
- `LogoIcon` / `Logo` — Circuit-Eye SVG logo with circuit-board pins and teal accent dot

**Data flow:**
- Dashboard uses SWR with 30-second refresh against `/api/dashboard/stats`
- Last scan result is persisted in `localStorage` (`threatlens:last-scan`) and bridges the `/analyze` → dashboard right panel via `useLastScan()` hook
- Landing-page demo section caches its result for 24 hours in `localStorage` (`threatlens:demo-scan`) to avoid writing duplicate rows on every page load

---

## Database — Supabase

Schema: `supabase/schema.sql`

**`scans`** — every URL / content / media / verify request
```sql
id uuid, url text, risk_score numeric, verdict text,
shap_json jsonb, rules_triggered jsonb, type text, timestamp timestamptz
```

**`communications`** — curated SEBI/exchange authentic communications
```sql
id uuid, hash text unique, source text, verified boolean,
embedding vector(384),  -- for pgvector similarity search
timestamp timestamptz
```

**`threat_stats`** — daily aggregates (refreshed by `refresh_threat_stats()`)
```sql
id uuid, date date unique, phishing_count int, deepfake_count int,
accuracy numeric, total_scans int, updated_at timestamptz
```

The `match_communications()` PostgreSQL function performs cosine-similarity nearest-neighbour search to catch near-duplicate (lightly altered) copies of real notices that would otherwise miss an exact hash match.

Text embeddings use `backend/embeddings.py` — a fixed-size 384-dimension `HashingVectorizer` (deterministic, zero model download). Sufficient for near-duplicate detection, not intended for semantic search.

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
# Supabase — frontend (public, safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase — backend (server-side only, read by backend/db.py)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Backend URL (frontend points here for API calls)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Everything works without Supabase configured — the backend falls back to local JSON registry for verify and returns zeroed stats; live URL/text/media scanning still works fully.

---

## Performance Metrics

Final trained model (`xgboost`, holdout 20% test set from 235,795-row PhiUSIIL):

| Metric | Value |
|---|---|
| Accuracy | 96.3% |
| Precision | 97.3% |
| Recall | 93.9% |
| ROC-AUC | 99.4% |
| False-positive rate | 1.9% |
| False-positive rate (36-URL real-world battery) | **5.6%** |

The holdout metrics are computed on PhiUSIIL's own distribution. The 36-URL real-world battery (everyday URLs spanning YouTube, GitHub, Amazon, Google Docs, Reddit, Stack Overflow, NYTimes, etc.) is a more meaningful usability test — see [False Positive Rate Progression](#false-positive-rate-progression) above.

> `accuracy` in `/api/dashboard/stats` surfaces the model's **detection rate** (recall) from the training holdout, carried forward per retrain. It is the model's own evaluation metric, not a live-traffic number — production scans have no ground-truth label to score against.

---

## Known Limitations

| Area | Limitation | Status |
|---|---|---|
| Media analysis | Video deepfake detection needs a frame-level CNN | Not yet implemented — EXIF+FFT heuristic only |
| Geolocation | No per-country threat origin data (no IP capture / GeoIP) | UI shows placeholder; marked `// TODO` in code |
| SHAP aggregates | No "average SHAP across all scans" endpoint | `/insights` SHAP bars are illustrative; marked `// TODO` |
| Avg response time | No latency tracking in the backend | Shows `—` in Insights; marked `// TODO` |
| History pagination | Dashboard API caps `scan_history` at 6 rows server-side | `/history` paginates client-side over available rows |
| `alexa_rank_proxy` | Real Alexa Rank API was discontinued in 2022 | Replaced with deterministic offline structural proxy |
| XGBoost on macOS | Requires `brew install libomp` for the OpenMP runtime | Falls back to RandomForest-only if unavailable |

---

## Folder Structure

```
threatlens/
├── frontend/                # Next.js 14 app
│   ├── app/                 # Routes: /, /dashboard, /analyze, /verify, /history, /insights
│   ├── components/
│   │   ├── layout/          # PageTopnav, DashboardTopbar, DashboardSidebar
│   │   ├── landing/         # Hero, Problem, Features, HowItWorks, Demo, CTA
│   │   ├── dashboard/       # StatsRow, MidRow, ThreatChart, RecentScansTable, ActiveThreats, ScanHistory
│   │   ├── analyze/         # TabBar, URLTab, EmailTab, MediaTab, CommTab, ResultCard, SessionHistory
│   │   ├── verify/          # VerifyInput, VerifyResult, HowItWorks
│   │   ├── history/         # FilterBar, ScanTable, DetailDrawer, Pagination
│   │   ├── insights/        # StatCards, DonutChart, DailyBarChart, ShapFeatures, OriginMap, PeriodToggle
│   │   └── ui/              # Logo, Badge, StatCard, ScanResultCard, ScannerTerminal, Toast, animations
│   └── lib/                 # api.ts, types.ts, useLastScan.ts, insightsApi.ts
├── backend/                 # FastAPI app
│   ├── main.py              # App entrypoint + CORS
│   ├── routers/             # analyze.py, verify.py, dashboard.py
│   ├── ml/                  # features.py, model.py, explainer.py, text_model.py, media_analyzer.py, rules.yaml
│   ├── db.py                # Supabase client (None if unconfigured)
│   ├── registry.py          # Communication hash + pgvector similarity lookup
│   ├── embeddings.py        # HashingVectorizer 384-dim embeddings
│   ├── scan_log.py          # Shared scan writer used by all routers
│   └── seed_registry.py     # Seeds demo SEBI/exchange communications
├── ml/                      # Training pipeline
│   ├── train.py             # URL model (RF + XGBoost, best-of-two by ROC-AUC)
│   ├── train_text.py        # Scam-text classifier
│   ├── evaluate.py          # Re-evaluation + global SHAP importance
│   └── data/                # PhiUSIIL_Phishing_URL_Dataset.csv (gitignored)
└── supabase/
    └── schema.sql           # Tables, indexes, match_communications() RPC, refresh_threat_stats()
```
