"""Seed clearly-labelled SYNTHETIC demonstration data.

All seeded rows carry is_demo=True and belong to a dedicated demo account
(demo@truckshield.app / Demo@12345) so real users' data stays separate.
Demo corridor intelligence is explicitly NOT derived from live enforcement.
"""
import uuid
import logging
from datetime import datetime, timezone, timedelta, date
from sqlalchemy import text

from .migrate import MIGRATIONS_DIR  # noqa
from ..database import AsyncSessionLocal
from ..security import hash_password
from ..engines import risk_engine
from ..services.historical import corridor_signals

logger = logging.getLogger("truckshield.seed")

DEMO_EMAIL = "demo@truckshield.app"
DEMO_PASSWORD = "Demo@12345"

CORRIDORS = [
    # origin, destination, corridor_name, incident_count, doc_checks, dist_issues, risk_score
    ("Surat", "Indore", "Surat\u2013Indore (NH-47)", 12, 8, 5, 62),
    ("Delhi", "Jaipur", "Delhi\u2013Jaipur (NH-48)", 4, 3, 1, 28),
    ("Mumbai", "Pune", "Mumbai\u2013Pune Expressway", 18, 11, 3, 74),
    ("Ahmedabad", "Udaipur", "Ahmedabad\u2013Udaipur (NH-48)", 9, 6, 4, 55),
    ("Chennai", "Bengaluru", "Chennai\u2013Bengaluru (NH-44)", 6, 4, 2, 40),
]

RULES = [
    ("EWB-001", "E-way bill required", "Goods movement above threshold value generally requires a valid e-way bill.", "eway_bill", "high"),
    ("VEH-001", "Valid vehicle number", "Vehicle registration number should follow the standard format.", "vehicle", "medium"),
    ("DIST-001", "Distance consistency", "Declared distance should be broadly consistent with the route distance.", "distance", "medium"),
    ("GST-001", "GSTIN present", "A valid supplier GSTIN should be present on tax invoices.", "tax", "medium"),
    ("INV-001", "Invoice completeness", "Invoice number, date and value should be present and legible.", "invoice", "low"),
]

DEMO_TRIPS = [
    # origin, destination, vehicle_number, vehicle_type, goods, invoice_value, declared_km
    ("Surat", "Indore", "GJ05AB1234", "Container Truck", "Cotton fabric rolls", 448400, 380),
    ("Delhi", "Jaipur", "DL01CA4567", "LCV", "Auto components", 210000, 275),
    ("Mumbai", "Pune", "MH12XY7788", "Trailer", "Steel coils", 890000, 95),
    ("Ahmedabad", "Udaipur", "GJ01LK9090", "Container Truck", "Ceramic tiles", 320000, 210),
    ("Chennai", "Bengaluru", "TN09FG2323", "LCV", "Electronics", 540000, 350),
]

DEMO_INCIDENTS = [
    ("Ahmedabad \u2192 Udaipur corridor", "document_check", "Distance discrepancy", ["E-way Bill", "Invoice"], "released", "Declared distance questioned"),
    ("Mumbai \u2192 Pune Expressway", "vehicle_verification", "Random check", ["RC", "Insurance"], "delayed", "Held for 40 minutes"),
    ("Surat \u2192 Indore (NH-47)", "tax_related_question", "GSTIN verification", ["Invoice", "E-way Bill"], "further_review", "Supplier GSTIN reverified"),
]


async def ensure_seed():
    async with AsyncSessionLocal() as db:
        # already seeded?
        existing = (await db.execute(
            text("SELECT id FROM profiles WHERE email = :e"), {"e": DEMO_EMAIL})).first()
        if existing:
            # still ensure corridor + rules exist (idempotent top-up)
            await _seed_corridors(db)
            await _seed_rules(db)
            await db.commit()
            return

        user_id = uuid.uuid4()
        db.add_all([])
        await db.execute(text("""
            INSERT INTO profiles (id, email, password_hash, full_name, company_name, role)
            VALUES (:id, :e, :p, :n, :c, 'operator')
        """), {"id": str(user_id), "e": DEMO_EMAIL, "p": hash_password(DEMO_PASSWORD),
                "n": "Demo Operator", "c": "Bharat Freight Movers (DEMO)"})

        await _seed_corridors(db)
        await _seed_rules(db)

        # vehicles + trips
        for (origin, dest, veh, vtype, goods, inv, dist) in DEMO_TRIPS:
            vehicle_id = uuid.uuid4()
            await db.execute(text("""
                INSERT INTO vehicles (id, user_id, vehicle_number, vehicle_type, status, is_demo)
                VALUES (:id, :u, :vn, :vt, 'active', true)
            """), {"id": str(vehicle_id), "u": str(user_id), "vn": veh, "vt": vtype})

            trip_id = uuid.uuid4()
            travel = date.today() + timedelta(days=3)
            await db.execute(text("""
                INSERT INTO trips (id, user_id, vehicle_id, origin, destination, travel_date,
                                   goods_description, invoice_value, declared_distance_km,
                                   vehicle_number, vehicle_type, status, is_demo)
                VALUES (:id, :u, :veh, :o, :d, :td, :g, :iv, :dd, :vn, :vt, 'created', true)
            """), {"id": str(trip_id), "u": str(user_id), "veh": str(vehicle_id),
                    "o": origin, "d": dest, "td": travel, "g": goods, "iv": inv,
                    "dd": dist, "vn": veh, "vt": vtype})

            # analyze so dashboard has risk data
            trip = {"origin": origin, "destination": dest, "declared_distance_km": dist,
                    "invoice_value": inv, "goods_description": goods, "vehicle_number": veh}
            hist = await corridor_signals(db, str(user_id), origin, dest)
            result = risk_engine.analyze_trip(trip, None, hist)
            await db.execute(text("""
                UPDATE trips SET risk_score = :s, risk_level = :l,
                    estimated_distance_km = :e, status = 'analyzed' WHERE id = :id
            """), {"s": result["score"], "l": result["level"],
                    "e": result["estimated_distance_km"], "id": str(trip_id)})
            for f in result["factors"]:
                await db.execute(text("""
                    INSERT INTO trip_risk_factors (id, trip_id, factor_type, severity, score,
                        title, description, recommendation)
                    VALUES (:id, :t, :ft, :sv, :sc, :ti, :de, :re)
                """), {"id": str(uuid.uuid4()), "t": str(trip_id), "ft": f["factor_type"],
                        "sv": f["severity"], "sc": f["score"], "ti": f["title"],
                        "de": f["description"], "re": f["recommendation"]})
            import json as _json
            await db.execute(text("""
                INSERT INTO risk_evaluations (id, trip_id, score, level, engine_version, factors, recommendations)
                VALUES (:id, :t, :s, :l, :ev, CAST(:fa AS JSONB), CAST(:rc AS JSONB))
            """), {"id": str(uuid.uuid4()), "t": str(trip_id), "s": result["score"],
                    "l": result["level"], "ev": result["engine_version"],
                    "fa": _json.dumps(result["factors"]), "rc": _json.dumps(result["recommendations"])})

        # incidents
        for (loc, itype, reason, reqs, outcome, notes) in DEMO_INCIDENTS:
            import json as _json
            await db.execute(text("""
                INSERT INTO incidents (id, user_id, location_name, incident_type, reason,
                    documents_requested, outcome, notes, occurred_at, is_demo)
                VALUES (:id, :u, :loc, :it, :re, CAST(:dr AS JSONB), :oc, :no, :oa, true)
            """), {"id": str(uuid.uuid4()), "u": str(user_id), "loc": loc, "it": itype,
                    "re": reason, "dr": _json.dumps(reqs), "oc": outcome, "no": notes,
                    "oa": datetime.now(timezone.utc) - timedelta(days=2)})

        await db.commit()
        logger.info("Seeded SYNTHETIC demo data for %s", DEMO_EMAIL)


async def _seed_corridors(db):
    for (o, d, name, inc, doc, dist, score) in CORRIDORS:
        exists = (await db.execute(text(
            "SELECT 1 FROM route_risk_data WHERE corridor_name = :n"), {"n": name})).first()
        if exists:
            continue
        await db.execute(text("""
            INSERT INTO route_risk_data (id, origin_region, destination_region, corridor_name,
                incident_count, document_check_count, distance_issue_count, risk_score,
                is_demo, period_start, period_end)
            VALUES (:id, :o, :d, :n, :ic, :dc, :di, :rs, true, :ps, :pe)
        """), {"id": str(uuid.uuid4()), "o": o, "d": d, "n": name, "ic": inc, "dc": doc,
                "di": dist, "rs": score, "ps": date.today() - timedelta(days=90),
                "pe": date.today()})


async def _seed_rules(db):
    for (code, title, desc, cat, sev) in RULES:
        exists = (await db.execute(text(
            "SELECT 1 FROM compliance_rules WHERE rule_code = :c"), {"c": code})).first()
        if exists:
            continue
        await db.execute(text("""
            INSERT INTO compliance_rules (id, rule_code, title, description, category, severity, active)
            VALUES (:id, :c, :t, :d, :cat, :s, true)
        """), {"id": str(uuid.uuid4()), "c": code, "t": title, "d": desc, "cat": cat, "s": sev})
