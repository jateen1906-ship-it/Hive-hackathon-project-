"""Incident service."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, text
from ..models import Incident
from .serialize import to_dict
from ..envelope import NotFound


async def create_incident(db, user_id, payload):
    occurred = None
    if payload.occurred_at:
        try:
            occurred = datetime.fromisoformat(payload.occurred_at.replace("Z", "+00:00"))
        except Exception:
            occurred = datetime.now(timezone.utc)
    else:
        occurred = datetime.now(timezone.utc)

    if payload.trip_id:
        owned = (await db.execute(text(
            "SELECT 1 FROM trips WHERE id = :t AND user_id = :u"),
            {"t": str(payload.trip_id), "u": user_id})).first()
        if not owned:
            raise NotFound("Trip not found")

    inc = Incident(
        id=uuid.uuid4(), user_id=uuid.UUID(user_id),
        trip_id=uuid.UUID(str(payload.trip_id)) if payload.trip_id else None,
        latitude=payload.latitude, longitude=payload.longitude,
        location_name=payload.location_name, incident_type=payload.incident_type,
        reason=payload.reason, documents_requested=payload.documents_requested,
        outcome=payload.outcome or "unknown", notes=payload.notes,
        occurred_at=occurred, is_demo=False,
    )
    db.add(inc)
    await db.commit()
    await db.refresh(inc)
    return to_dict(inc)


async def list_incidents(db, user_id):
    rows = (await db.execute(
        select(Incident).where(Incident.user_id == user_id).order_by(Incident.occurred_at.desc())
    )).scalars().all()
    return [to_dict(r) for r in rows]


async def get_incident(db, user_id, incident_id):
    r = (await db.execute(
        select(Incident).where(Incident.id == incident_id, Incident.user_id == user_id)
    )).scalar_one_or_none()
    return to_dict(r) if r else None
