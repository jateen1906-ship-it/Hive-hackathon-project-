"""Vehicle service."""
import uuid
from sqlalchemy import select
from ..models import Vehicle
from .serialize import to_dict


async def list_vehicles(db, user_id):
    rows = (await db.execute(
        select(Vehicle).where(Vehicle.user_id == user_id).order_by(Vehicle.created_at.desc())
    )).scalars().all()
    return [to_dict(r) for r in rows]


async def create_vehicle(db, user_id, payload):
    v = Vehicle(
        id=uuid.uuid4(), user_id=uuid.UUID(user_id),
        vehicle_number=payload.vehicle_number.upper().replace(" ", ""),
        vehicle_type=payload.vehicle_type, capacity=payload.capacity,
        status=payload.status or "active", is_demo=False,
    )
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return to_dict(v)


async def get_vehicle(db, user_id, vehicle_id):
    r = (await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.user_id == user_id)
    )).scalar_one_or_none()
    return to_dict(r) if r else None


async def delete_vehicle(db, user_id, vehicle_id):
    r = (await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.user_id == user_id)
    )).scalar_one_or_none()
    if not r:
        return False
    await db.delete(r)
    await db.commit()
    return True


async def update_vehicle(db, user_id, vehicle_id, payload: dict):
    r = (await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.user_id == user_id)
    )).scalar_one_or_none()
    if not r:
        return None
    allowed = {"vehicle_number", "vehicle_type", "capacity", "status"}
    for field, value in payload.items():
        if field in allowed and value is not None:
            if field == "vehicle_number":
                value = str(value).upper().replace(" ", "")
            setattr(r, field, value)
    await db.commit()
    await db.refresh(r)
    return to_dict(r)
