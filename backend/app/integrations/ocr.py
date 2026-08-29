"""OCR / document field extraction behind a provider adapter.

Default provider uses a vision-capable LLM (Gemini) via the Emergent LLM key.
The interface is provider-independent so it can be replaced later.
"""
from __future__ import annotations
import json
import base64
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
    "You are extracting fields from a freight document image (invoice / e-way bill / "
    "transport document). Return ONLY a JSON object of the form: "
    '{"fields": {<field>: {"value": <string or null>, "confidence": <number 0..1>}}}. '
    "Use null for value and 0 for confidence when a field is not present. "
    "Extract these fields exactly: " + ", ".join(FIELDS) + ". "
    "Do not add commentary. Do not wrap in markdown."
)


class OCRProvider(ABC):
    @abstractmethod
    async def extract(self, file_bytes: bytes, mime_type: str, filename: str) -> dict:
        """Return {fields: {name: {value, confidence}}, provider, model}."""
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


class GeminiOCRProvider(OCRProvider):
    provider = "gemini"

    def __init__(self):
        self.model = settings.OCR_MODEL_NAME
        self.api_key = settings.EMERGENT_LLM_KEY

    async def extract(self, file_bytes: bytes, mime_type: str, filename: str) -> dict:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent, FileContentWithMimeType
        import tempfile, os

        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"ocr-{filename}",
            system_message="You are a precise OCR + document field extraction engine. Return strict JSON only.",
        ).with_model("gemini", self.model)

        is_pdf = (mime_type or "").lower() == "application/pdf" or filename.lower().endswith(".pdf")
        if is_pdf:
            tmp_path = os.path.join(tempfile.gettempdir(), f"ocr_{os.getpid()}_{filename}")
            with open(tmp_path, "wb") as fh:
                fh.write(file_bytes)
            content = FileContentWithMimeType(mime_type="application/pdf", file_path=tmp_path)
            msg = UserMessage(text=_PROMPT, file_contents=[content])
        else:
            b64 = base64.b64encode(file_bytes).decode()
            msg = UserMessage(text=_PROMPT, file_contents=[ImageContent(image_base64=b64)])

        resp = await chat.send_message(msg)
        text = resp if isinstance(resp, str) else str(resp)
        data = _clean_json(text)
        fields = data.get("fields", data)

        # normalise to {value, confidence}
        norm = _empty_fields()
        for f in FIELDS:
            v = fields.get(f)
            if isinstance(v, dict):
                norm[f] = {"value": v.get("value"), "confidence": float(v.get("confidence") or 0)}
            elif v is not None:
                norm[f] = {"value": v, "confidence": 0.75}
        return {"fields": norm, "provider": self.provider, "model": self.model}


def get_ocr_provider() -> OCRProvider:
    return GeminiOCRProvider()
