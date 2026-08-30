"""API key generation for Pro tier (hashed at rest)."""
import uuid
import hashlib
import secrets
from sqlalchemy import text


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def list_keys(db, user_id):
    rows = (await db.execute(text("""
        SELECT id, key_prefix, label, revoked, created_at FROM api_keys
        WHERE user_id = :u ORDER BY created_at DESC
    """), {"u": user_id})).mappings().all()
    out = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d["id"])
        d["created_at"] = d["created_at"].isoformat() if d["created_at"] else None
        out.append(d)
    return out


async def create_key(db, user_id, label=None):
    raw = "tsk_" + secrets.token_urlsafe(32)
    prefix = raw[:12]
    kid = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO api_keys (id, user_id, key_prefix, key_hash, label)
        VALUES (:i, :u, :p, :h, :l)
    """), {"i": kid, "u": user_id, "p": prefix, "h": _hash(raw), "l": label or "API key"})
    await db.commit()
    return {"id": kid, "api_key": raw, "key_prefix": prefix, "label": label or "API key"}


async def revoke_key(db, user_id, key_id):
    await db.execute(text(
        "UPDATE api_keys SET revoked = true WHERE id = :k AND user_id = :u"),
        {"k": key_id, "u": user_id})
    await db.commit()
