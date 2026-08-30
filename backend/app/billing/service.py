"""Billing service: Razorpay subscriptions, entitlements, usage, webhooks."""
import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy import select, func, and_

from .plans import plan_config, PLANS, FREE, GROWTH, PRO, PAID_TIERS
from ..integrations.razorpay_client import get_client, verify_order_signature
from ..envelope import BadRequest, NotFound
from ..models import Subscription, UsageCounter, ShareLink, BillingPlan, Profile
from ..config import settings

logger = logging.getLogger("truckshield.billing")


def current_period() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _ts(epoch):
    if not epoch:
        return None
    try:
        return datetime.fromtimestamp(int(epoch), tz=timezone.utc)
    except Exception:
        return None


async def is_demo_user(db, user_id) -> bool:
    """Check if the user is the demo account (demo@truckshield.app)."""
    prof = (await db.execute(
        select(Profile).where(Profile.id == user_id)
    )).scalar_one_or_none()
    if prof and prof.email and prof.email.lower() == settings.DEMO_USER_EMAIL.lower():
        return True
    return False


# ---------------- Plans bootstrap ----------------
async def ensure_plans(db):
    """Store tier amounts locally (Orders flow — no Razorpay Plan objects needed)."""
    for tier in PAID_TIERS:
        row = (await db.execute(
            select(BillingPlan).where(BillingPlan.tier == tier)
        )).scalar_one_or_none()
        if not row:
            db.add(BillingPlan(
                id=uuid.uuid4(),
                tier=tier,
                amount=PLANS[tier]["price"],
            ))
    await db.commit()


# ---------------- Subscription state ----------------
async def get_subscription(db, user_id) -> dict:
    # Demo account is always granted active PRO tier with all features unlocked
    if await is_demo_user(db, user_id):
        return {
            "plan": PRO,
            "status": "active",
            "razorpay_subscription_id": "demo_sub_pro",
            "razorpay_plan_id": "demo_plan_pro",
            "current_period_end": None,
        }

    sub = (await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )).scalar_one_or_none()
    
    if not sub:
        return {
            "plan": FREE,
            "status": "active",
            "razorpay_subscription_id": None,
            "razorpay_plan_id": None,
            "current_period_end": None,
        }
    return {
        "plan": sub.plan,
        "status": sub.status,
        "razorpay_subscription_id": sub.razorpay_subscription_id,
        "razorpay_plan_id": sub.razorpay_plan_id,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
    }


async def _upsert_subscription(db, user_id, **fields):
    sub = (await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )).scalar_one_or_none()
    
    now = datetime.now(timezone.utc)
    if sub:
        for k, v in fields.items():
            setattr(sub, k, v)
        sub.updated_at = now
    else:
        sub = Subscription(
            id=uuid.uuid4(),
            user_id=uuid.UUID(str(user_id)),
            plan=fields.get("plan", FREE),
            status=fields.get("status", "active"),
            razorpay_subscription_id=fields.get("razorpay_subscription_id"),
            razorpay_plan_id=fields.get("razorpay_plan_id"),
            current_period_end=fields.get("current_period_end"),
            updated_at=now,
        )
        db.add(sub)
    await db.commit()


# ---------------- Usage ----------------
async def get_usage(db, user_id) -> int:
    p = current_period()
    uc = (await db.execute(
        select(UsageCounter).where(
            and_(UsageCounter.user_id == user_id, UsageCounter.period == p)
        )
    )).scalar_one_or_none()
    return uc.checks if uc else 0


async def increment_usage(db, user_id):
    p = current_period()
    uc = (await db.execute(
        select(UsageCounter).where(
            and_(UsageCounter.user_id == user_id, UsageCounter.period == p)
        )
    )).scalar_one_or_none()
    
    now = datetime.now(timezone.utc)
    if uc:
        uc.checks += 1
        uc.updated_at = now
    else:
        uc = UsageCounter(
            id=uuid.uuid4(),
            user_id=uuid.UUID(str(user_id)),
            period=p,
            checks=1,
            updated_at=now,
        )
        db.add(uc)
    await db.commit()


async def active_share_link_count(db, user_id) -> int:
    now = datetime.now(timezone.utc)
    stmt = select(func.count(ShareLink.id)).where(
        and_(
            ShareLink.user_id == user_id,
            ShareLink.revoked == False,
            (ShareLink.expires_at == None) | (ShareLink.expires_at > now),
        )
    )
    row = (await db.execute(stmt)).scalar()
    return int(row or 0)


async def entitlements(db, user_id) -> dict:
    sub = await get_subscription(db, user_id)
    effective_plan = sub["plan"] if (sub["plan"] == FREE or sub["status"] == "active") else FREE
    cfg = plan_config(effective_plan)
    used = await get_usage(db, user_id)
    limit = cfg["checks_per_month"]
    remaining = None if limit is None else max(0, limit - used)
    shares = await active_share_link_count(db, user_id)
    return {
        "plan": effective_plan,
        "billing_plan": sub["plan"],
        "status": sub["status"],
        "current_period_end": sub["current_period_end"],
        "config": cfg,
        "usage": {
            "checks_used": used,
            "checks_limit": limit,
            "checks_remaining": remaining,
            "active_share_links": shares,
            "share_link_limit": cfg["share_links"],
        },
    }


def can_run_check(ent: dict) -> bool:
    limit = ent["config"]["checks_per_month"]
    if limit is None:
        return True
    return ent["usage"]["checks_used"] < limit


# ---------------- Checkout flow ----------------
async def create_subscription(db, user_id, tier):
    """Create a Razorpay ORDER for the tier amount (Subscriptions not enabled on account)."""
    if tier not in PAID_TIERS:
        raise BadRequest("Free plan does not require checkout", code="FREE_TIER")
    cfg = PLANS[tier]
    client = get_client()
    order = client.order.create({
        "amount": cfg["price"], "currency": "INR",
        "receipt": f"ts_{tier}_{str(user_id)[:8]}",
        "notes": {"user_id": str(user_id), "tier": tier},
    })
    await _upsert_subscription(db, user_id, plan=tier, status="created",
                               razorpay_subscription_id=order["id"])
    return {"order_id": order["id"], "key_id": settings.RAZORPAY_KEY_ID,
            "amount": cfg["price"], "currency": "INR",
            "tier": tier, "plan_name": cfg["name"]}


async def verify_and_activate(db, user_id, payment_id, order_id, signature):
    if not verify_order_signature(order_id, payment_id, signature):
        raise BadRequest("Payment signature verification failed", code="SIGNATURE_INVALID")
    sub = (await db.execute(
        select(Subscription).where(
            and_(Subscription.user_id == user_id, Subscription.razorpay_subscription_id == order_id)
        )
    )).scalar_one_or_none()
    tier = sub.plan if sub else GROWTH
    from datetime import timedelta
    period_end = datetime.now(timezone.utc) + timedelta(days=30)
    await _upsert_subscription(db, user_id, plan=tier, status="active",
                               razorpay_subscription_id=order_id,
                               current_period_end=period_end)
    return await get_subscription(db, user_id)


async def cancel_subscription(db, user_id):
    sub = await get_subscription(db, user_id)
    if sub["plan"] == FREE:
        raise BadRequest("You are on the Free plan", code="ALREADY_FREE")
    await _upsert_subscription(db, user_id, plan=FREE, status="cancelled",
                               razorpay_subscription_id=None, current_period_end=None)
    return await get_subscription(db, user_id)


# ---------------- Webhooks ----------------
async def _user_for_ref(db, ref):
    sub = (await db.execute(
        select(Subscription).where(Subscription.razorpay_subscription_id == ref)
    )).scalar_one_or_none()
    return (str(sub.user_id), sub.plan) if sub else (None, None)


async def handle_webhook(db, event: str, payload: dict):
    entity = payload.get("payload", {})
    pay = (entity.get("payment", {}) or {}).get("entity", {})
    order_id = pay.get("order_id")
    from datetime import timedelta

    if event in ("payment.captured", "order.paid"):
        if order_id:
            user_id, tier = await _user_for_ref(db, order_id)
            if user_id:
                await _upsert_subscription(
                    db, user_id, plan=tier or GROWTH, status="active",
                    current_period_end=datetime.now(timezone.utc) + timedelta(days=30))
    elif event == "payment.failed":
        if order_id:
            user_id, _ = await _user_for_ref(db, order_id)
            if user_id:
                await _upsert_subscription(db, user_id, status="past_due")
    return {"handled": event}
