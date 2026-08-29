"""OCR / document field extraction behind a provider adapter.

Default provider uses a vision-capable LLM (Gemini) via the Emergent LLM key.
The interface is provider-independent so it can be replaced later.

Supports multi-page PDFs: each page is extracted independently and the results
are aggregated (highest-confidence non-empty value per field wins), while the
per-page breakdown is preserved.
"""
from __future__ import annotations
import io
import os
import json
import base64
import tempfile
import logging
from abc import ABC, abstractmethod

from ..config import settings

logger = logging.getLogger("truckshield.ocr")

FIELDS = [
    "gstin", "invoice_number", "invoice_date", "vehicle_number", "supplier",
    "recipient", "origin", "destination", "goods", "quantity", "taxable_value",
    "invoice_value", "declared_distance", "eway_bill_number", "validity",
]

_PROMPT = (
    "You are extracting fields from a freight document (invoice / e-way bill / "
    "transport document). Return ONLY a JSON object of the form: "
    '{"fields": {<field>: {"value": <string or null>, "confidence": <number 0..1>}}}. '
    "Use null for value and 0 for confidence when a field is not present. "
    "Extract these fields exactly: " + ", ".join(FIELDS) + ". "
    "Do not add commentary. Do not wrap in markdown."
)


class OCRProvider(ABC):
    @abstractmethod
    async def extract(self, file_bytes: bytes, mime_type: str, filename: str) -> dict:
        """Return {fields, pages, page_count, provider, model}."""
        ...


def _empty_fields() -> dict:
    return {f: {"value": None, "confidence": 0.0} for f in FIELDS}


def _clean_json(text: str) -> dict:
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        cleaned = parts[1] if len(parts) > 1 else cleaned
        if cleaned.lstrip().lower().startswith("json"):
            cleaned = cleaned.lstrip()[4:]
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in model output")
    return json.loads(cleaned[start:end + 1])


def _normalise(fields: dict) -> dict:
    norm = _empty_fields()
    for f in FIELDS:
        v = fields.get(f)
        if isinstance(v, dict):
            norm[f] = {"value": v.get("value"), "confidence": float(v.get("confidence") or 0)}
        elif v is not None:
            norm[f] = {"value": v, "confidence": 0.75}
    return norm


def _aggregate(pages: list[dict]) -> dict:
    """Best (highest-confidence, non-empty) value per field across pages."""
    agg = _empty_fields()
    for page in pages:
        for f in FIELDS:
            cur = agg[f]
            cand = page["fields"].get(f, {})
            cval, cconf = cand.get("value"), float(cand.get("confidence") or 0)
            if cval not in (None, "", "null") and cconf >= float(cur.get("confidence") or 0):
                agg[f] = {"value": cval, "confidence": cconf}
    return agg


def _split_pdf_pages(pdf_bytes: bytes) -> list[bytes]:
    """Return a list of single-page PDF byte blobs."""
    from pypdf import PdfReader, PdfWriter
    reader = PdfReader(io.BytesIO(pdf_bytes))
    out = []
    for i in range(len(reader.pages)):
        writer = PdfWriter()
        writer.add_page(reader.pages[i])
        buf = io.BytesIO()
        writer.write(buf)
        out.append(buf.getvalue())
    return out


class GeminiOCRProvider(OCRProvider):
    provider = "gemini"

    def __init__(self):
        self.model = settings.OCR_MODEL_NAME
        self.api_key = settings.EMERGENT_LLM_KEY

    def _chat(self, session_id: str):
        from emergentintegrations.llm.chat import LlmChat
        return LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message="You are a precise OCR + document field extraction engine. Return strict JSON only.",
        ).with_model("gemini", self.model)

    async def _extract_image(self, image_bytes: bytes, session_id: str) -> dict:
        from emergentintegrations.llm.chat import UserMessage, ImageContent
        b64 = base64.b64encode(image_bytes).decode()
        msg = UserMessage(text=_PROMPT, file_contents=[ImageContent(image_base64=b64)])
        resp = await self._chat(session_id).send_message(msg)
        text = resp if isinstance(resp, str) else str(resp)
        return _normalise(_clean_json(text).get("fields", {}))

    async def _extract_pdf_page(self, page_bytes: bytes, session_id: str) -> dict:
        from emergentintegrations.llm.chat import UserMessage, FileContentWithMimeType
        tmp = os.path.join(tempfile.gettempdir(), f"ocr_{os.getpid()}_{session_id}.pdf")
        with open(tmp, "wb") as fh:
            fh.write(page_bytes)
        try:
            content = FileContentWithMimeType(mime_type="application/pdf", file_path=tmp)
            msg = UserMessage(text=_PROMPT, file_contents=[content])
            resp = await self._chat(session_id).send_message(msg)
            text = resp if isinstance(resp, str) else str(resp)
            return _normalise(_clean_json(text).get("fields", {}))
        finally:
            try:
                os.remove(tmp)
            except OSError:
                pass

    async def extract(self, file_bytes: bytes, mime_type: str, filename: str) -> dict:
        is_pdf = (mime_type or "").lower() == "application/pdf" or filename.lower().endswith(".pdf")
        pages: list[dict] = []

        if is_pdf:
            try:
                page_blobs = _split_pdf_pages(file_bytes)
            except Exception as e:
                logger.warning("PDF split failed (%s); trying whole document", e)
                page_blobs = [file_bytes]
            if not page_blobs:
                page_blobs = [file_bytes]
            for idx, blob in enumerate(page_blobs, start=1):
                try:
                    fields = await self._extract_pdf_page(blob, f"ocr-{filename}-p{idx}")
                except Exception as e:
                    logger.exception("Page %s OCR failed: %s", idx, e)
                    fields = _empty_fields()
                pages.append({"page": idx, "fields": fields})
        else:
            fields = await self._extract_image(file_bytes, f"ocr-{filename}")
            pages.append({"page": 1, "fields": fields})

        aggregated = _aggregate(pages) if len(pages) > 1 else pages[0]["fields"]
        return {
            "fields": aggregated,
            "pages": pages,
            "page_count": len(pages),
            "provider": self.provider,
            "model": self.model,
        }


def get_ocr_provider() -> OCRProvider:
    return GeminiOCRProvider()
