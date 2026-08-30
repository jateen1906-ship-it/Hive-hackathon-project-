"""Analytics / dashboard aggregation service."""
from sqlalchemy import text, select
from ..models import Document


async def dashboard(db, user_id):
    p = {"u": str(user_id)}

    counts = (await db.execute(text("""
        SELECT
          count(CASE WHEN status != 'analyzed' OR status IS NULL THEN 1 END) AS active,
          count(CASE WHEN risk_level = 'LOW' THEN 1 END) AS low,
          count(CASE WHEN risk_level = 'MEDIUM' THEN 1 END) AS medium,
          count(CASE WHEN risk_level = 'HIGH' THEN 1 END) AS high,
          count(CASE WHEN risk_level = 'CRITICAL' THEN 1 END) AS critical,
          count(*) AS total,
          coalesce(round(avg(risk_score), 1), 0) AS avg_score
        FROM trips WHERE user_id = :u
    """), p)).mappings().first()

    incident_count = (await db.execute(text(
        "SELECT count(*) FROM incidents WHERE user_id = :u"), p)).scalar() or 0

    # Fetch document warnings safely across database types
    docs = (await db.execute(
        select(Document.validation_result).where(Document.user_id == user_id)
    )).scalars().all()
    
    doc_warnings = sum(
        1 for vr in docs
        if vr and isinstance(vr, dict) and vr.get("status") in ("review_recommended", "attention_needed")
    )

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


# Approx coordinates [lat, lng] for common Indian cities (demo map placement).
CITY_COORDS = {
    "surat": [21.1702, 72.8311], "indore": [22.7196, 75.8577],
    "delhi": [28.6139, 77.2090], "jaipur": [26.9124, 75.7873],
    "mumbai": [19.0760, 72.8777], "pune": [18.5204, 73.8567],
    "ahmedabad": [23.0225, 72.5714], "udaipur": [24.5854, 73.7125],
    "chennai": [13.0827, 80.2707], "bengaluru": [12.9716, 77.5946],
    "bangalore": [12.9716, 77.5946], "agra": [27.1767, 78.0081],
    "nashik": [19.9975, 73.7898], "hyderabad": [17.3850, 78.4867],
    "vijayawada": [16.5062, 80.6480], "kolkata": [22.5726, 88.3639],
    "ranchi": [23.3441, 85.3096],
}


def _coord(name):
    return CITY_COORDS.get((name or "").strip().lower())


async def corridors(db, user_id):
    """Corridor intelligence for the heatmap: demo corridor data + user incidents w/ coords."""
    rows = (await db.execute(text("""
        SELECT origin_region, destination_region, corridor_name, incident_count,
               document_check_count, distance_issue_count, risk_score, is_demo
        FROM route_risk_data ORDER BY risk_score DESC
    """))).mappings().all()

    corridors_out = []
    for r in rows:
        oc = _coord(r["origin_region"])
        dc = _coord(r["destination_region"])
        if not oc or not dc:
            continue
        # blend in the user's own incidents that mention either endpoint
        own = (await db.execute(text("""
            SELECT count(*) FROM incidents WHERE user_id = :u
              AND (lower(coalesce(location_name,'')) LIKE :o OR lower(coalesce(location_name,'')) LIKE :d)
        """), {"u": str(user_id), "o": f"%{r['origin_region'].lower()}%", "d": f"%{r['destination_region'].lower()}%"})).scalar() or 0
        corridors_out.append({
            "corridor_name": r["corridor_name"],
            "origin": r["origin_region"],
            "destination": r["destination_region"],
            "origin_coord": oc,
            "destination_coord": dc,
            "midpoint": [(oc[0] + dc[0]) / 2, (oc[1] + dc[1]) / 2],
            "incident_count": int(r["incident_count"] or 0),
            "document_check_count": int(r["document_check_count"] or 0),
            "distance_issue_count": int(r["distance_issue_count"] or 0),
            "user_incident_count": int(own),
            "risk_score": float(r["risk_score"] or 0),
            "is_demo": bool(r["is_demo"]),
        })

    # user's incidents that carry explicit coordinates
    inc_rows = (await db.execute(text("""
        SELECT location_name, latitude, longitude, incident_type, outcome
        FROM incidents WHERE user_id = :u AND latitude IS NOT NULL AND longitude IS NOT NULL
    """), {"u": str(user_id)})).mappings().all()
    incident_points = [{
        "location_name": r["location_name"], "lat": float(r["latitude"]), "lng": float(r["longitude"]),
        "incident_type": r["incident_type"], "outcome": r["outcome"],
    } for r in inc_rows]

    return {"corridors": corridors_out, "incident_points": incident_points}


async def corridor_detail(db, user_id, origin, destination):
    o, d = (origin or "").strip().lower(), (destination or "").strip().lower()
    trips = (await db.execute(text("""
        SELECT id, origin, destination, travel_date, risk_score, risk_level, status, is_demo
        FROM trips WHERE user_id = :u
          AND ((lower(origin) = :o AND lower(destination) = :d)
            OR (lower(origin) = :d AND lower(destination) = :o))
        ORDER BY created_at DESC
    """), {"u": str(user_id), "o": o, "d": d})).mappings().all()
    incidents = (await db.execute(text("""
        SELECT id, location_name, incident_type, outcome, reason, occurred_at, is_demo
        FROM incidents WHERE user_id = :u
          AND (lower(coalesce(location_name,'')) LIKE :op OR lower(coalesce(location_name,'')) LIKE :dp)
        ORDER BY occurred_at DESC
    """), {"u": str(user_id), "op": f"%{o}%", "dp": f"%{d}%"})).mappings().all()

    def norm(rows):
        out = []
        for r in rows:
            row = dict(r)
            for k, v in row.items():
                if hasattr(v, "isoformat"):
                    row[k] = v.isoformat()
                elif k == "id":
                    row[k] = str(v)
                elif k == "risk_score" and v is not None:
                    row[k] = float(v)
            out.append(row)
        return out

    return {"origin": origin, "destination": destination,
            "trips": norm(trips), "incidents": norm(incidents)}
