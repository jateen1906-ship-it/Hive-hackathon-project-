"""Seed clearly-labelled SYNTHETIC demonstration data.

All seeded rows carry is_demo=True and belong to a dedicated demo account
(demo@truckshield.app / Demo@12345) so real users' data stays separate.
Demo corridor intelligence is explicitly NOT derived from live enforcement.
"""
import uuid
import logging
from datetime import datetime, timezone, timedelta, date
from sqlalchemy import select

from ..database import AsyncSessionLocal
from ..models import (
    Profile, Vehicle, Trip, TripRiskFactor, RiskEvaluation,
    Incident, RouteRiskData, ComplianceRule
)
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
            select(Profile).where(Profile.email == DEMO_EMAIL)
        )).scalar_one_or_none()

        if existing:
            await _seed_corridors(db)
            await _seed_rules(db)
            await db.commit()
            return

        user_id = uuid.uuid4()
        demo_profile = Profile(
            id=user_id,
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            full_name="Demo Operator",
            company_name="Bharat Freight Movers (DEMO)",
            role="operator"
        )
        db.add(demo_profile)
        await db.flush()

        await _seed_corridors(db)
        await _seed_rules(db)

        # vehicles + trips
        for (origin, dest, veh, vtype, goods, inv, dist) in DEMO_TRIPS:
            vehicle_id = uuid.uuid4()
            vehicle = Vehicle(
                id=vehicle_id,
                user_id=user_id,
                vehicle_number=veh,
                vehicle_type=vtype,
                status="active",
                is_demo=True
            )
            db.add(vehicle)

            trip_id = uuid.uuid4()
            travel = date.today() + timedelta(days=3)
            trip_model = Trip(
                id=trip_id,
                user_id=user_id,
                vehicle_id=vehicle_id,
                origin=origin,
                destination=dest,
                travel_date=travel,
                goods_description=goods,
                invoice_value=inv,
                declared_distance_km=dist,
                vehicle_number=veh,
                vehicle_type=vtype,
                status="created",
                is_demo=True
            )
            db.add(trip_model)
            await db.flush()

            # analyze so dashboard has risk data
            trip_data = {"origin": origin, "destination": dest, "declared_distance_km": dist,
                         "invoice_value": inv, "goods_description": goods, "vehicle_number": veh}
            hist = await corridor_signals(db, str(user_id), origin, dest)
            result = risk_engine.analyze_trip(trip_data, None, hist)

            trip_model.risk_score = result["score"]
            trip_model.risk_level = result["level"]
            trip_model.estimated_distance_km = result["estimated_distance_km"]
            trip_model.status = "analyzed"

            for f in result["factors"]:
                factor = TripRiskFactor(
                    id=uuid.uuid4(),
                    trip_id=trip_id,
                    factor_type=f["factor_type"],
                    severity=f["severity"],
                    score=f["score"],
                    title=f["title"],
                    description=f["description"],
                    recommendation=f["recommendation"]
                )
                db.add(factor)

            evaluation = RiskEvaluation(
                id=uuid.uuid4(),
                trip_id=trip_id,
                score=result["score"],
                level=result["level"],
                engine_version=result["engine_version"],
                factors=result["factors"],
                recommendations=result["recommendations"]
            )
            db.add(evaluation)

        # incidents
        for (loc, itype, reason, reqs, outcome, notes) in DEMO_INCIDENTS:
            incident = Incident(
                id=uuid.uuid4(),
                user_id=user_id,
                location_name=loc,
                incident_type=itype,
                reason=reason,
                documents_requested=reqs,
                outcome=outcome,
                notes=notes,
                occurred_at=datetime.now(timezone.utc) - timedelta(days=2),
                is_demo=True
            )
            db.add(incident)

        await db.commit()
        logger.info("Seeded SYNTHETIC demo data for %s", DEMO_EMAIL)


async def _seed_corridors(db):
    for (o, d, name, inc, doc, dist, score) in CORRIDORS:
        exists = (await db.execute(
            select(RouteRiskData).where(RouteRiskData.corridor_name == name)
        )).scalar_one_or_none()
        if exists:
            continue
        corr = RouteRiskData(
            id=uuid.uuid4(),
            origin_region=o,
            destination_region=d,
            corridor_name=name,
            incident_count=inc,
            document_check_count=doc,
            distance_issue_count=dist,
            risk_score=score,
            is_demo=True,
            period_start=date.today() - timedelta(days=90),
            period_end=date.today()
        )
        db.add(corr)


async def _seed_rules(db):
    for (code, title, desc, cat, sev) in RULES:
        exists = (await db.execute(
            select(ComplianceRule).where(ComplianceRule.rule_code == code)
        )).scalar_one_or_none()
        if exists:
            continue
        rule = ComplianceRule(
            id=uuid.uuid4(),
            rule_code=code,
            title=title,
            description=desc,
            category=cat,
            severity=sev,
            active=True
        )
        db.add(rule)
