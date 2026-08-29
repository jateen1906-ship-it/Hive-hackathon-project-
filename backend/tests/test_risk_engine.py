"""Deterministic risk-engine tests (pure, no DB)."""
from app.engines.risk_engine import classify, analyze_trip, WEIGHTS, ENGINE_VERSION


def test_weights_sum_to_one():
    assert round(sum(WEIGHTS.values()), 6) == 1.0


def test_classify_boundaries():
    assert classify(0) == "LOW"
    assert classify(30) == "LOW"
    assert classify(31) == "MEDIUM"
    assert classify(60) == "MEDIUM"
    assert classify(61) == "HIGH"
    assert classify(80) == "HIGH"
    assert classify(81) == "CRITICAL"
    assert classify(100) == "CRITICAL"


def _trip(**kw):
    base = dict(origin="Surat", destination="Indore", declared_distance_km=380,
                invoice_value=448400, goods_description="cotton", vehicle_number="GJ05AB1234")
    base.update(kw)
    return base


def test_analyze_returns_full_structure():
    res = analyze_trip(_trip())
    assert set(["score", "level", "engine_version", "factors", "recommendations"]).issubset(res)
    assert res["engine_version"] == ENGINE_VERSION
    assert 0 <= res["score"] <= 100
    assert res["level"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert len(res["factors"]) == 5
    for f in res["factors"]:
        for key in ("factor_type", "severity", "score", "title", "description", "recommendation"):
            assert key in f


def test_score_matches_weighted_components():
    res = analyze_trip(_trip())
    comps = res["components"]
    expected = sum(comps[k] * WEIGHTS[k] for k in WEIGHTS)
    assert abs(res["score"] - round(expected, 1)) < 0.05


def test_large_distance_gap_raises_distance_factor():
    # declared far below estimated (Surat-Indore demo ~520km) -> high distance factor
    res = analyze_trip(_trip(declared_distance_km=120))
    dist = next(f for f in res["factors"] if f["factor_type"] == "distance_anomaly")
    assert dist["score"] >= 70
    assert dist["severity"] in {"high", "critical"}


def test_missing_vehicle_and_invoice_raises_trip_factor():
    res = analyze_trip(_trip(vehicle_number=None, invoice_value=None, goods_description=None))
    trip_f = next(f for f in res["factors"] if f["factor_type"] == "trip_vehicle")
    assert trip_f["score"] > 30
