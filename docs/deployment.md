# Deployment

## Runtime
- **Backend:** `uvicorn server:app --host 0.0.0.0 --port 8001` (all routes under `/api`).
- **Frontend:** build with `yarn build`; serve the static bundle. Set
  `REACT_APP_BACKEND_URL` to the public backend URL at build time.
- **Database:** Neon PostgreSQL; set `DATABASE_URL` (SSL required).

## Migrations & seed
Schema is applied idempotently on startup; a labelled synthetic demo account is seeded
if missing. No manual migration step is required for the MVP.

## Security checklist
- [x] No secrets in the frontend bundle (only `REACT_APP_BACKEND_URL`).
- [x] `.env` files git-ignored.
- [x] JWT-protected endpoints; ownership checks on every query.
- [x] File upload size (10 MB) and MIME-type validation.
- [x] No raw stack traces returned (centralised handler logs details, returns a safe message).
- [x] CORS configurable via `CORS_ORIGINS`.

## Notes
- The distance provider is a labelled DEMO adapter; swap in a real maps provider by
  implementing `DistanceProvider` and setting `DISTANCE_PROVIDER`.
- Storage uses Postgres bytea by default; implement `StorageBackend` to move to
  object storage (e.g. S3 / Supabase Storage) without touching business logic.
- **Before going live:** consider removing/rotating the seeded demo account.
