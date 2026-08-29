"""Password hashing + JWT + current-user dependency."""
import bcrypt
import jwt as pyjwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import settings
from .envelope import Unauthorized

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return pyjwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except pyjwt.ExpiredSignatureError:
        raise Unauthorized("Session expired, please log in again", code="TOKEN_EXPIRED")
    except pyjwt.InvalidTokenError:
        raise Unauthorized("Invalid authentication token", code="INVALID_TOKEN")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    if credentials is None or (credentials.scheme or "").lower() != "bearer":
        raise Unauthorized("Missing authentication token")
    claims = decode_token(credentials.credentials)
    if not claims.get("sub"):
        raise Unauthorized("Invalid token payload")
    return {"id": claims["sub"], "email": claims.get("email")}
