"""Compliance / document pre-check engine.

Produces POTENTIAL issues only \u2014 never legal determinations. Also yields a
document-risk sub-score (0-100) used by the risk engine.
"""
import re

# Indian commercial vehicle plate format (permissive): e.g. GJ05AB1234
VEHICLE_RE = re.compile(r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$")
# GSTIN: 2 digit state + 10 char PAN + 3 chars
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$")

REQUIRED_FIELDS = [
    "invoice_number", "invoice_date", "vehicle_number", "gstin",
    "invoice_value", "eway_bill_number",
]


def _val(fields: dict, key: str):
    v = fields.get(key)
    if isinstance(v, dict):
        return v.get("value")
    return v


def _norm(s):
    return re.sub(r"[\s\-]", "", str(s)).upper() if s else ""


def validate_document(extracted: dict, trip: dict | None = None) -> dict:
    """Return {status, issues[], positives[], document_risk_score}."""
    fields = extracted.get("fields", extracted) if isinstance(extracted, dict) else {}
    issues = []
    positives = []
    risk = 10  # base

    # 1. missing required fields
    missing = [f for f in REQUIRED_FIELDS if not _val(fields, f)]
    if missing:
        risk += min(35, 7 * len(missing))
        issues.append({
            "code": "MISSING_FIELDS",
            "severity": "medium",
            "title": "Some key fields could not be read",
            "description": "The following fields appear missing or unreadable: " + ", ".join(missing) + ".",
            "recommendation": "Re-check the document image quality and confirm these details manually.",
        })
    else:
        positives.append("All key document fields were detected")

    # 2. vehicle number format
    veh = _norm(_val(fields, "vehicle_number"))
    if veh:
        if VEHICLE_RE.match(veh):
            positives.append("Vehicle number format appears valid")
        else:
            risk += 18
            issues.append({
                "code": "VEHICLE_FORMAT",
                "severity": "medium",
                "title": "Vehicle number format looks unusual",
                "description": f"The detected vehicle number '{veh}' does not match a typical Indian plate format.",
                "recommendation": "Verify the vehicle registration number before dispatch.",
            })

    # 3. GSTIN format
    gstin = _norm(_val(fields, "gstin"))
    if gstin:
        if GSTIN_RE.match(gstin):
            positives.append("GSTIN format appears valid")
        else:
            risk += 15
            issues.append({
                "code": "GSTIN_FORMAT",
                "severity": "medium",
                "title": "GSTIN format appears inconsistent",
                "description": f"The detected GSTIN '{gstin}' does not match the standard 15-character GSTIN pattern.",
                "recommendation": "Confirm the supplier GSTIN on the invoice.",
            })

    # 4. cross-checks against trip record
    if trip:
        t_veh = _norm(trip.get("vehicle_number"))
        if veh and t_veh and veh != t_veh:
            risk += 22
            issues.append({
                "code": "VEHICLE_MISMATCH",
                "severity": "high",
                "title": "Vehicle number differs from the trip record",
                "description": f"Document shows '{veh}' while the trip record shows '{t_veh}'.",
                "recommendation": "Reconcile the vehicle number between the document and the trip.",
            })
        # origin / destination checks
        for key, label in (("origin", "Origin"), ("destination", "Destination")):
            dv = _val(fields, key)
            tv = trip.get(key)
            if dv and tv and _norm(dv) != _norm(tv):
                risk += 10
                issues.append({
                    "code": f"{key.upper()}_MISMATCH",
                    "severity": "low",
                    "title": f"{label} differs from the trip record",
                    "description": f"Document {label.lower()} '{dv}' differs from trip '{tv}'.",
                    "recommendation": f"Confirm the {label.lower()} for this consignment.",
                })
        # declared distance sanity
        dd = _val(fields, "declared_distance")
        if dd and trip.get("declared_distance_km"):
            try:
                dd_num = float(re.sub(r"[^0-9.]", "", str(dd)))
                if abs(dd_num - float(trip["declared_distance_km"])) > 25:
                    risk += 12
                    issues.append({
                        "code": "DISTANCE_INCONSISTENT",
                        "severity": "medium",
                        "title": "Declared distance appears inconsistent",
                        "description": f"Document distance ~{dd_num:.0f} km differs from trip declared {float(trip['declared_distance_km']):.0f} km.",
                        "recommendation": "Review the declared distance figures.",
                    })
            except Exception:
                pass

    # 5. e-way bill validity present
    if not _val(fields, "validity") and _val(fields, "eway_bill_number"):
        issues.append({
            "code": "EWAY_VALIDITY",
            "severity": "low",
            "title": "E-way bill validity should be verified",
            "description": "An e-way bill number was detected but its validity window could not be confirmed.",
            "recommendation": "Verify the e-way bill validity period before travel.",
        })

    risk = max(0, min(100, risk))
    if risk <= 20:
        status = "looks_ok"
    elif risk <= 55:
        status = "review_recommended"
    else:
        status = "attention_needed"

    return {
        "status": status,
        "issues": issues,
        "positives": positives,
        "document_risk_score": risk,
        "notice": "This is an informational pre-check, not a legal determination.",
    }
