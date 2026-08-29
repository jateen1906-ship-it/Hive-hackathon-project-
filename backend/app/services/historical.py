"""Corridor / historical intelligence feeding the risk engine.

Combines demonstration corridor data (route_risk_data) with the user's own
incident history to derive route_risk_score and historical_risk_score.
"""
from sqlalchemy import text


def _norm(s):
    return (s or "").strip().lower()


async def corridor_signals(db, user_id: str, origin: str, destination: str) -> dict:
    o, d = _norm(origin), _norm(destination)

    # 1. demonstration corridor intelligence (route_risk_data)
    row = (await db.execute(text("""
        SELECT corridor_name, incident_count, document_check_count, distance_issue_count, risk_score
        FROM route_risk_data
        WHERE (lower(origin_region) = :o AND lower(destination_region) = :d)
           OR (lower(origin_region) = :d AND lower(destination_region) = :o)
        ORDER BY updated_at DESC LIMIT 1
    """), {"o": o, "d": d})).first()

    # 2. user's own incidents on this corridor (real data)
    inc = (await db.execute(text("""
        SELECT count(*) FROM incidents
        WHERE user_id = :u
          AND (lower(coalesce(location_name,'')) LIKE :op OR lower(coalesce(location_name,'')) LIKE :dp)
    """), {"u": user_id, "op": f"%{o}%", "dp": f"%{d}%"})).scalar() or 0

    if row:
        corridor_name, inc_cnt, doc_cnt, dist_cnt, rscore = row
        route_score = float(rscore) if rscore is not None else 40.0
        hist_score = min(100.0, 20 + (int(inc_cnt or 0) * 5) + (int(inc or 0) * 8))
        route_detail = (
            f"Corridor '{corridor_name}': {inc_cnt} recorded checks/incidents, "
            f"{dist_cnt} distance issues in demonstration dataset. "
            "Demonstration data \u2014 not derived from live enforcement activity."
        )
        hist_detail = (
            f"{inc_cnt} demonstration incident(s) and {inc} of your own reported incident(s) "
            "relate to this corridor."
        )
        is_demo = True
    else:
        route_score = 35.0
        hist_score = min(100.0, 20 + int(inc or 0) * 10)
        route_detail = ("No demonstration corridor intelligence for this route. "
                        "Using a neutral baseline.")
        hist_detail = (f"{inc} of your own reported incident(s) relate to this corridor."
                       if inc else "No incident history recorded for this corridor yet.")
        is_demo = False

    return {
        "route_risk_score": route_score,
        "route_detail": route_detail,
        "historical_risk_score": hist_score,
        "historical_detail": hist_detail,
        "is_demo": is_demo,
        "user_incident_count": int(inc),
    }
