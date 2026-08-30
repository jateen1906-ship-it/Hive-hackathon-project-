import json
import logging
from fastapi import APIRouter, Depends, Request, Body
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...security import get_current_user
from ...envelope import ok, err, BadRequest
from ...billing import service as billing
from ...billing.plans import public_plans, PAID_TIERS
from ...integrations.razorpay_client import verify_webhook_signature

logger = logging.getLogger("truckshield.billing.api")
router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans")
async def plans():
    return ok({"plans": public_plans()})


@router.get("/me")
async def me(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await billing.entitlements(db, user["id"]))


@router.post("/subscribe")
async def subscribe(payload: dict = Body(...), user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tier = (payload or {}).get("tier")
    if tier not in PAID_TIERS:
        raise BadRequest("Choose a valid paid tier (growth or pro)", code="INVALID_TIER")
    return ok(await billing.create_subscription(db, user["id"], tier))


@router.post("/verify")
async def verify(payload: dict = Body(...), user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = payload or {}
    pid = p.get("razorpay_payment_id")
    oid = p.get("razorpay_order_id")
    sig = p.get("razorpay_signature")
    if not (pid and oid and sig):
        raise BadRequest("Missing payment verification fields", code="MISSING_FIELDS")
    sub = await billing.verify_and_activate(db, user["id"], pid, oid, sig)
    return ok(sub)


@router.post("/cancel")
async def cancel(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await billing.cancel_subscription(db, user["id"]))


@router.post("/webhook")
async def webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    if not verify_webhook_signature(body, signature):
        return err("WEBHOOK_SIGNATURE_INVALID", "Invalid webhook signature", 400)
    try:
        data = json.loads(body.decode())
    except Exception:
        return err("BAD_PAYLOAD", "Invalid JSON", 400)
    event = data.get("event", "")
    try:
        result = await billing.handle_webhook(db, event, data)
    except Exception as e:
        logger.exception("Webhook handling error: %s", e)
        result = {"handled": False}
    return ok(result)


# ---------------- API keys (Pro only) ----------------
@router.get("/api-keys")
async def list_keys(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from ...services import keys as keysvc
    return ok(await keysvc.list_keys(db, user["id"]))


@router.post("/api-keys")
async def create_key(payload: dict = Body(default={}), user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ent = await billing.entitlements(db, user["id"])
    if not ent["config"]["api_access"]:
        raise BadRequest("API access is available on the Pro plan", code="UPGRADE_REQUIRED")
    from ...services import keys as keysvc
    return ok(await keysvc.create_key(db, user["id"], (payload or {}).get("label")), status_code=201)


@router.delete("/api-keys/{key_id}")
async def revoke_key(key_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from ...services import keys as keysvc
    await keysvc.revoke_key(db, user["id"], key_id)
    return ok({"revoked": True})
