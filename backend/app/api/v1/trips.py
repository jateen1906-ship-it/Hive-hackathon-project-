from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...schemas import TripIn, TripUpdate
from ...security import get_current_user
from ...envelope import ok, NotFound
from ...services import trips as svc

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("")
async def list_(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.list_trips(db, user["id"]))


@router.post("")
async def create(payload: TripIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.create_trip(db, user["id"], payload), status_code=201)


@router.get("/{trip_id}")
async def get_(trip_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = await svc.get_trip(db, user["id"], trip_id)
    if not t:
        raise NotFound("Trip not found")
    return ok(t)


@router.put("/{trip_id}")
async def update_(trip_id: str, payload: TripUpdate, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = await svc.update_trip(db, user["id"], trip_id, payload)
    if not t:
        raise NotFound("Trip not found")
    return ok(t)


@router.delete("/{trip_id}")
async def delete_(trip_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not await svc.delete_trip(db, user["id"], trip_id):
        raise NotFound("Trip not found")
    return ok({"deleted": True})


@router.post("/{trip_id}/analyze")
async def analyze_(trip_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.analyze_trip(db, user["id"], trip_id))


@router.get("/{trip_id}/risk")
async def risk_(trip_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    r = await svc.latest_risk(db, user["id"], trip_id)
    if not r:
        raise NotFound("Trip not found")
    return ok(r)
