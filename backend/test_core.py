"""
TruckShield — Core POC (Phase 1)
Proves the failure-prone core in isolation before building the full app:
  1. Neon PostgreSQL connectivity via SQLAlchemy async (asyncpg, SSL, pooler-safe)
  2. FastAPI-style JWT auth round-trip (bcrypt hash -> login -> JWT decode)
  3. Deterministic Risk Engine scoring across LOW/MED/HIGH/CRITICAL + boundaries
  4. Gemini vision OCR (Emergent LLM key) extracting structured fields + confidence
  5. Storage adapter round-trip (Postgres bytea) with checksum integrity

Run:  cd /app/backend && python test_core.py
"""
import os
import io
import json
import base64
import hashlib
import asyncio
import tempfile
from pathlib import Path
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

RESULTS = {}


def banner(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


# ---------------------------------------------------------------------------
# Helper: build async DB URL from Neon connection string
# ---------------------------------------------------------------------------
def build_async_url_and_args():
    raw = os.environ["DATABASE_URL"]
    # strip query params (sslmode / channel_binding) -> asyncpg rejects them
    base = raw.split("?", 1)[0]
    async_url = base.replace("postgresql://", "postgresql+asyncpg://")
    connect_args = {"ssl": True, "statement_cache_size": 0}
    return async_url, connect_args


# ---------------------------------------------------------------------------
# 1. DATABASE CONNECTIVITY
# ---------------------------------------------------------------------------
async def test_db():
    banner("TEST 1: Neon PostgreSQL connectivity (asyncpg + SSL + pooler-safe)")
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    async_url, connect_args = build_async_url_and_args()
    print(f"  Async URL host: {async_url.split('@')[-1].split('/')[0]}")
    engine = create_async_engine(async_url, connect_args=connect_args, pool_pre_ping=True)
    try:
        async with engine.begin() as conn:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS _poc_check (
                    id SERIAL PRIMARY KEY,
                    name TEXT,
                    created_at TIMESTAMPTZ DEFAULT now()
                )
            """))
            await conn.execute(text("INSERT INTO _poc_check (name) VALUES (:n)"),
                               {"n": "truckshield-poc"})
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT count(*) FROM _poc_check"))
            count = res.scalar()
            ver = (await conn.execute(text("SELECT version()"))).scalar()
        async with engine.begin() as conn:
            await conn.execute(text("DROP TABLE _poc_check"))
        print(f"  Rows inserted/read: {count}")
        print(f"  Server: {ver[:60]}...")
        RESULTS["db"] = True
        print("  ✓ DB connectivity OK")
    except Exception as e:
        RESULTS["db"] = False
        print(f"  ✗ DB FAILED: {type(e).__name__}: {e}")
    finally:
        await engine.dispose()


# ---------------------------------------------------------------------------
# 2. JWT AUTH ROUND-TRIP
# ---------------------------------------------------------------------------
def test_auth():
    banner("TEST 2: JWT auth round-trip (bcrypt + HS256)")
    try:
        from passlib.context import CryptContext
        import jwt as pyjwt

        pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
        secret = os.environ["JWT_SECRET"]
        algo = os.environ.get("JWT_ALGORITHM", "HS256")

        password = "StrongPass!234"
        hashed = pwd.hash(password)
        assert pwd.verify(password, hashed), "password verify failed"
        assert not pwd.verify("wrong", hashed), "wrong password should fail"

        user_id = "11111111-2222-3333-4444-555555555555"
        payload = {
            "sub": user_id,
            "email": "ops@fleet.in",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        }
        token = pyjwt.encode(payload, secret, algorithm=algo)
        decoded = pyjwt.decode(token, secret, algorithms=[algo])
        assert decoded["sub"] == user_id, "sub mismatch"

        # tampered token must fail
        try:
            pyjwt.decode(token + "x", secret, algorithms=[algo])
            raise AssertionError("tampered token should not verify")
        except pyjwt.InvalidTokenError:
            pass

        RESULTS["auth"] = True
        print(f"  Token issued & verified for sub={user_id[:8]}...")
        print("  ✓ Auth round-trip OK")
    except Exception as e:
        RESULTS["auth"] = False
        print(f"  ✗ Auth FAILED: {type(e).__name__}: {e}")


# ---------------------------------------------------------------------------
# 3. RISK ENGINE (deterministic)
# ---------------------------------------------------------------------------
WEIGHTS = {"route": 0.25, "distance": 0.20, "document": 0.25, "historical": 0.20, "trip": 0.10}


def classify(score):
    if score <= 30:
        return "LOW"
    if score <= 60:
        return "MEDIUM"
    if score <= 80:
        return "HIGH"
    return "CRITICAL"


def compute_score(components):
    """components: dict of 0-100 sub-scores. Returns weighted 0-100."""
    total = sum(components[k] * WEIGHTS[k] for k in WEIGHTS)
    return round(total, 1)


def test_risk_engine():
    banner("TEST 3: Deterministic risk engine + boundaries")
    try:
        # All zero -> 0 -> LOW
        assert compute_score({k: 0 for k in WEIGHTS}) == 0.0
        assert classify(0) == "LOW"
        # All 100 -> 100 -> CRITICAL
        assert compute_score({k: 100 for k in WEIGHTS}) == 100.0
        assert classify(100) == "CRITICAL"
        # boundary classifications
        assert classify(30) == "LOW"
        assert classify(31) == "MEDIUM"
        assert classify(60) == "MEDIUM"
        assert classify(61) == "HIGH"
        assert classify(80) == "HIGH"
        assert classify(81) == "CRITICAL"

        # A realistic MEDIUM example (Surat -> Indore)
        comps = {"route": 60, "distance": 70, "document": 55, "historical": 65, "trip": 20}
        s = compute_score(comps)
        lvl = classify(s)
        print(f"  Example components {comps}")
        print(f"  -> score={s}  level={lvl}")
        assert 31 <= s <= 80, "example score out of expected band"

        RESULTS["risk"] = True
        print("  ✓ Risk engine boundaries OK")
    except Exception as e:
        RESULTS["risk"] = False
        print(f"  ✗ Risk engine FAILED: {type(e).__name__}: {e}")


# ---------------------------------------------------------------------------
# 4. GEMINI VISION OCR
# ---------------------------------------------------------------------------
def make_invoice_image(path):
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new("RGB", (900, 640), "white")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    except Exception:
        font = ImageFont.load_default()
    lines = [
        "TAX INVOICE",
        "",
        "Supplier: Gujarat Textiles Pvt Ltd",
        "GSTIN: 24AABCG1234H1Z5",
        "Invoice No: INV-2026-00871",
        "Invoice Date: 28/08/2026",
        "Recipient: Malwa Traders, Indore",
        "Vehicle Number: GJ05AB1234",
        "Origin: Surat",
        "Destination: Indore",
        "Goods: Cotton fabric rolls",
        "Quantity: 240 rolls",
        "Taxable Value: Rs 380000",
        "Invoice Value: Rs 448400",
        "Declared Distance: 380 km",
        "E-Way Bill No: 231007654321",
        "Valid Upto: 31/08/2026",
    ]
    y = 20
    for ln in lines:
        d.text((30, y), ln, fill="black", font=font)
        y += 34
    img.save(path)


async def test_ocr():
    banner("TEST 4: Gemini vision OCR (Emergent LLM key) -> structured JSON")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

        tmp = os.path.join(tempfile.gettempdir(), "poc_invoice.png")
        make_invoice_image(tmp)
        with open(tmp, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()

        schema_hint = (
            "Extract these fields from the document image and return ONLY a JSON object "
            "with this shape: {\"fields\": {<field>: {\"value\": <string|null>, \"confidence\": <0..1>}}}. "
            "Fields: gstin, invoice_number, invoice_date, vehicle_number, supplier, recipient, "
            "origin, destination, goods, quantity, taxable_value, invoice_value, "
            "declared_distance, eway_bill_number, validity. Use null when not found."
        )
        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id="poc-ocr",
            system_message="You are a precise OCR + document field extraction engine. Return strict JSON only.",
        ).with_model("gemini", os.environ.get("OCR_MODEL_NAME", "gemini-2.5-flash"))

        msg = UserMessage(text=schema_hint, file_contents=[ImageContent(image_base64=b64)])
        resp = await chat.send_message(msg)

        # resp may be a string
        text = resp if isinstance(resp, str) else str(resp)
        # strip code fences
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```", 2)[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        cleaned = cleaned.strip().strip("`").strip()
        # find JSON object
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        data = json.loads(cleaned[start:end + 1])
        fields = data.get("fields", data)

        gstin = str(fields.get("gstin", {}).get("value") if isinstance(fields.get("gstin"), dict) else fields.get("gstin"))
        veh = str(fields.get("vehicle_number", {}).get("value") if isinstance(fields.get("vehicle_number"), dict) else fields.get("vehicle_number"))
        print(f"  Extracted GSTIN: {gstin}")
        print(f"  Extracted vehicle_number: {veh}")
        print(f"  Total fields returned: {len(fields)}")

        assert "24AABCG1234H1Z5" in gstin.replace(" ", ""), "GSTIN not extracted correctly"
        assert "GJ05AB1234" in veh.replace(" ", ""), "vehicle number not extracted correctly"
        RESULTS["ocr"] = True
        print("  ✓ OCR extraction OK")
    except Exception as e:
        RESULTS["ocr"] = False
        import traceback
        traceback.print_exc()
        print(f"  ✗ OCR FAILED: {type(e).__name__}: {e}")


# ---------------------------------------------------------------------------
# 5. STORAGE ADAPTER (Postgres bytea)
# ---------------------------------------------------------------------------
async def test_storage():
    banner("TEST 5: Storage adapter round-trip (Postgres bytea integrity)")
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    async_url, connect_args = build_async_url_and_args()
    engine = create_async_engine(async_url, connect_args=connect_args)
    try:
        payload = os.urandom(50_000)  # ~50KB blob
        checksum = hashlib.sha256(payload).hexdigest()
        async with engine.begin() as conn:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS _poc_blob (
                    id SERIAL PRIMARY KEY,
                    data BYTEA,
                    sha256 TEXT
                )
            """))
            await conn.execute(text("INSERT INTO _poc_blob (data, sha256) VALUES (:d, :s)"),
                               {"d": payload, "s": checksum})
        async with engine.connect() as conn:
            row = (await conn.execute(text("SELECT data, sha256 FROM _poc_blob ORDER BY id DESC LIMIT 1"))).first()
        stored = bytes(row[0])
        async with engine.begin() as conn:
            await conn.execute(text("DROP TABLE _poc_blob"))
        assert hashlib.sha256(stored).hexdigest() == row[1] == checksum, "checksum mismatch"
        print(f"  Stored {len(stored)} bytes, checksum verified.")
        RESULTS["storage"] = True
        print("  ✓ Storage round-trip OK")
    except Exception as e:
        RESULTS["storage"] = False
        print(f"  ✗ Storage FAILED: {type(e).__name__}: {e}")
    finally:
        await engine.dispose()


async def main():
    await test_db()
    test_auth()
    test_risk_engine()
    await test_ocr()
    await test_storage()

    banner("POC SUMMARY")
    for k, v in RESULTS.items():
        print(f"  {k:10s}: {'PASS ✓' if v else 'FAIL ✗'}")
    all_pass = all(RESULTS.values())
    print("\n  RESULT:", "ALL CORE CHECKS PASSED ✓" if all_pass else "SOME CHECKS FAILED ✗")
    return all_pass


if __name__ == "__main__":
    ok = asyncio.run(main())
    raise SystemExit(0 if ok else 1)
