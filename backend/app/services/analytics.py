"""Analytics / dashboard aggregation service."""
from sqlalchemy import text


async def dashboard(db, user_id):
    p = {"u": user_id}

    counts = (await db.execute(text("""
        SELECT
          count(*) FILTER (WHERE status != 'analyzed' OR status IS NULL) AS active,
          count(*) FILTER (WHERE risk_level = 'LOW') AS low,
          count(*) FILTER (WHERE risk_level = 'MEDIUM') AS medium,
          count(*) FILTER (WHERE risk_level = 'HIGH') AS high,
          count(*) FILTER (WHERE risk_level = 'CRITICAL') AS critical,
          count(*) AS total,
          coalesce(round(avg(risk_score)::numeric, 1), 0) AS avg_score
        FROM trips WHERE user_id = :u
    """), p)).mappings().first()

    incident_count = (await db.execute(text(
        "SELECT count(*) FROM incidents WHERE user_id = :u"), p)).scalar() or 0

    doc_warnings = (await db.execute(text("""
        SELECT count(*) FROM documents
        WHERE user_id = :u AND validation_result IS NOT NULL
          AND (validation_result->>'status') IN ('review_recommended','attention_needed')
    """), p)).scalar() or 0

    recent_trips = (await db.execute(text("""
        SELECT id, origin, destination, travel_date, risk_score, risk_level, status, is_demo, created_at
        FROM trips WHERE user_id = :u ORDER BY created_at DESC LIMIT 8
    """), p)).mappings().all()

    recent_incidents = (await db.execute(text("""
        SELECT id, location_name, incident_type, outcome, occurred_at, is_demo
        FROM incidents WHERE user_id = :u ORDER BY occurred_at DESC LIMIT 6
    """), p)).mappings().all()

    # route alerts: high/critical analyzed trips + distance-flagged factors
    alerts = []
    high_trips = (await db.execute(text("""
        SELECT origin, destination, risk_level, risk_score FROM trips
        WHERE user_id = :u AND risk_level IN ('HIGH','CRITICAL')
        ORDER BY risk_score DESC LIMIT 5
    """), p)).mappings().all()
    for t in high_trips:
        alerts.append({
            "type": "route",
            "message": f"{t['origin']} \u2192 {t['destination']}: {t['risk_level'].title()} risk ({float(t['risk_score']):.0f}/100)",
        })
    dist_flags = (await db.execute(text("""
        SELECT count(*) FROM trip_risk_factors f
        JOIN trips t ON t.id = f.trip_id
        WHERE t.user_id = :u AND f.factor_type = 'distance_anomaly' AND f.score >= 55
    """), p)).scalar() or 0
    if dist_flags:
        alerts.append({"type": "distance", "message": f"Distance anomalies detected on {dist_flags} trip(s)"})
    if doc_warnings:
        alerts.append({"type": "document", "message": f"{doc_warnings} document(s) need review"})

    def norm_rows(rows):
        out = []
        for r in rows:
            d = dict(r)
            for k, v in d.items():
                if hasattr(v, "isoformat"):
                    d[k] = v.isoformat()
                elif v is not None and k in ("risk_score",):
                    d[k] = float(v)
                else:
                    d[k] = str(v) if k == "id" else v
            out.append(d)
        return out

    return {
        "kpis": {
            "active_trips": int(counts["active"] or 0),
            "low": int(counts["low"] or 0),
            "medium": int(counts["medium"] or 0),
            "high": int(counts["high"] or 0),
            "critical": int(counts["critical"] or 0),
            "total_trips": int(counts["total"] or 0),
            "incidents": int(incident_count),
            "document_warnings": int(doc_warnings),
            "avg_risk_score": float(counts["avg_score"] or 0),
        },
        "risk_distribution": [
            {"level": "LOW", "count": int(counts["low"] or 0)},
            {"level": "MEDIUM", "count": int(counts["medium"] or 0)},
            {"level": "HIGH", "count": int(counts["high"] or 0)},
            {"level": "CRITICAL", "count": int(counts["critical"] or 0)},
        ],
        "recent_trips": norm_rows(recent_trips),
        "recent_incidents": norm_rows(recent_incidents),
        "alerts": alerts,
    }
