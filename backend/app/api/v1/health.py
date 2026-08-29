from fastapi import APIRouter
from ...envelope import ok

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return ok({"status": "ok", "service": "truckshield", "engine": "risk-engine-1.0"})
