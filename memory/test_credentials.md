# TruckShield — Test Credentials & Notes

## Auth
- Auth type: Custom FastAPI JWT (email/password). NOT Supabase.
- Backend routes under `/api/v1`. JSON envelope: `{success, data, error}`.
- Token returned at login/register in `data.token`; sent as `Authorization: Bearer <token>`.

## Seeded DEMO account (synthetic data)
- email: demo@truckshield.app
- password: Demo@12345
- Has 5 analyzed demo trips, 3 incidents, corridor intelligence (all is_demo=true, labelled SYNTHETIC).

## New account
- POST /api/v1/auth/register  { email, password (min 6), full_name, company_name, phone }

## Database
- Neon PostgreSQL via SQLAlchemy async (DATABASE_URL in backend/.env).

## Notes
- OCR uses Gemini 2.5 Flash via EMERGENT_LLM_KEY (behind adapter).
- Distance is a DEMO deterministic provider (labelled demo), not live maps.
