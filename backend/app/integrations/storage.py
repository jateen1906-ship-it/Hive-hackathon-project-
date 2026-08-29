"""Storage behind a backend abstraction.

Default implementation stores bytes in Postgres (document_files.data), which is
deployment-safe (survives restarts) and keeps everything in one DB. Swap this
for Supabase Storage / S3 later by implementing StorageBackend.
"""
from __future__ import annotations
import uuid
from abc import ABC, abstractmethod
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, db: AsyncSession, *, user_id: str, trip_id: str | None,
                   document_id: str, filename: str, data: bytes) -> str:
        """Persist bytes, return a logical storage path."""

    @abstractmethod
    async def load(self, db: AsyncSession, document_id: str) -> bytes | None:
        ...


class PostgresStorage(StorageBackend):
    async def save(self, db, *, user_id, trip_id, document_id, filename, data) -> str:
        await db.execute(
            text("INSERT INTO document_files (id, document_id, data) VALUES (:i, :d, :b)"),
            {"i": str(uuid.uuid4()), "d": str(document_id), "b": data},
        )
        return f"pg://document_files/{user_id}/{trip_id or 'none'}/{document_id}/{filename}"

    async def load(self, db, document_id) -> bytes | None:
        row = (await db.execute(
            text("SELECT data FROM document_files WHERE document_id = :d ORDER BY created_at DESC LIMIT 1"),
            {"d": str(document_id)},
        )).first()
        return bytes(row[0]) if row and row[0] is not None else None


def get_storage() -> StorageBackend:
    return PostgresStorage()
