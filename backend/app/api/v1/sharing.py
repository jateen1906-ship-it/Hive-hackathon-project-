"""Report sharing: secure no-login read-only links + public report view."""
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ...database import get_db
from ...security import get_current_user
from ...envelope import ok, BadRequest, NotFound
from ...billing import service as billing
from ...services import trips as tripsvc

router = APIRouter(tags=["sharing"])


@router.get("/trips/{trip_id}/shares")
async def list_shares(trip_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(text("""
        SELECT id, token, expires_at, revoked, created_at FROM share_links
        WHERE user_id = :u AND trip_id = :t ORDER BY created_at DESC
    """), {"u": user["id"], "t": trip_id})).mappings().all()
    out = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d["id"])
        active = (not r["revoked"]) and (r["expires_at"] is None or r["expires_at"] > datetime.now(timezone.utc))
        d["expires_at"] = r["expires_at"].isoformat() if r["expires_at"] else None
        d["created_at"] = r["created_at"].isoformat() if r["created_at"] else None
        d["active"] = active
        out.append(d)
    return ok(out)


@router.post("/trips/{trip_id}/share")
async def create_share(trip_id: str, payload: dict = Body(default={}),
                       user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    owned = (await db.execute(text("SELECT 1 FROM trips WHERE id = :t AND user_id = :u"),
                              {"t": trip_id, "u": user["id"]})).first()
    if not owned:
        raise NotFound("Trip not found")

    ent = await billing.entitlements(db, user["id"])
    cap = ent["config"]["share_links"]
    if cap == 0:
        raise BadRequest("Report sharing is available on paid plans", code="UPGRADE_REQUIRED")
    if cap is not None:
        active = await billing.active_share_link_count(db, user["id"])
        if active >= cap:
            raise BadRequest(f"You've reached your active share-link limit ({cap}). Revoke one or upgrade.",
                             code="SHARE_LIMIT_REACHED")

    days = (payload or {}).get("expiry_days")
    expires_at = None
    if days:
        if not ent["config"]["custom_expiry"]:
            days = 7
        expires_at = datetime.now(timezone.utc) + timedelta(days=int(days))
    elif not ent["config"]["custom_expiry"]:
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    token = secrets.token_urlsafe(24)
    await db.execute(text("""
        INSERT INTO share_links (id, user_id, trip_id, token, expires_at)
        VALUES (:i, :u, :t, :tok, :e)
    """), {"i": str(uuid.uuid4()), "u": user["id"], "t": trip_id, "tok": token, "e": expires_at})
    await db.commit()
    return ok({"token": token, "expires_at": expires_at.isoformat() if expires_at else None}, status_code=201)


@router.delete("/shares/{share_id}")
async def revoke_share(share_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(text("UPDATE share_links SET revoked = true WHERE id = :s AND user_id = :u"),
                     {"s": share_id, "u": user["id"]})
    await db.commit()
    return ok({"revoked": True})


@router.get("/public/report/{token}")
async def public_report(token: str, db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("""
        SELECT user_id, trip_id, expires_at, revoked FROM share_links WHERE token = :tok
    """), {"tok": token})).mappings().first()
    if not row or row["revoked"]:
        raise NotFound("This shared report is no longer available", code="SHARE_NOT_FOUND")
    if row["expires_at"] and row["expires_at"] <= datetime.now(timezone.utc):
        raise NotFound("This shared report link has expired", code="SHARE_EXPIRED")
    data = await tripsvc.latest_risk(db, str(row["user_id"]), str(row["trip_id"]))
    if not data:
        raise NotFound("Report not found")
    return ok({"trip": data["trip"], "evaluation": data["evaluation"], "shared": True})
