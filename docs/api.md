# API

All routes are prefixed with `/api/v1`. Responses use `{ "success", "data", "error" }`.

## Auth
- `POST /auth/register` — `{ email, password, full_name?, company_name?, phone? }` → `{ token, user }`
- `POST /auth/login` — `{ email, password }` → `{ token, user }`
- `GET  /auth/me` — current profile

## Vehicles
- `GET /vehicles` · `POST /vehicles` · `GET /vehicles/{id}` · `DELETE /vehicles/{id}`

## Trips
- `GET /trips` · `POST /trips` · `GET /trips/{id}` · `PUT /trips/{id}` · `DELETE /trips/{id}`
- `POST /trips/{id}/analyze` — run the risk engine
- `GET  /trips/{id}/risk` — latest evaluation
- `GET  /trips/{id}/report.pdf` — printable PDF report (bearer required)

## Routes
- `POST /routes/analyze` — `{ origin, destination, declared_distance_km? }` → distance + anomaly (demo)

## Documents
- `GET /documents` · `POST /documents` (multipart: file, document_type, trip_id?)
- `GET /documents/{id}` · `POST /documents/{id}/validate` · `GET /documents/{id}/download`

## Incidents
- `GET /incidents` · `POST /incidents` · `GET /incidents/{id}`

## Analytics
- `GET /analytics/dashboard` — KPIs, risk distribution, recent trips/incidents, alerts
- `GET /analytics/corridors` — corridor intelligence for the heatmap

## Errors
```json
{ "success": false, "data": null, "error": { "code": "TRIP_NOT_FOUND", "message": "Trip not found" } }
```
Uses appropriate HTTP status codes (401 auth, 404 not found, 422 validation, 500 internal).
