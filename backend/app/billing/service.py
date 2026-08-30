"""Billing service: Razorpay subscriptions, entitlements, usage, webhooks."""
import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy import text

from .plans import plan_config, PLANS, FREE, GROWTH, PRO, PAID_TIERS
from ..integrations.razorpay_client import get_client, verify_order_signature
from ..envelope import BadRequest, NotFound

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


# ---------------- Plans bootstrap ----------------
async def ensure_plans(db):
    """Store tier amounts locally (Orders flow — no Razorpay Plan objects needed)."""
    for tier in PAID_TIERS:
        row = (await db.execute(text(
            "SELECT 1 FROM billing_plans WHERE tier = :t"), {"t": tier})).first()
        if not row:
            await db.execute(text(
                "INSERT INTO billing_plans (id, tier, amount) VALUES (:i,:t,:a)"),
                {"i": str(uuid.uuid4()), "t": tier, "a": PLANS[tier]["price"]})
    await db.commit()


# ---------------- Subscription state ----------------
async def get_subscription(db, user_id) -> dict:
    row = (await db.execute(text("""
        SELECT plan, status, razorpay_subscription_id, razorpay_plan_id, current_period_end
        FROM subscriptions WHERE user_id = :u
    """), {"u": user_id})).mappings().first()
    if not row:
        return {"plan": FREE, "status": "active", "razorpay_subscription_id": None,
                "razorpay_plan_id": None, "current_period_end": None}
    d = dict(row)
    if d.get("current_period_end"):
        d["current_period_end"] = d["current_period_end"].isoformat()
    return d


async def _upsert_subscription(db, user_id, **fields):
    exists = (await db.execute(text(
        "SELECT 1 FROM subscriptions WHERE user_id = :u"), {"u": user_id})).first()
    fields["updated_at"] = datetime.now(timezone.utc)
    if exists:
        sets = ", ".join(f"{k} = :{k}" for k in fields)
        await db.execute(text(f"UPDATE subscriptions SET {sets} WHERE user_id = :u"),
                         {**fields, "u": user_id})
    else:
        cols = ["id", "user_id"] + list(fields.keys())
        vals = {"id": str(uuid.uuid4()), "user_id": user_id, **fields}
        placeholders = ", ".join(f":{c}" for c in cols)
        await db.execute(text(
            f"INSERT INTO subscriptions ({', '.join(cols)}) VALUES ({placeholders})"), vals)
    await db.commit()


# ---------------- Usage ----------------
async def get_usage(db, user_id) -> int:
    row = (await db.execute(text(
        "SELECT checks FROM usage_counters WHERE user_id = :u AND period = :p"),
        {"u": user_id, "p": current_period()})).first()
    return int(row[0]) if row else 0


async def increment_usage(db, user_id):
    await db.execute(text("""
        INSERT INTO usage_counters (id, user_id, period, checks)
        VALUES (:i, :u, :p, 1)
        ON CONFLICT (user_id, period)
        DO UPDATE SET checks = usage_counters.checks + 1, updated_at = now()
    """), {"i": str(uuid.uuid4()), "u": user_id, "p": current_period()})
    await db.commit()


async def active_share_link_count(db, user_id) -> int:
    row = (await db.execute(text("""
        SELECT count(*) FROM share_links
        WHERE user_id = :u AND revoked = false
          AND (expires_at IS NULL OR expires_at > now())
    """), {"u": user_id})).scalar()
    return int(row or 0)


async def entitlements(db, user_id) -> dict:
    sub = await get_subscription(db, user_id)
    # Only an ACTIVE paid subscription unlocks paid features. A 'created'
    # (started-but-unpaid) or 'cancelled'/'past_due' state falls back to Free.
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
    from ..config import settings
    return {"order_id": order["id"], "key_id": settings.RAZORPAY_KEY_ID,
            "amount": cfg["price"], "currency": "INR",
            "tier": tier, "plan_name": cfg["name"]}


async def verify_and_activate(db, user_id, payment_id, order_id, signature):
    if not verify_order_signature(order_id, payment_id, signature):
        raise BadRequest("Payment signature verification failed", code="SIGNATURE_INVALID")
    sub = (await db.execute(text(
        "SELECT plan FROM subscriptions WHERE user_id = :u AND razorpay_subscription_id = :s"),
        {"u": user_id, "s": order_id})).first()
    tier = sub[0] if sub else GROWTH
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
    row = (await db.execute(text(
        "SELECT user_id, plan FROM subscriptions WHERE razorpay_subscription_id = :s"),
        {"s": ref})).first()
    return (str(row[0]), row[1]) if row else (None, None)


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
