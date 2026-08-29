"""Deterministic, explainable risk engine (v1.0).

risk = route*0.25 + distance*0.20 + document*0.25 + historical*0.20 + trip*0.10
Levels: 0-30 LOW, 31-60 MEDIUM, 61-80 HIGH, 81-100 CRITICAL
"""
import re
from .distance_engine import get_distance_provider, distance_anomaly

WEIGHTS = {"route": 0.25, "distance": 0.20, "document": 0.25, "historical": 0.20, "trip": 0.10}
ENGINE_VERSION = "risk-engine-1.0"

_VEH_RE = re.compile(r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$")


def classify(score: float) -> str:
    if score <= 30:
        return "LOW"
    if score <= 60:
        return "MEDIUM"
    if score <= 80:
        return "HIGH"
    return "CRITICAL"


def _sev_from_score(s: float) -> str:
    if s <= 25:
        return "low"
    if s <= 55:
        return "medium"
    if s <= 80:
        return "high"
    return "critical"


def analyze_trip(trip: dict, document_summary: dict | None = None,
                 historical: dict | None = None) -> dict:
    """Compute the full explainable evaluation for a trip dict.

    Returns { score, level, engine_version, estimated_distance_km,
              distance_source, factors[], recommendations[] }
    """
    factors = []
    recommendations = []

    # ---- Distance / route ----
    dp = get_distance_provider()
    dist = dp.estimate_distance(trip.get("origin", ""), trip.get("destination", ""))
    anomaly = distance_anomaly(trip.get("declared_distance_km"), dist.distance_km)
    distance_score = anomaly["score"]

    factors.append({
        "factor_type": "distance_anomaly",
        "severity": anomaly["severity"],
        "score": distance_score,
        "title": "Distance anomaly check",
        "description": anomaly["detail"] + f" (Route estimate source: {dist.source}; demo data.)",
        "recommendation": "Review the declared distance and verify e-way bill distance before dispatch.",
    })
    if distance_score >= 55:
        recommendations.append("Review the declared distance \u2014 it differs materially from the estimated route.")

    # ---- Route risk (corridor-based, from historical/demo) ----
    hist = historical or {}
    corridor_score = hist.get("route_risk_score")
    if corridor_score is None:
        corridor_score = 35  # neutral default
    route_score = float(corridor_score)
    factors.append({
        "factor_type": "route_risk",
        "severity": _sev_from_score(route_score),
        "score": route_score,
        "title": "Corridor / route risk",
        "description": hist.get("route_detail",
            "Route risk derived from demonstration corridor intelligence. "
            "Demonstration data \u2014 not derived from live enforcement activity."),
        "recommendation": "Confirm route and planned stops; keep documents readily available.",
    })

    # ---- Document risk ----
    if document_summary is not None:
        doc_score = float(document_summary.get("document_risk_score", 30))
        doc_desc = (
            f"Document pre-check status: {document_summary.get('status', 'n/a')}. "
            f"{len(document_summary.get('issues', []))} potential issue(s) flagged."
        )
    else:
        doc_score = 50.0
        doc_desc = "No document uploaded for this trip; unable to run a document pre-check."
        recommendations.append("Upload the invoice / e-way bill to run a document pre-check.")
    factors.append({
        "factor_type": "document_risk",
        "severity": _sev_from_score(doc_score),
        "score": doc_score,
        "title": "Document / compliance risk",
        "description": doc_desc,
        "recommendation": "Verify invoice and e-way bill details match the consignment.",
    })

    # ---- Historical incident risk ----
    hist_score = float(hist.get("historical_risk_score", 30))
    factors.append({
        "factor_type": "historical_incidents",
        "severity": _sev_from_score(hist_score),
        "score": hist_score,
        "title": "Historical incident signal",
        "description": hist.get("historical_detail",
            "Based on demonstration incident data for this corridor. "
            "Demonstration data \u2014 not derived from live enforcement activity."),
        "recommendation": "Stay alert on this corridor and ensure paperwork is complete.",
    })

    # ---- Trip / vehicle factors ----
    trip_score = 15.0
    trip_notes = []
    veh = re.sub(r"[\s\-]", "", str(trip.get("vehicle_number") or "")).upper()
    if not veh:
        trip_score += 25
        trip_notes.append("vehicle number not provided")
    elif not _VEH_RE.match(veh):
        trip_score += 30
        trip_notes.append("vehicle number format looks unusual")
    if not trip.get("invoice_value"):
        trip_score += 15
        trip_notes.append("invoice value missing")
    if not trip.get("goods_description"):
        trip_score += 10
        trip_notes.append("goods description missing")
    trip_score = min(100.0, trip_score)
    factors.append({
        "factor_type": "trip_vehicle",
        "severity": _sev_from_score(trip_score),
        "score": trip_score,
        "title": "Trip & vehicle information",
        "description": ("Issues: " + ", ".join(trip_notes) + ".") if trip_notes
            else "Required trip and vehicle information appears present and well-formed.",
        "recommendation": "Provide complete, accurate trip and vehicle details.",
    })

    # ---- Weighted total ----
    components = {
        "route": route_score,
        "distance": distance_score,
        "document": doc_score,
        "historical": hist_score,
        "trip": trip_score,
    }
    total = sum(components[k] * WEIGHTS[k] for k in WEIGHTS)
    score = round(total, 1)
    level = classify(score)

    if not recommendations:
        recommendations.append("Confirm route, vehicle and document details before dispatch.")
    recommendations.append("Verify e-way bill information is current and matches the consignment.")

    return {
        "score": score,
        "level": level,
        "engine_version": ENGINE_VERSION,
        "estimated_distance_km": dist.distance_km,
        "distance_source": dist.source,
        "distance_is_demo": dist.is_demo,
        "components": components,
        "factors": factors,
        "recommendations": recommendations,
    }
