"""Document service: upload, OCR extract, validate, download."""
import uuid
from sqlalchemy import select, text
from ..models import Document
from ..integrations.ocr import get_ocr_provider
from ..integrations.storage import get_storage
from ..engines.compliance_engine import validate_document
from .serialize import to_dict
from ..envelope import NotFound, BadRequest

MAX_BYTES = 10 * 1024 * 1024
ALLOWED = {"image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"}


async def upload_document(db, user_id, *, trip_id, document_type, filename, mime_type, data, run_ocr=True):
    if len(data) > MAX_BYTES:
        raise BadRequest("File too large (max 10 MB)", code="FILE_TOO_LARGE")
    if mime_type and mime_type not in ALLOWED:
        raise BadRequest(f"Unsupported file type: {mime_type}", code="UNSUPPORTED_TYPE")

    # verify trip ownership if provided
    if trip_id:
        owned = (await db.execute(text(
            "SELECT 1 FROM trips WHERE id = :t AND user_id = :u"),
            {"t": str(trip_id), "u": user_id})).first()
        if not owned:
            raise NotFound("Trip not found")

    doc_id = uuid.uuid4()
    extracted = None
    validation = None
    status = "uploaded"
    if run_ocr:
        try:
            provider = get_ocr_provider()
            extracted = await provider.extract(data, mime_type or "", filename)
            trip = None
            if trip_id:
                row = (await db.execute(text(
                    "SELECT origin, destination, vehicle_number, declared_distance_km FROM trips WHERE id = :t"),
                    {"t": str(trip_id)})).first()
                if row:
                    trip = {"origin": row[0], "destination": row[1],
                            "vehicle_number": row[2], "declared_distance_km": row[3]}
            validation = validate_document(extracted, trip)
            status = "processed"
        except Exception as e:
            status = "ocr_failed"
            extracted = {"error": str(e)}

    doc = Document(
        id=doc_id, user_id=uuid.UUID(user_id),
        trip_id=uuid.UUID(str(trip_id)) if trip_id else None,
        document_type=document_type or "other", file_name=filename,
        mime_type=mime_type, status=status, extracted_data=extracted,
        validation_result=validation,
    )
    db.add(doc)
    await db.flush()

    storage = get_storage()
    path = await storage.save(db, user_id=user_id, trip_id=str(trip_id) if trip_id else None,
                              document_id=str(doc_id), filename=filename, data=data)
    doc.storage_path = path
    await db.commit()
    await db.refresh(doc)
    return to_dict(doc)


async def list_documents(db, user_id):
    rows = (await db.execute(
        select(Document).where(Document.user_id == user_id).order_by(Document.created_at.desc())
    )).scalars().all()
    return [to_dict(r) for r in rows]


async def _get_doc_row(db, user_id, doc_id):
    return (await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == user_id)
    )).scalar_one_or_none()


async def get_document(db, user_id, doc_id):
    r = await _get_doc_row(db, user_id, doc_id)
    return to_dict(r) if r else None


async def revalidate(db, user_id, doc_id):
    r = await _get_doc_row(db, user_id, doc_id)
    if not r:
        return None
    if not r.extracted_data or r.extracted_data.get("error"):
        raise BadRequest("No extracted data available to validate", code="NO_EXTRACTION")
    trip = None
    if r.trip_id:
        row = (await db.execute(text(
            "SELECT origin, destination, vehicle_number, declared_distance_km FROM trips WHERE id = :t"),
            {"t": str(r.trip_id)})).first()
        if row:
            trip = {"origin": row[0], "destination": row[1],
                    "vehicle_number": row[2], "declared_distance_km": row[3]}
    validation = validate_document(r.extracted_data, trip)
    r.validation_result = validation
    r.status = "processed"
    await db.commit()
    await db.refresh(r)
    return to_dict(r)


async def load_bytes(db, user_id, doc_id):
    r = await _get_doc_row(db, user_id, doc_id)
    if not r:
        return None, None
    storage = get_storage()
    data = await storage.load(db, str(doc_id))
    return data, r.mime_type


async def correct_fields(db, user_id, doc_id, corrections: dict):
    """Apply user corrections to extracted fields and re-run the pre-check."""
    r = await _get_doc_row(db, user_id, doc_id)
    if not r:
        return None
    extracted = dict(r.extracted_data or {})
    fields = dict(extracted.get("fields") or {})
    for k, v in (corrections or {}).items():
        val = (v or "").strip() if isinstance(v, str) else v
        fields[k] = {"value": val or None, "confidence": 1.0, "corrected": True}
    extracted["fields"] = fields

    trip = None
    if r.trip_id:
        row = (await db.execute(text(
            "SELECT origin, destination, vehicle_number, declared_distance_km FROM trips WHERE id = :t"),
            {"t": str(r.trip_id)})).first()
        if row:
            trip = {"origin": row[0], "destination": row[1],
                    "vehicle_number": row[2], "declared_distance_km": row[3]}
    validation = validate_document(extracted, trip)
    r.extracted_data = extracted
    r.validation_result = validation
    r.status = "processed"
    await db.commit()
    await db.refresh(r)
    return to_dict(r)
