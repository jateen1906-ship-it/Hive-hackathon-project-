from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...security import get_current_user
from ...envelope import ok, BadRequest
from ...services import analytics as svc
from ...billing import service as billing

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def dashboard(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.dashboard(db, user["id"]))


@router.get("/corridors")
async def corridors(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.corridors(db, user["id"]))


@router.get("/corridors/detail")
async def corridor_detail(origin: str = Query(...), destination: str = Query(...),
                          user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ent = await billing.entitlements(db, user["id"])
    if not ent["config"]["corridor_drilldown"]:
        raise BadRequest("Corridor drill-down is available on the Pro plan", code="UPGRADE_REQUIRED")
    return ok(await svc.corridor_detail(db, user["id"], origin, destination))
