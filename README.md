# TruckShield

**Explainable compliance-risk intelligence for Indian road-freight dispatch.**

TruckShield turns a trip's details and documents into an explainable compliance-risk
score (0–100) with the factors behind the score, potential issues, and recommended
actions — presented like a pre-departure inspection report.

> TruckShield provides informational compliance pre-checks and risk signals. Results do
> not constitute legal advice or guarantee enforcement outcomes. Demonstration data is
> synthetic and clearly labelled — it is not derived from live enforcement activity.

---

## Features

- **Auth** — email/password (JWT). Per-user data isolation enforced in the service layer.
- **Trips** — create, list, view, update, delete; one-click **Analyze**.
- **Explainable risk engine** — deterministic weighted scoring across 5 factors with
  per-factor severity, description and recommendation.
- **Documents** — upload invoices / e-way bills (images or **multi-page PDFs**); AI OCR
  extracts fields with confidence, then a compliance **pre-check** flags potential issues.
- **Incidents** — mobile-first reporting that feeds corridor intelligence.
- **Dashboard & Analytics** — KPIs, alerts, risk distribution charts, and a live
  **corridor risk heatmap** (Leaflet/OpenStreetMap).
- **PDF export** — one-tap printable risk report drivers can carry at checkpoints.

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React (CRA), Tailwind + shadcn/ui, react-leaflet, recharts, framer-motion |
| Backend   | FastAPI (modular: routers / services / engines / integrations) |
| Database  | Neon PostgreSQL (SQLAlchemy async) |
| Auth      | Custom JWT (bcrypt + PyJWT) |
| OCR       | Gemini 2.5 Flash via Emergent LLM key (behind an adapter) |
| Distance  | Deterministic **DEMO** provider (behind an adapter) |
| Storage   | Server-side Postgres bytea (behind an adapter) |

## Architecture (high level)

```
React ──REST/JSON──► FastAPI ──► Services ──► Engines (risk / distance / compliance)
                         │                └► Integrations (OCR adapter, Storage adapter)
                         └────────────────► Neon PostgreSQL
```

See [`docs/architecture.md`](docs/architecture.md), [`docs/risk-engine.md`](docs/risk-engine.md),
[`docs/database.md`](docs/database.md), [`docs/api.md`](docs/api.md), [`docs/deployment.md`](docs/deployment.md).

## Local setup

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, EMERGENT_LLM_KEY
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
Tables are created automatically via an idempotent SQL migration on startup, and a
clearly-labelled synthetic demo account is seeded.

### Frontend
```bash
cd frontend
yarn install
# set REACT_APP_BACKEND_URL in frontend/.env
yarn start
```

### Health check
```
GET /api/v1/health
```

## Environment variables

**Backend** (`backend/.env`)
```
DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require
JWT_SECRET=<random-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
EMERGENT_LLM_KEY=<key>
OCR_MODEL_PROVIDER=gemini
OCR_MODEL_NAME=gemini-2.5-flash
DISTANCE_PROVIDER=demo
```

**Frontend** (`frontend/.env`)
```
REACT_APP_BACKEND_URL=<backend-base-url>
```

> Never commit real secrets. `.env` files are git-ignored.

## Demo account

```
email:    demo@truckshield.app
password: Demo@12345
```
Seeded with SYNTHETIC trips, incidents and corridor intelligence (labelled everywhere).

## Testing

```bash
cd backend
pytest -q            # engines + API/authorization tests
```

## Deployment

See [`docs/deployment.md`](docs/deployment.md). The app runs without Docker; a
`docker-compose.yml` can be added for local orchestration if desired.
