"""Central configuration loaded from environment."""
import os
from pathlib import Path
from functools import lru_cache
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


class Settings:
    # Database (Neon PostgreSQL)
    DATABASE_URL: str = os.environ["DATABASE_URL"]

    # Auth
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "change-me")
    JWT_ALGORITHM: str = os.environ.get("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))

    # LLM / OCR
    EMERGENT_LLM_KEY: str = os.environ.get("EMERGENT_LLM_KEY", "")
    OCR_MODEL_PROVIDER: str = os.environ.get("OCR_MODEL_PROVIDER", "gemini")
    OCR_MODEL_NAME: str = os.environ.get("OCR_MODEL_NAME", "gemini-2.5-flash")

    # Distance provider
    DISTANCE_PROVIDER: str = os.environ.get("DISTANCE_PROVIDER", "demo")
    OSRM_BASE_URL: str = os.environ.get("OSRM_BASE_URL", "https://router.project-osrm.org")

    # Razorpay (backend only)
    RAZORPAY_KEY_ID: str = os.environ.get("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.environ.get("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_WEBHOOK_SECRET: str = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

    CORS_ORIGINS: str = os.environ.get("CORS_ORIGINS", "*")

    ENGINE_VERSION: str = "risk-engine-1.0"

    def async_database_url(self) -> str:
        base = self.DATABASE_URL.split("?", 1)[0]
        return base.replace("postgresql://", "postgresql+asyncpg://")

    def sync_database_url(self) -> str:
        # keep sslmode for psycopg2; drop channel_binding for broad compat
        raw = self.DATABASE_URL
        base = raw.split("?", 1)[0]
        return base.replace("postgresql://", "postgresql+psycopg2://") + "?sslmode=require"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
