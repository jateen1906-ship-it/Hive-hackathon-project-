# TruckShield — plan.md (UPDATED)

## 1) Objectives
- Maintain a **production-quality MVP** that runs end-to-end:
  React (CRA) → FastAPI → **Neon PostgreSQL** → (DEMO distance adapter + Gemini OCR adapter + deterministic risk engine) → React risk report.
- Provide **explainable** compliance-risk scoring (0–100) with factor-level breakdown and actionable recommendations.
- Ensure **strict per-user data isolation** via **FastAPI JWT auth** + ownership-filtered queries (service-layer enforcement).
- Keep architecture **modular** and swappable:
  - `DistanceProvider` adapter (DEMO now; real maps provider later)
  - `OCRProvider` adapter (Gemini via Emergent key now; replaceable)
  - `StorageBackend` adapter (Postgres bytea now; can add Supabase Storage/S3 later)
- Communicate **safe, non-legal** positioning everywhere:
  - Required disclaimer: “TruckShield provides informational compliance pre-checks and risk signals. Results do not constitute legal advice or guarantee enforcement outcomes.”
  - Demo data is **clearly labeled SYNTHETIC**.

**Current status:** Phase 1 and Phase 2 are complete and verified. The application works end-to-end in the browser for Journeys A/B/C.

## 2) Implementation Steps

### Phase 1 — Core POC (isolation; do not proceed until green)
**Goal:** prove the failure-prone integrations: Neon pooler/asyncpg SSL, JWT auth, OCR vision, storage adapter, deterministic risk engine.

✅ **Completed (verified):**
1. Implemented `/app/backend/test_core.py` proving:
   - **DB:** Neon pooler connectivity with async SQLAlchemy + `statement_cache_size=0` + SSL.
   - **Auth:** JWT encode/decode + password hashing verification.
   - **Risk engine:** deterministic scoring and boundary classification.
   - **OCR:** Gemini 2.5 Flash via `EMERGENT_LLM_KEY`, strict JSON extraction.
   - **Storage:** Postgres bytea round-trip with checksum.

**User stories (Phase 1)**
✅ Done:
1. As a developer, I want a one-command script to prove Neon connectivity so I can build confidently.
2. As a developer, I want JWT auth verified end-to-end so every endpoint can be protected consistently.
3. As a developer, I want OCR to return strict JSON so validation is deterministic.
4. As a developer, I want the risk score to be stable across boundaries so reports are consistent.
5. As a developer, I want storage round-trip integrity so uploaded documents are not corrupted.

---

### Phase 2 — V1 App Development (end-to-end MVP)
**Goal:** build the working app around the proven POC core.

✅ **Completed (verified end-to-end):**
1. **Backend foundation (FastAPI modular)**
   - Modular backend under `/app/backend/app/*` with routers/services/engines/integrations.
   - SQLAlchemy async engine configured for Neon pooler.
   - Consistent JSON envelope `{success, data, error}`.
2. **Database schema**
   - Implemented idempotent SQL migration runner (Neon) and created tables:
     `profiles`, `vehicles`, `trips`, `trip_risk_factors`, `documents`, `document_files`, `incidents`, `route_risk_data`, `compliance_rules`, `risk_evaluations`.
3. **Auth (FastAPI JWT email/password)**
   - `/api/v1/auth/register|login|me`.
   - Dependency `get_current_user()`.
4. **Core engines + adapters (deterministic + modular)**
   - `DistanceProvider`: DEMO deterministic distance estimates + anomaly detection.
   - `OCRProvider`: Gemini vision OCR via Emergent key, strict JSON fields+confidence.
   - `StorageBackend`: server-side Postgres bytea storage + download endpoint.
   - Compliance/document pre-check engine: “potential issues” wording only.
   - Deterministic risk engine with explainable factors and recommendations; persisted evaluations.
5. **API routers (v1)**
   - health, auth, vehicles, trips CRUD + analyze/risk, routes analyze, documents upload/get/validate/download, incidents, analytics dashboard.
6. **Seed synthetic DEMO data (clearly labeled)**
   - Created demo account `demo@truckshield.app` with SYNTHETIC trips/incidents/corridor intelligence.
7. **Frontend (React CRA)**
   - Implemented the full UX blueprint (navy/white enterprise design, restrained color usage).
   - Built **all 14 pages**:
     `/` (landing), `/login`, `/register`, `/dashboard`, `/trips`, `/trips/new`, `/trips/:id`, `/trips/:id/risk`, `/documents`, `/documents/:id`, `/incidents`, `/incidents/new`, `/analytics`, `/settings`.
   - Risk gauge + factor breakdown cards + recommendations + disclaimer.
   - Loading/empty/error/success states throughout.
8. **E2E verification**
   - Backend functional tests: **100% pass rate (28/28)** including cross-user isolation (User B cannot access User A’s resources; returns 404).
   - Frontend journeys verified:
     - **A:** Trip create → analyze → risk report.
     - **B:** Document upload → OCR extraction (fields + confidence) → pre-check result.
     - **C:** Incident report → success confirmation → incident appears in list.
   - Fixed analytics alert score formatting (float rendering).
   - “Session persistence issue” reported by test agent was a fresh-context artifact; verified token persistence + direct deep-link navigation works.

**User stories (Phase 2)**
✅ Done:
1. As a fleet user, I want to create a trip and get a risk report before departure.
2. As a fleet user, I want to see *why* a score is high (factors + recommendations) so I can act.
3. As a fleet user, I want to upload an invoice/e-way bill and get a compliance pre-check.
4. As an ops user, I want to record a stop/incident so corridor risk becomes visible.
5. As a manager, I want a dashboard showing today’s high-risk trips and route alerts.

---

### Phase 3 — Stabilization, Tests, Docs (production-quality MVP hardening)
**Goal:** formalize test coverage, operational hardening, and documentation for maintainability and safe handoff.

🔜 **Remaining / recommended next steps:**
1. **Automated test suite (pytest)**
   - Risk engine boundaries + factor math.
   - Distance anomaly detection (edge cases + thresholds).
   - Document validation rules and mismatch detection.
   - API contract tests (envelope + status codes).
   - Authorization/data isolation tests (cross-user 404, list scoping).
2. **Hardening**
   - Rate limiting placeholder.
   - Stronger upload validation and security notes (MIME/type/size already present; document antivirus hook placeholder).
   - Structured logging and request IDs.
   - Background job placeholder for OCR on large PDFs (optional).
3. **Documentation**
   - README: setup, env vars, run instructions, migration/seed, test.
   - `docs/`: architecture (adapters/services), risk model (deterministic), OCR schema, disclaimers, demo-data labeling policy.
   - **Security note:** With Neon + custom JWT auth and a single DB role, per-user isolation is enforced in the service layer (queries filtered by JWT user_id). This replaces Supabase-style RLS; intent verified by tests.
4. **Regression E2E test pass**
   - Run `testing_agent_v3` after stabilization changes.

**User stories (Phase 3)**
1. As a user, I want consistent error messages so I can recover from failures.
2. As a user, I want large uploads to fail gracefully with guidance.
3. As an admin, I want demo data clearly labeled so it’s never confused with real intelligence.
4. As a developer, I want tests to catch regressions in scoring and validation.
5. As a security reviewer, I want proof that users cannot access each other’s trips/documents/incidents.

---

### Phase 4 — Post-verification (GitHub push, when requested)
**Goal:** safely publish to the authorized GitHub repository without losing history.

🔜 Steps when you request GitHub push:
- Inspect existing repository + remote history.
- Preserve existing work; **no force-push**.
- Reconcile remote commits safely.
- Run backend tests and frontend production build.
- Push to the authorized GitHub repo.

## 3) Next Actions
1. Add/expand **pytest test suite** for engines + APIs + authorization.
2. Write **README + docs/** (architecture, adapters, risk engine explanation, disclaimer policy).
3. Run a final stabilization pass (lint/build/test).
4. When you request: perform the **safe GitHub push** workflow.

## 4) Success Criteria
✅ Already achieved:
- POC core checks passed (Neon connectivity, JWT, OCR JSON extraction, storage integrity, risk boundaries).
- App supports end-to-end journeys A/B/C with real DB persistence and explainable reports.
- Authorization verified: users cannot access each other’s trips/documents/incidents.
- UI includes loading/empty/error/success states; disclaimer and SYNTHETIC labeling present.

🔜 Remaining for “production handoff” completeness:
- Automated pytest suite committed and passing.
- README + technical documentation complete.
- Production builds pass.
- GitHub push completed safely when requested.
