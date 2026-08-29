"""Idempotent SQL migration runner (raw SQL, deployment-safe)."""
import logging
from pathlib import Path
from sqlalchemy import create_engine, text

from ..config import settings

logger = logging.getLogger("truckshield.migrate")
MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def run_migrations() -> None:
    """Apply all *.sql migration files in order (idempotent)."""
    engine = create_engine(settings.sync_database_url(), pool_pre_ping=True)
    try:
        files = sorted(MIGRATIONS_DIR.glob("*.sql"))
        with engine.begin() as conn:
            for f in files:
                sql = f.read_text()
                conn.execute(text(sql))
                logger.info("Applied migration %s", f.name)
    finally:
        engine.dispose()
