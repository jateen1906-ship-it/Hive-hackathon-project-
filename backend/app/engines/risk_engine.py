"""Dynamic, explainable, and comprehensive compliance & risk evaluation engine.

Evaluates all real parameters:
- Route & corridor safety, toll & state border checkpoints
- Distance anomaly & E-way bill validity duration
- Statutory GST & invoice compliance (Rule 138)
- Goods sensitivity, Hazchem, perishable cold-chain, and theft risk
- Vehicle registration format, permit scope, and body-type suitability
- Document verification and OCR pre-checks
"""
import re
from datetime import datetime, date, timezone
from typing import Optional
from .distance_engine import get_distance_provider, distance_anomaly, resolve_location

ENGINE_VERSION = "truckshield-core-v2.2"
_VEH_RE = re.compile(r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$")
_BH_RE = re.compile(r"^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$")

# Cargo classification keywords
HAZCHEM_KEYWORDS = [
    "chemical", "acid", "gas", "petrol", "diesel", "fuel", "lpg", "cng", "battery",
    "batteries", "flammable", "inflammable", "explosive", "paint", "solvent", "hazardous",
    "corrosive", "pesticide", "toxic", "fertilizer", "ammonia"
]

COLDCHAIN_KEYWORDS = [
    "pharma", "medicine", "vaccine", "dairy", "milk", "cheese", "butter", "ice cream",
    "seafood", "fish", "meat", "poultry", "fruit", "vegetable", "perishable", "frozen",
    "chocolate", "confectionery", "biological"
]

HIGH_THEFT_KEYWORDS = [
    "electronics", "mobile", "phone", "laptop", "computer", "copper", "aluminium",
    "liquor", "alcohol", "whiskey", "beer", "tobacco", "cigarette", "gutkha", "gold",
    "silver", "jewellery", "tyres", "tires", "garments"
]

HEAVY_BULK_KEYWORDS = [
    "steel", "iron", "coil", "rebar", "cement", "machinery", "marble", "granite",
    "sand", "ore", "timber", "scaffolding", "crane", "transformer"
]

UNSAFE_HAZCHEM_VEHICLES = ["tipper", "open", "dumper", "tractor", "flatbed"]


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
    if s <= 78:
        return "high"
    return "critical"


def _parse_date(d) -> Optional[date]:
    if not d:
        return None
    if isinstance(d, date):
        return d
    if isinstance(d, datetime):
        return d.date()
    try:
        return datetime.fromisoformat(str(d).replace("Z", "")).date()
    except Exception:
        pass
    try:
        return datetime.strptime(str(d)[:10], "%Y-%m-%d").date()
    except Exception:
        return None


def analyze_trip(
    trip: dict,
    document_summary: dict | None = None,
    historical: dict | None = None,
    distance_provider=None
) -> dict:
    """Compute the explainable evaluation for a trip dict based on genuine logistics parameters."""
    factors = []
    recommendations = []

    origin = str(trip.get("origin") or "").strip()
    destination = str(trip.get("destination") or "").strip()
    declared_km = trip.get("declared_distance_km")
    invoice_val = float(trip.get("invoice_value") or 0)
    goods_desc = str(trip.get("goods_description") or "").lower()
    veh_num = re.sub(r"[\s\-]", "", str(trip.get("vehicle_number") or "")).upper()
    veh_type = str(trip.get("vehicle_type") or "").strip()
    travel_date_val = _parse_date(trip.get("travel_date"))
    today = datetime.now(timezone.utc).date()

    dp = distance_provider or get_distance_provider()
    dist_res = dp.estimate_distance(origin, destination)
    est_km = dist_res.distance_km

    # =========================================================================
    # 1. DISTANCE & ROUTE ANOMALY EVALUATION (Weight: 20%)
    # =========================================================================
    anomaly = distance_anomaly(declared_km, est_km)
    distance_score = float(anomaly["score"])
    
    factors.append({
        "factor_type": "distance_anomaly",
        "severity": anomaly["severity"],
        "score": distance_score,
        "title": "Distance & Transit Feasibility",
        "description": f"{anomaly['detail']} (Estimated driving duration: ~{dist_res.estimated_duration_hours:.1f} hrs across corridor).",
        "recommendation": "Cross-verify odometer and Google/OSRM highway distance with E-Way Bill Part B declared distance.",
    })
    if distance_score >= 50:
        recommendations.append("Update declared distance on E-Way Bill to prevent tax authority penalties for route deviation.")

    # =========================================================================
    # 2. CORRIDOR, INTER-STATE & CHECKPOST RISK (Weight: 15%)
    # =========================================================================
    o_loc = resolve_location(origin)
    d_loc = resolve_location(destination)
    o_state = o_loc[2] if o_loc else dist_res.origin_state or "UN"
    d_state = d_loc[2] if d_loc else dist_res.destination_state or "UN"
    is_interstate = (o_state != d_state) and (o_state != "UN" and d_state != "UN")

    hist = historical or {}
    base_corridor = float(hist.get("route_risk_score") or 35.0)

    if is_interstate:
        corridor_score = min(75.0, base_corridor + 12.0)
        corridor_desc = (
            f"Inter-state corridor movement ({o_state} \u2192 {d_state}). Transit involves crossing state border "
            f"commercial tax checkposts and RTO inspection booths."
        )
        corridor_rec = f"Ensure active National Permit (NP) or State Transit Form is onboard for {d_state} entry."
    else:
        corridor_score = max(12.0, base_corridor - 12.0)
        corridor_desc = f"Intra-state movement within {o_state}. Standard state logistics guidelines apply."
        corridor_rec = "Maintain local tax invoice, delivery challan, and driver RC/DL documentation."

    factors.append({
        "factor_type": "route_risk",
        "severity": _sev_from_score(corridor_score),
        "score": corridor_score,
        "title": "Corridor & Checkpost Risk",
        "description": corridor_desc,
        "recommendation": corridor_rec,
    })

    # =========================================================================
    # 3. DATE, SCHEDULE & E-WAY BILL VALIDITY (Weight: 15%)
    # =========================================================================
    schedule_score = 12.0
    schedule_notes = []
    
    if travel_date_val:
        days_diff = (travel_date_val - today).days
        if days_diff < 0:
            schedule_score = 82.0
            schedule_notes.append(f"Retroactive travel date ({travel_date_val.strftime('%d %b %Y')}, {-days_diff} days ago). Potential expired e-way bill risk")
            recommendations.append("Regenerate or re-date the transit documentation for current active movement.")
        elif days_diff > 5:
            schedule_score = 45.0
            schedule_notes.append(f"Advance scheduling ({days_diff} days ahead). E-Way bills cannot be generated more than 1 day before dispatch")
        else:
            schedule_score = 10.0
            schedule_notes.append("Scheduled dispatch window is timely and valid")
        
        # Check if transit duration fits in standard E-way bill validity days
        needed_days = max(1, int(round(dist_res.estimated_duration_hours / 18.0)))
        allowed_eway_days = dist_res.eway_validity_days
        if needed_days > allowed_eway_days:
            schedule_score = max(schedule_score, 65.0)
            schedule_notes.append(f"Transit duration (~{needed_days} days) exceeds/tight against statutory E-Way bill validity ({allowed_eway_days} day(s))")
            recommendations.append("Track vehicle en-route to apply for E-Way Bill extension within 8 hours of expiry if delayed.")
    else:
        schedule_score = 45.0
        schedule_notes.append("Travel date not provided; unable to verify statutory validity window")

    factors.append({
        "factor_type": "schedule_validity",
        "severity": _sev_from_score(schedule_score),
        "score": schedule_score,
        "title": "Dispatch Timeline & E-Way Validity",
        "description": ". ".join(schedule_notes) + f". (Statutory E-Way Bill Validity: {dist_res.eway_validity_days} day(s) for {est_km:.0f} km).",
        "recommendation": "Monitor transit timeline to prevent dispatch on expired or near-expiry regulatory permits.",
    })

    # =========================================================================
    # 4. INVOICE VALUE & STATUTORY GST COMPLIANCE (Weight: 15%)
    # =========================================================================
    invoice_score = 12.0
    invoice_notes = []

    if invoice_val <= 0:
        invoice_score = 55.0
        invoice_notes.append("Invoice value not specified; cannot verify statutory GST threshold")
        recommendations.append("Enter invoice amount to calculate exact E-Way Bill requirement and cargo insurance threshold.")
    elif invoice_val >= 5000000:  # > 50 Lakhs
        invoice_score = 78.0
        invoice_notes.append(f"High-value critical consignment (\u20B9{invoice_val:,.0f}). Requires enhanced transit insurance & armed/GPS tracking")
        recommendations.append("Deploy dedicated GPS container lock and mandatory commercial transit risk cover.")
    elif invoice_val >= 1000000:  # > 10 Lakhs
        invoice_score = 48.0
        invoice_notes.append(f"High-value freight (\u20B9{invoice_val:,.0f}). Standard commercial goods in transit insurance recommended")
        recommendations.append("Verify consignor/consignee GSTIN active status and e-Invoice IRN QR code.")
    elif invoice_val >= 50000:  # >= 50,000 INR
        invoice_score = 18.0
        invoice_notes.append(f"Consignment value (\u20B9{invoice_val:,.0f}) exceeds \u20B950,000 threshold. Statutory GST E-Way Bill (Rule 138) is MANDATORY")
    else:
        invoice_score = 8.0
        invoice_notes.append(f"Consignment value (\u20B9{invoice_val:,.0f}) is below the mandatory \u20B950,000 E-Way Bill threshold. Delivery Challan required")

    factors.append({
        "factor_type": "invoice_compliance",
        "severity": _sev_from_score(invoice_score),
        "score": invoice_score,
        "title": "Invoice Value & GST Rule 138",
        "description": ". ".join(invoice_notes) + ".",
        "recommendation": "Ensure invoice serial number, HSN codes, and GST rates match physical load exactly.",
    })

    # =========================================================================
    # 5. CARGO NATURE & VEHICLE SUITABILITY (Weight: 20%)
    # =========================================================================
    cargo_score = 10.0
    cargo_notes = []
    veh_type_lower = veh_type.lower()

    # Check Hazchem
    is_hazchem = any(k in goods_desc for k in HAZCHEM_KEYWORDS)
    if is_hazchem:
        cargo_score += 48.0
        cargo_notes.append("Hazardous/Chemical cargo detected: Mandatory TREM Card, Emergency Information Panel & Spark Arrestor required")
        recommendations.append("Verify driver has valid Hazardous Materials transport endorsement on driving license.")
        
        # Check unsafe body type for Hazchem (e.g. Tipper, Open Truck)
        if any(bad in veh_type_lower for bad in UNSAFE_HAZCHEM_VEHICLES):
            cargo_score += 40.0
            cargo_notes.append(f"CRITICAL HAZARD: Carrying hazardous chemicals in an unsafe '{veh_type or 'Open'}' body. Tanker or Hazchem-certified closed container is legally mandated")
            recommendations.append("CRITICAL: Re-assign to a certified Hazmat Tanker or sealed Container vehicle immediately.")

    # Check Cold-Chain
    is_coldchain = any(k in goods_desc for k in COLDCHAIN_KEYWORDS)
    if is_coldchain:
        cargo_score += 35.0
        cargo_notes.append("Temperature-sensitive / perishable freight detected")
        if "reefer" not in veh_type_lower and "refrigerated" not in veh_type_lower and "container" not in veh_type_lower:
            cargo_score += 45.0
            cargo_notes.append(f"Vehicle type '{veh_type or 'Open Truck'}' is NOT insulated/refrigerated. High spoilage risk")
            recommendations.append("Assign an active Reefer (Refrigerated) vehicle with continuous temperature data-logging.")
        else:
            cargo_notes.append("Refrigerated / Container carrier matches cold-chain requirement")

    # Check High Theft
    is_high_theft = any(k in goods_desc for k in HIGH_THEFT_KEYWORDS)
    if is_high_theft:
        cargo_score += 30.0
        cargo_notes.append("High pilferage/theft sensitivity category (electronics, liquor, or metals)")
        if "open" in veh_type_lower or "tipper" in veh_type_lower:
            cargo_score += 35.0
            cargo_notes.append("Open body vehicle exposes high-value cargo to weather and theft")
            recommendations.append("Mandate Hard-Top Containerized vehicle with numbered security bolt seals.")

    # Check Heavy Bulk
    is_heavy = any(k in goods_desc for k in HEAVY_BULK_KEYWORDS)
    if is_heavy:
        cargo_score += 20.0
        cargo_notes.append("Heavy industrial / bulk freight: Axle load weight compliance required to prevent overload challan")

    if not (is_hazchem or is_coldchain or is_high_theft or is_heavy):
        if goods_desc:
            cargo_notes.append("Standard dry commercial freight; general cargo compliance applies")
        else:
            cargo_score += 20.0
            cargo_notes.append("Goods description missing; cargo classification unverified")

    cargo_score = min(100.0, cargo_score)
    factors.append({
        "factor_type": "cargo_suitability",
        "severity": _sev_from_score(cargo_score),
        "score": cargo_score,
        "title": "Cargo Sensitivity & Vehicle Match",
        "description": ". ".join(cargo_notes) + ".",
        "recommendation": "Confirm vehicle body type and cargo tie-down lashing meet safety standards.",
    })

    # =========================================================================
    # 6. VEHICLE REGISTRATION & FLEET VALIDATION (Weight: 15%)
    # =========================================================================
    fleet_score = 10.0
    fleet_notes = []

    if not veh_num:
        fleet_score = 75.0
        fleet_notes.append("Vehicle registration number not assigned")
        recommendations.append("Assign validated commercial vehicle registration number prior to generating E-Way Bill Part B.")
    elif _VEH_RE.match(veh_num) or _BH_RE.match(veh_num):
        reg_state = veh_num[:2]
        fleet_notes.append(f"Vehicle number format is verified ({veh_num}, registered in {reg_state})")
        if o_state != "UN" and reg_state != o_state and not veh_num.startswith("BH"):
            fleet_score = 28.0
            fleet_notes.append(f"Vehicle registered in {reg_state} operating from {o_state}. National Permit (NP) compliance required")
            recommendations.append("Ensure National Permit Authorization (Form 48) and All India Permit taxes are current.")
        else:
            fleet_score = 10.0
    else:
        fleet_score = 85.0
        fleet_notes.append(f"Vehicle registration number '{veh_num}' does not match standard Indian RTO format (e.g. MH04AB1234). High risk of immediate RTO detention")
        recommendations.append("Correct vehicle registration number to match the official VAHAN database record.")

    factors.append({
        "factor_type": "trip_vehicle",
        "severity": _sev_from_score(fleet_score),
        "score": fleet_score,
        "title": "Vehicle Registration & Permit Check",
        "description": ". ".join(fleet_notes) + ".",
        "recommendation": "Check Fitness Certificate (FC), Commercial Insurance, and Pollution (PUCC) validity.",
    })

    # =========================================================================
    # MULTI-FACTOR COMPOSITE RISK CALCULATION WITH CRITICALITY ESCALATION
    # =========================================================================
    weights = {
        "distance": 0.20,
        "route": 0.15,
        "schedule": 0.15,
        "invoice": 0.15,
        "cargo": 0.20,
        "fleet": 0.15,
    }
    
    base_score = (
        distance_score * weights["distance"] +
        corridor_score * weights["route"] +
        schedule_score * weights["schedule"] +
        invoice_score * weights["invoice"] +
        cargo_score * weights["cargo"] +
        fleet_score * weights["fleet"]
    )

    # Document check adjustment if document was uploaded
    if document_summary:
        doc_risk = float(document_summary.get("document_risk_score", 25.0))
        base_score = (base_score * 0.85) + (doc_risk * 0.15)
        factors.append({
            "factor_type": "document_risk",
            "severity": _sev_from_score(doc_risk),
            "score": doc_risk,
            "title": "Document OCR & Pre-Check",
            "description": f"Verified uploaded document ({document_summary.get('status', 'uploaded')}).",
            "recommendation": "Maintain verified hardcopy and digital PDF of E-Way Bill in cab.",
        })

    # ---- Intelligent Risk Escalation (Safety & Enforcement Criticality) ----
    # In logistics compliance, severe individual violations (e.g. 52% distance anomaly,
    # chemical carriage in tipper, or fake plate number) cannot be masked by low scores in other areas.
    all_scores = [distance_score, corridor_score, schedule_score, invoice_score, cargo_score, fleet_score]
    max_s = max(all_scores)
    critical_count = sum(1 for s in all_scores if s >= 78)
    high_count = sum(1 for s in all_scores if s >= 55)

    if critical_count >= 2:
        # Multiple critical violations -> CRITICAL risk
        composite_score = max(base_score, 82.0 + (max_s - 82.0) * 0.5)
    elif critical_count == 1:
        # 1 Critical violation -> High risk floor
        composite_score = max(base_score, max_s * 0.72 + base_score * 0.28)
    elif high_count >= 2:
        # Multiple High risk flags -> High risk
        composite_score = max(base_score, 62.0 + (high_count - 2) * 5.0)
    else:
        composite_score = base_score

    final_score = round(min(100.0, max(5.0, composite_score)), 1)
    risk_level = classify(final_score)

    if not recommendations:
        recommendations.append("All primary pre-departure compliance indicators meet standard operating benchmarks.")
        recommendations.append("Proceed with standard pre-dispatch inspection and driver briefing.")

    return {
        "score": final_score,
        "level": risk_level,
        "engine_version": ENGINE_VERSION,
        "estimated_distance_km": est_km,
        "distance_source": dist_res.source,
        "distance_is_demo": False,
        "factors": factors,
        "recommendations": list(dict.fromkeys(recommendations)),  # deduplicate
        "transit_metrics": {
            "estimated_distance_km": est_km,
            "estimated_duration_hours": dist_res.estimated_duration_hours,
            "eway_validity_days": dist_res.eway_validity_days,
            "is_interstate": is_interstate,
            "origin_state": o_state,
            "destination_state": d_state,
        },
    }
