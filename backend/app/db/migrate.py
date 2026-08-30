"""Idempotent SQL migration runner (raw SQL, deployment-safe)."""
import logging
from pathlib import Path
from sqlalchemy import create_engine, text

from ..config import settings
from ..database import Base

logger = logging.getLogger("truckshield.migrate")
MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def run_migrations() -> None:
    """Apply migrations or create schema."""
    sync_url = settings.sync_database_url()
    if settings.DATABASE_URL.startswith("sqlite"):
        sync_engine = create_engine(sync_url)
        Base.metadata.create_all(bind=sync_engine)
        sync_engine.dispose()
        logger.info("SQLite schema initialized.")
        return

    engine = create_engine(sync_url, pool_pre_ping=True)
    try:
        files = sorted(MIGRATIONS_DIR.glob("*.sql"))
        with engine.begin() as conn:
            for f in files:
                sql = f.read_text()
                conn.execute(text(sql))
                logger.info("Applied migration %s", f.name)
    finally:
        engine.dispose()
