from fastapi import APIRouter, Depends

from ...schemas import RouteAnalyzeIn
from ...security import get_current_user
from ...envelope import ok
from ...engines.distance_engine import get_distance_provider, distance_anomaly

router = APIRouter(prefix="/routes", tags=["routes"])


@router.post("/analyze")
async def analyze(payload: RouteAnalyzeIn, user=Depends(get_current_user)):
    dp = get_distance_provider()
    dist = dp.estimate_distance(payload.origin, payload.destination)
    anomaly = distance_anomaly(payload.declared_distance_km, dist.distance_km)
    return ok({
        "origin": payload.origin,
        "destination": payload.destination,
        "estimated_distance_km": dist.distance_km,
        "declared_distance_km": payload.declared_distance_km,
        "source": dist.source,
        "is_demo": dist.is_demo,
        "note": dist.note,
        "anomaly": anomaly,
    })
