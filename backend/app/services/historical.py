"""Corridor & historical transit intelligence service."""
from sqlalchemy import text
from ..engines.distance_engine import resolve_location


def _norm(s):
    return (s or "").strip().lower()


async def corridor_signals(db, user_id: str, origin: str, destination: str) -> dict:
    o, d = _norm(origin), _norm(destination)
    o_loc = resolve_location(origin)
    d_loc = resolve_location(destination)
    o_state = o_loc[2] if o_loc else ""
    d_state = d_loc[2] if d_loc else ""

    # Check database corridor table
    row = (await db.execute(text("""
        SELECT corridor_name, incident_count, document_check_count, distance_issue_count, risk_score
        FROM route_risk_data
        WHERE (lower(origin_region) = :o AND lower(destination_region) = :d)
           OR (lower(origin_region) = :d AND lower(destination_region) = :o)
        ORDER BY updated_at DESC LIMIT 1
    """), {"o": o, "d": d})).first()

    # User's own incidents
    inc = (await db.execute(text("""
        SELECT count(*) FROM incidents
        WHERE user_id = :u
          AND (lower(coalesce(location_name,'')) LIKE :op OR lower(coalesce(location_name,'')) LIKE :dp)
    """), {"u": str(user_id), "op": f"%{o}%", "dp": f"%{d}%"})).scalar() or 0

    if row:
        corridor_name, inc_cnt, doc_cnt, dist_cnt, rscore = row
        route_score = float(rscore) if rscore is not None else 35.0
        hist_score = min(100.0, 15 + (int(inc_cnt or 0) * 4) + (int(inc or 0) * 8))
        route_detail = (
            f"Corridor '{corridor_name}': {inc_cnt} checkpost inspections logged, "
            f"{doc_cnt} documentation queries recorded along national freight corridor."
        )
        hist_detail = (
            f"{inc_cnt} historical enforcement checks and {inc} user-reported incidents "
            f"mapped on this freight route."
        )
    else:
        # Dynamic calculation based on route states
        if o_state and d_state and o_state != d_state:
            route_score = 38.0
            route_detail = f"Active interstate transit corridor connecting {o_state} and {d_state} via National Highway network."
        else:
            route_score = 22.0
            route_detail = f"Intrastate freight corridor with standard regional checkposts."
        
        hist_score = min(100.0, 15 + int(inc or 0) * 12)
        hist_detail = (
            f"{inc} historical incident(s) reported on this transit link."
            if inc else "Clear transit corridor with no active detention alerts."
        )

    return {
        "route_risk_score": route_score,
        "route_detail": route_detail,
        "historical_risk_score": hist_score,
        "historical_detail": hist_detail,
        "is_demo": False,
        "user_incident_count": int(inc),
    }
