"""Central configuration loaded from environment."""
import os
import logging
from pathlib import Path
from functools import lru_cache
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger("truckshield.config")


class Settings:
    # Database: SQLite local fallback or PostgreSQL
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./truckshield.db")

    # Auth
    DEMO_USER_EMAIL: str = os.environ.get("DEMO_USER_EMAIL", "demo@truckshield.app")
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "")
    JWT_ALGORITHM: str = os.environ.get("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))

    # LLM / OCR
    OCR_MODEL_PROVIDER: str = os.environ.get("OCR_MODEL_PROVIDER", "gemini")
    OCR_MODEL_NAME: str = os.environ.get("OCR_MODEL_NAME", "gemini-2.5-flash")
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")

    # Distance provider
    DISTANCE_PROVIDER: str = os.environ.get("DISTANCE_PROVIDER", "demo")
    OSRM_BASE_URL: str = os.environ.get("OSRM_BASE_URL", "https://router.project-osrm.org")

    # Razorpay (backend only)
    RAZORPAY_KEY_ID: str = os.environ.get("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.environ.get("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_WEBHOOK_SECRET: str = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

    CORS_ORIGINS: str = os.environ.get("CORS_ORIGINS", "*")

    # Email (optional — leave blank to disable email sending)
    SMTP_HOST: str = os.environ.get("SMTP_HOST", "")
    SMTP_PORT: int = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER: str = os.environ.get("SMTP_USER", "")
    SMTP_PASSWORD: str = os.environ.get("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.environ.get("EMAIL_FROM", "noreply@truckshield.app")

    # File upload
    MAX_UPLOAD_MB: int = int(os.environ.get("MAX_UPLOAD_MB", "10"))

    ENGINE_VERSION: str = "risk-engine-1.0"

    def async_database_url(self) -> str:
        if self.DATABASE_URL.startswith("sqlite"):
            return self.DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")
        base = self.DATABASE_URL.split("?", 1)[0]
        return base.replace("postgresql://", "postgresql+asyncpg://")

    def sync_database_url(self) -> str:
        if self.DATABASE_URL.startswith("sqlite"):
            return self.DATABASE_URL
        raw = self.DATABASE_URL
        base = raw.split("?", 1)[0]
        return base.replace("postgresql://", "postgresql+psycopg2://") + "?sslmode=require"

    def validate(self):
        """Log warnings for missing critical configuration."""
        _FALLBACK = "truckshield-secret-jwt-key-2026"
        effective_secret = self.JWT_SECRET or _FALLBACK
        if not self.JWT_SECRET:
            logger.warning(
                "⚠️  JWT_SECRET is not set! Using insecure fallback. "
                "Set JWT_SECRET in your environment variables immediately."
            )
        if self.CORS_ORIGINS == "*":
            logger.warning(
                "⚠️  CORS_ORIGINS is '*' (open). "
                "Set CORS_ORIGINS to your frontend URL in production (e.g. https://your-app.vercel.app)."
            )
        if not self.RAZORPAY_KEY_ID:
            logger.warning("⚠️  RAZORPAY_KEY_ID is not set. Payments will not work.")
        # Patch the effective JWT secret so auth works even when env var is missing
        if not self.JWT_SECRET:
            self.JWT_SECRET = _FALLBACK


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.validate()
    return s


settings = get_settings()
