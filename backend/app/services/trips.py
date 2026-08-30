"""Trip service: CRUD + analyze (risk engine orchestration)."""
import uuid
from sqlalchemy import select, text
from ..models import Trip, Vehicle, TripRiskFactor, RiskEvaluation, Document
from ..engines import risk_engine
from ..engines.distance_engine import get_distance_provider
from .serialize import to_dict
from .historical import corridor_signals
from ..envelope import NotFound, AppError


async def _resolve_vehicle_number(db, user_id, payload):
    if getattr(payload, "vehicle_id", None):
        v = (await db.execute(select(Vehicle).where(
            Vehicle.id == payload.vehicle_id, Vehicle.user_id == user_id))).scalar_one_or_none()
        if v:
            return str(v.id), v.vehicle_number, v.vehicle_type
    return None, (payload.vehicle_number or None), (payload.vehicle_type or None)


async def create_trip(db, user_id, payload):
    vehicle_id, veh_no, veh_type = await _resolve_vehicle_number(db, user_id, payload)
    if veh_no:
        veh_no = veh_no.upper().replace(" ", "")
    t = Trip(
        id=uuid.uuid4(), user_id=uuid.UUID(user_id),
        vehicle_id=uuid.UUID(vehicle_id) if vehicle_id else None,
        origin=payload.origin, destination=payload.destination,
        travel_date=payload.travel_date, goods_description=payload.goods_description,
        invoice_value=payload.invoice_value, declared_distance_km=payload.declared_distance_km,
        vehicle_number=veh_no, vehicle_type=veh_type, status="created", is_demo=False,
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return to_dict(t)


async def list_trips(db, user_id):
    rows = (await db.execute(
        select(Trip).where(Trip.user_id == user_id).order_by(Trip.created_at.desc())
    )).scalars().all()
    return [to_dict(r) for r in rows]


async def _get_trip_row(db, user_id, trip_id):
    return (await db.execute(
        select(Trip).where(Trip.id == trip_id, Trip.user_id == user_id)
    )).scalar_one_or_none()


async def get_trip(db, user_id, trip_id):
    r = await _get_trip_row(db, user_id, trip_id)
    if not r:
        return None
    data = to_dict(r)
    factors = (await db.execute(
        select(TripRiskFactor).where(TripRiskFactor.trip_id == trip_id)
    )).scalars().all()
    data["risk_factors"] = [to_dict(f) for f in factors]
    docs = (await db.execute(
        select(Document).where(Document.trip_id == trip_id))).scalars().all()
    data["documents"] = [to_dict(d) for d in docs]
    return data


async def update_trip(db, user_id, trip_id, payload):
    r = await _get_trip_row(db, user_id, trip_id)
    if not r:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "vehicle_number" and value:
            value = value.upper().replace(" ", "")
        setattr(r, field, value)
    await db.commit()
    await db.refresh(r)
    return to_dict(r)


async def delete_trip(db, user_id, trip_id):
    r = await _get_trip_row(db, user_id, trip_id)
    if not r:
        return False
    await db.delete(r)
    await db.commit()
    return True


async def analyze_trip(db, user_id, trip_id):
    from ..billing import service as billing
    r = await _get_trip_row(db, user_id, trip_id)
    if not r:
        raise NotFound("Trip not found")
    trip = to_dict(r)

    # ---- server-side plan gating: monthly check limit ----
    ent = await billing.entitlements(db, user_id)
    if not billing.can_run_check(ent):
        limit = ent["config"]["checks_per_month"]
        raise AppError(
            "LIMIT_REACHED",
            f"You've used all {limit} pre-dispatch checks this month on the {ent['config']['name']} plan. "
            "Upgrade to run more.",
            402,
        )

    # latest validated document summary for this trip (if any)
    doc = (await db.execute(text("""
        SELECT validation_result FROM documents
        WHERE trip_id = :t AND validation_result IS NOT NULL
        ORDER BY created_at DESC LIMIT 1
    """), {"t": str(trip_id)})).first()
    document_summary = doc[0] if doc and doc[0] else None

    historical = await corridor_signals(db, user_id, trip.get("origin"), trip.get("destination"))
    # tier decides live vs demo distance provider
    provider = get_distance_provider(live=bool(ent["config"]["live_distance"]))
    result = risk_engine.analyze_trip(trip, document_summary, historical, distance_provider=provider)

    # persist on trip
    r.risk_score = result["score"]
    r.risk_level = result["level"]
    r.estimated_distance_km = result["estimated_distance_km"]
    r.status = "analyzed"

    # replace factors
    await db.execute(text("DELETE FROM trip_risk_factors WHERE trip_id = :t"), {"t": str(trip_id)})
    for f in result["factors"]:
        db.add(TripRiskFactor(
            id=uuid.uuid4(), trip_id=uuid.UUID(str(trip_id)),
            factor_type=f["factor_type"], severity=f["severity"], score=f["score"],
            title=f["title"], description=f["description"], recommendation=f["recommendation"],
        ))

    ev = RiskEvaluation(
        id=uuid.uuid4(), trip_id=uuid.UUID(str(trip_id)), score=result["score"],
        level=result["level"], engine_version=result["engine_version"],
        factors=result["factors"], recommendations=result["recommendations"],
    )
    db.add(ev)
    await db.commit()

    await billing.increment_usage(db, user_id)

    result["trip_id"] = str(trip_id)
    result["trip"] = await get_trip(db, user_id, trip_id)
    result["historical"] = historical
    return result


async def latest_risk(db, user_id, trip_id):
    r = await _get_trip_row(db, user_id, trip_id)
    if not r:
        return None
    ev = (await db.execute(
        select(RiskEvaluation).where(RiskEvaluation.trip_id == trip_id)
        .order_by(RiskEvaluation.created_at.desc())
    )).scalars().first()
    if not ev:
        return {"trip": to_dict(r), "evaluation": None}
    return {"trip": to_dict(r), "evaluation": to_dict(ev)}
