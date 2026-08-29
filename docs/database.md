# Database

Neon PostgreSQL. Schema created by an idempotent SQL migration
(`app/db/migrations/001_initial.sql`) on startup.

## Tables

- **profiles** — users (email, password_hash, full_name, company_name, phone, role).
- **vehicles** — user vehicles (vehicle_number, type, capacity, status, is_demo).
- **trips** — origin/destination, travel_date, goods, invoice_value,
  declared/estimated distance, status, risk_score, risk_level, is_demo.
- **trip_risk_factors** — per-factor breakdown for a trip.
- **documents** — metadata + `extracted_data` (JSONB) + `validation_result` (JSONB).
- **document_files** — file bytes (BYTEA) for server-side storage.
- **incidents** — reported stops/checks (type, reason, documents_requested JSONB,
  outcome, notes, coords, is_demo).
- **route_risk_data** — corridor intelligence (counts, risk_score, is_demo).
- **compliance_rules** — reference rules.
- **risk_evaluations** — full persisted evaluations (factors + recommendations JSONB).

Indexes on `user_id`, `trip_id`, `created_at`, and `risk_level`.

## Data isolation

With Neon + custom JWT auth and a single application DB role, per-user isolation is
enforced in the **service layer** (every query filtered by the JWT `user_id`) rather
than Postgres RLS. Verified by cross-user tests (User B receives 404 for User A's rows).
