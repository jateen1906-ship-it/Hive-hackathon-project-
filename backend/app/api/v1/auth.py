import uuid
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Body
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...models import Profile, PasswordResetToken
from ...schemas import RegisterIn, LoginIn
from ...security import hash_password, verify_password, create_access_token, get_current_user
from ...envelope import ok, AppError, BadRequest, NotFound
from ...services.serialize import to_dict
from ...integrations.email import send_welcome_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _public(profile: Profile) -> dict:
    d = to_dict(profile)
    d.pop("password_hash", None)
    return d


@router.post("/register")
async def register(payload: RegisterIn, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower().strip()
    existing = (await db.execute(select(Profile).where(Profile.email == email))).scalar_one_or_none()
    if existing:
        raise AppError("EMAIL_EXISTS", "An account with this email already exists", 409)
    profile = Profile(
        id=uuid.uuid4(), email=email, password_hash=hash_password(payload.password),
        full_name=payload.full_name, company_name=payload.company_name, phone=payload.phone,
        role="operator",
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    token = create_access_token(str(profile.id), profile.email)
    # Send welcome email (non-blocking, graceful failure)
    send_welcome_email(email, payload.full_name or "")
    return ok({"token": token, "user": _public(profile)}, status_code=201)


@router.post("/login")
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower().strip()
    profile = (await db.execute(select(Profile).where(Profile.email == email))).scalar_one_or_none()
    if not profile or not verify_password(payload.password, profile.password_hash):
        raise AppError("INVALID_CREDENTIALS", "Invalid email or password", 401)
    token = create_access_token(str(profile.id), profile.email)
    return ok({"token": token, "user": _public(profile)})


@router.get("/me")
async def me(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    profile = (await db.execute(select(Profile).where(Profile.id == user["id"]))).scalar_one_or_none()
    if not profile:
        raise AppError("NOT_FOUND", "User not found", 404)
    return ok(_public(profile))


@router.put("/me")
async def update_me(payload: dict = Body(...), user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Update profile fields: full_name, company_name, phone."""
    profile = (await db.execute(select(Profile).where(Profile.id == user["id"]))).scalar_one_or_none()
    if not profile:
        raise NotFound("User not found")
    allowed = {"full_name", "company_name", "phone"}
    for field, value in (payload or {}).items():
        if field in allowed:
            setattr(profile, field, str(value).strip() if value else None)
    profile.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(profile)
    return ok(_public(profile))


@router.post("/forgot-password")
async def forgot_password(payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """Request a password reset token. Always returns 200 to prevent email enumeration."""
    email = (payload or {}).get("email", "").lower().strip()
    profile = (await db.execute(select(Profile).where(Profile.email == email))).scalar_one_or_none()
    if profile:
        # Invalidate any existing unused tokens
        existing_tokens = (await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == profile.id,
                PasswordResetToken.used == False,
            )
        )).scalars().all()
        for t in existing_tokens:
            t.used = True

        # Create new reset token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        reset_token = PasswordResetToken(
            id=uuid.uuid4(),
            user_id=profile.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            used=False,
        )
        db.add(reset_token)
        await db.commit()
        # Send email (silent fail if SMTP not configured — token logged for dev)
        sent = send_password_reset_email(email, raw_token)
        if not sent:
            import logging
            logging.getLogger("truckshield.auth").info(
                "Password reset token (SMTP not configured): %s", raw_token
            )
    return ok({"message": "If this email exists, a reset link has been sent."})


@router.post("/reset-password")
async def reset_password(payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """Reset password using a valid token."""
    raw_token = (payload or {}).get("token", "").strip()
    new_password = (payload or {}).get("new_password", "").strip()
    if not raw_token or not new_password:
        raise BadRequest("Token and new_password are required", code="MISSING_FIELDS")
    if len(new_password) < 6:
        raise BadRequest("Password must be at least 6 characters", code="PASSWORD_TOO_SHORT")

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    reset_token = (await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,
        )
    )).scalar_one_or_none()

    if not reset_token:
        raise BadRequest("Invalid or already-used reset token", code="INVALID_TOKEN")
    if reset_token.expires_at < datetime.now(timezone.utc):
        raise BadRequest("Reset token has expired. Please request a new one.", code="TOKEN_EXPIRED")

    # Update password
    profile = (await db.execute(
        select(Profile).where(Profile.id == reset_token.user_id)
    )).scalar_one_or_none()
    if not profile:
        raise NotFound("User not found")

    profile.password_hash = hash_password(new_password)
    profile.updated_at = datetime.now(timezone.utc)
    reset_token.used = True
    await db.commit()
    return ok({"message": "Password reset successfully. You can now log in."})
