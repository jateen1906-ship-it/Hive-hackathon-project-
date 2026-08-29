from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...schemas import IncidentIn
from ...security import get_current_user
from ...envelope import ok, NotFound
from ...services import incidents as svc

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("")
async def list_(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.list_incidents(db, user["id"]))


@router.post("")
async def create(payload: IncidentIn, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.create_incident(db, user["id"], payload), status_code=201)


@router.get("/{incident_id}")
async def get_(incident_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    i = await svc.get_incident(db, user["id"], incident_id)
    if not i:
        raise NotFound("Incident not found")
    return ok(i)
