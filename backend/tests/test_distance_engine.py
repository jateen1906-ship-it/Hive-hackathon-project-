"""Distance provider + anomaly tests (pure, no DB)."""
from app.engines.distance_engine import get_distance_provider, distance_anomaly


def test_known_corridor_is_deterministic_and_demo():
    p = get_distance_provider()
    a = p.estimate_distance("Surat", "Indore")
    b = p.estimate_distance("Surat", "Indore")
    assert a.distance_km == b.distance_km == 520
    assert a.is_demo is True


def test_reverse_corridor_matches():
    p = get_distance_provider()
    assert p.estimate_distance("Indore", "Surat").distance_km == 520


def test_unknown_pair_is_stable():
    p = get_distance_provider()
    a = p.estimate_distance("Cityx", "Cityy")
    b = p.estimate_distance("Cityx", "Cityy")
    assert a.distance_km == b.distance_km
    assert a.is_demo is True


def test_anomaly_severity_bands():
    assert distance_anomaly(500, 520)["severity"] == "low"      # ~4%
    assert distance_anomaly(420, 520)["severity"] == "medium"   # ~19%
    assert distance_anomaly(360, 520)["severity"] == "high"     # ~31%
    assert distance_anomaly(120, 520)["severity"] == "critical" # ~77%


def test_anomaly_missing_values():
    r = distance_anomaly(None, 520)
    assert r["deviation_pct"] is None
    assert 0 <= r["score"] <= 100
