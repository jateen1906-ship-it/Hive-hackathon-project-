# Architecture

TruckShield is a modular FARM-style app: **React → FastAPI → Neon PostgreSQL**.

## Backend layout (`backend/app`)

```
app/
  main.py            # FastAPI app, CORS, exception handlers, startup (migrate + seed)
  config.py          # env-driven settings
  database.py        # async SQLAlchemy engine/session (Neon, SSL, pooler-safe)
  security.py        # bcrypt hashing, JWT, get_current_user dependency
  envelope.py        # {success,data,error} responses + domain exceptions
  models.py          # SQLAlchemy ORM models
  schemas.py         # Pydantic request schemas
  db/
    migrations/*.sql # idempotent schema
    migrate.py       # runs migrations on startup
    seed.py          # synthetic demo data (is_demo=true)
  engines/           # PURE business logic (no I/O)
    risk_engine.py       # deterministic weighted scoring + factors
    distance_engine.py    # DEMO distance provider + anomaly detection
    compliance_engine.py  # document pre-check rules
  integrations/      # swappable adapters
    ocr.py              # OCRProvider (Gemini vision); multi-page PDF support
    storage.py          # StorageBackend (Postgres bytea)
  services/          # orchestration between API and engines/DB
  api/v1/            # thin routers per domain
```

## Key principles

- **Thin routers, fat services, pure engines.** Scoring/validation logic lives in
  `engines/` and is unit-tested without a database.
- **Adapters** isolate external providers (OCR, distance, storage) so they can be
  replaced without touching business logic.
- **Consistent envelope** `{success, data, error}` and centralised exception handling.
- **Ownership everywhere.** Every query is filtered by the authenticated `user_id`.

## Frontend

- React Router routes; `AuthContext` holds the JWT + user; `ProtectedRoute` guards
  authenticated pages inside an `AppShell` (sidebar + header).
- `lib/apiClient.js` wraps axios (adds bearer token, unwraps the envelope, blob
  downloads). Domain APIs grouped per resource.
- shadcn/ui components; recharts for charts; react-leaflet for the corridor map.
