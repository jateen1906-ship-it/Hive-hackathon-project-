import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...models import Profile
from ...schemas import RegisterIn, LoginIn
from ...security import hash_password, verify_password, create_access_token, get_current_user
from ...envelope import ok, AppError
from ...services.serialize import to_dict

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
