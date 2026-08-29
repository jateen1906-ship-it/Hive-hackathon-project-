"""Document compliance pre-check tests (pure, no DB)."""
from app.engines.compliance_engine import validate_document


def _fields(**kw):
    base = {
        "gstin": "24AABCG1234H1Z5", "invoice_number": "INV-1", "invoice_date": "28/08/2026",
        "vehicle_number": "GJ05AB1234", "invoice_value": "448400", "eway_bill_number": "231007654321",
        "validity": "31/08/2026",
    }
    base.update(kw)
    return {"fields": {k: {"value": v, "confidence": 0.9} for k, v in base.items()}}


def test_clean_document_looks_ok():
    res = validate_document(_fields())
    assert res["status"] in {"looks_ok", "review_recommended"}
    assert any("valid" in p.lower() for p in res["positives"])


def test_missing_required_fields_flagged():
    res = validate_document(_fields(eway_bill_number=None, invoice_number=None))
    codes = [i["code"] for i in res["issues"]]
    assert "MISSING_FIELDS" in codes
    assert res["document_risk_score"] > 10


def test_bad_vehicle_format_flagged():
    res = validate_document(_fields(vehicle_number="XX!!123"))
    assert any(i["code"] == "VEHICLE_FORMAT" for i in res["issues"])


def test_vehicle_mismatch_with_trip():
    trip = {"vehicle_number": "MH12XY7788", "origin": "Surat", "destination": "Indore"}
    res = validate_document(_fields(), trip)
    assert any(i["code"] == "VEHICLE_MISMATCH" for i in res["issues"])


def test_never_makes_legal_determination():
    res = validate_document(_fields())
    assert "legal" in res["notice"].lower()
