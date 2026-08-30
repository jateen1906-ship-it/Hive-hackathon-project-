from fastapi import APIRouter, Depends, UploadFile, File, Form, Body
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ...database import get_db
from ...security import get_current_user
from ...envelope import ok, NotFound
from ...services import documents as svc

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("")
async def list_(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok(await svc.list_documents(db, user["id"]))


@router.post("")
async def upload(
    file: UploadFile = File(...),
    document_type: str = Form("other"),
    trip_id: Optional[str] = Form(None),
    run_ocr: bool = Form(True),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await file.read()
    doc = await svc.upload_document(
        db, user["id"], trip_id=trip_id or None, document_type=document_type,
        filename=file.filename, mime_type=file.content_type, data=data, run_ocr=run_ocr,
    )
    return ok(doc, status_code=201)


@router.get("/{document_id}")
async def get_(document_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    d = await svc.get_document(db, user["id"], document_id)
    if not d:
        raise NotFound("Document not found")
    return ok(d)


@router.post("/{document_id}/validate")
async def validate_(document_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    d = await svc.revalidate(db, user["id"], document_id)
    if not d:
        raise NotFound("Document not found")
    return ok(d)


@router.get("/{document_id}/download")
async def download_(document_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data, mime = await svc.load_bytes(db, user["id"], document_id)
    if data is None:
        raise NotFound("Document file not found")
    return Response(content=data, media_type=mime or "application/octet-stream")


@router.put("/{document_id}/fields")
async def correct_fields_(document_id: str, payload: dict = Body(...),
                          user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    corrections = (payload or {}).get("fields") or {}
    if not corrections:
        raise NotFound("No field corrections supplied", code="NO_CORRECTIONS")
    d = await svc.correct_fields(db, user["id"], document_id, corrections)
    if not d:
        raise NotFound("Document not found")
    return ok(d)
