"""Public Driver SOS & Checkpost reporting (no login required for drivers)."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ...database import get_db
from ...models import Incident, Trip
from ...envelope import ok, NotFound, BadRequest

router = APIRouter(prefix="/public/trips", tags=["driver-sos"])


@router.get("/{trip_id}/driver-info")
async def get_driver_trip_info(trip_id: str, db: AsyncSession = Depends(get_db)):
    try:
        t_uuid = uuid.UUID(trip_id)
    except Exception:
        raise NotFound("Invalid trip identifier")

    trip = (await db.execute(text("""
        SELECT id, origin, destination, vehicle_number, goods_description, travel_date, status
        FROM trips WHERE id = :t
    """), {"t": str(t_uuid)})).mappings().first()

    if not trip:
        raise NotFound("Trip not found or expired")

    d = dict(trip)
    d["id"] = str(d["id"])
    d["travel_date"] = d["travel_date"].isoformat() if d.get("travel_date") else None
    return ok(d)


@router.post("/{trip_id}/driver-incident")
async def report_driver_incident(trip_id: str, payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    try:
        t_uuid = uuid.UUID(trip_id)
    except Exception:
        raise NotFound("Invalid trip identifier")

    trip = (await db.execute(text("""
        SELECT id, user_id, origin, destination, vehicle_number
        FROM trips WHERE id = :t
    """), {"t": str(t_uuid)})).mappings().first()

    if not trip:
        raise NotFound("Trip not found")

    lat = payload.get("latitude")
    lng = payload.get("longitude")
    loc_name = payload.get("location_name") or f"Highway Node near {trip.get('origin', 'Route')}"
    inc_type = payload.get("incident_type") or "checkpost_stop"
    reason = payload.get("reason") or "Driver reported on highway"
    docs_req = payload.get("documents_requested") or []
    notes = payload.get("notes") or ""
    outcome = payload.get("outcome") or "in_progress"

    inc = Incident(
        id=uuid.uuid4(),
        user_id=trip["user_id"],
        trip_id=t_uuid,
        latitude=float(lat) if lat is not None else None,
        longitude=float(lng) if lng is not None else None,
        location_name=loc_name,
        incident_type=inc_type,
        reason=reason,
        documents_requested=docs_req,
        outcome=outcome,
        notes=notes,
        occurred_at=datetime.now(timezone.utc),
        is_demo=False,
    )
    db.add(inc)
    await db.commit()
    await db.refresh(inc)

    return ok({
        "success": True,
        "incident_id": str(inc.id),
        "message": "Incident report logged and dispatched to fleet manager.",
        "occurred_at": inc.occurred_at.isoformat() if inc.occurred_at else None,
    }, status_code=201)
