from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...schemas import VehicleIn
from ...security import get_current_user
from ...envelope import ok, NotFound
from ...services import vehicles as svc

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("")
async def list_(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.list_vehicles(db, user["id"]))


@router.post("")
async def create(payload: VehicleIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.create_vehicle(db, user["id"], payload), status_code=201)


@router.get("/{vehicle_id}")
async def get_(vehicle_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    v = await svc.get_vehicle(db, user["id"], vehicle_id)
    if not v:
        raise NotFound("Vehicle not found")
    return ok(v)


@router.put("/{vehicle_id}")
async def update_(vehicle_id: str, payload: dict = Body(default={}),
                  user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    v = await svc.update_vehicle(db, user["id"], vehicle_id, payload or {})
    if not v:
        raise NotFound("Vehicle not found")
    return ok(v)


@router.delete("/{vehicle_id}")
async def delete_(vehicle_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not await svc.delete_vehicle(db, user["id"], vehicle_id):
        raise NotFound("Vehicle not found")
    return ok({"deleted": True})
