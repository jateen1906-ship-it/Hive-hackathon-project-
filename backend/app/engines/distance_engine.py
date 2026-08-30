"""Distance estimation behind a provider adapter.

The DEMO provider returns deterministic, clearly-labelled estimates so the app
works end-to-end without external map credentials. Swap `DemoDistanceProvider`
for a real maps provider later without touching the risk engine.
"""
from __future__ import annotations
import hashlib
from abc import ABC, abstractmethod
from typing import Optional


# Known Indian corridors (approx road distance in km) used by the demo provider.
_CORRIDOR_KM = {
    ("surat", "indore"): 520,
    ("delhi", "jaipur"): 280,
    ("mumbai", "pune"): 150,
    ("ahmedabad", "udaipur"): 260,
    ("chennai", "bengaluru"): 350,
    ("chennai", "bangalore"): 350,
    ("delhi", "agra"): 233,
    ("mumbai", "nashik"): 167,
    ("hyderabad", "vijayawada"): 275,
    ("kolkata", "ranchi"): 400,
}


class DistanceResult:
    def __init__(self, distance_km: float, source: str, is_demo: bool, note: str):
        self.distance_km = round(float(distance_km), 1)
        self.source = source
        self.is_demo = is_demo
        self.note = note

    def to_dict(self) -> dict:
        return {
            "distance_km": self.distance_km,
            "source": self.source,
            "is_demo": self.is_demo,
            "note": self.note,
        }


class DistanceProvider(ABC):
    @abstractmethod
    def estimate_distance(self, origin: str, destination: str) -> DistanceResult:
        ...


class DemoDistanceProvider(DistanceProvider):
    """Deterministic demo estimates. NOT live navigation data."""

    NOTE = "Demonstration estimate \u2014 not derived from a live maps/navigation provider."

    def estimate_distance(self, origin: str, destination: str) -> DistanceResult:
        o = (origin or "").strip().lower()
        d = (destination or "").strip().lower()
        key = (o, d)
        rkey = (d, o)
        if key in _CORRIDOR_KM:
            return DistanceResult(_CORRIDOR_KM[key], "demo-corridor-table", True, self.NOTE)
        if rkey in _CORRIDOR_KM:
            return DistanceResult(_CORRIDOR_KM[rkey], "demo-corridor-table", True, self.NOTE)
        # deterministic pseudo-distance from a hash so results are stable per pair
        h = int(hashlib.sha256(f"{o}|{d}".encode()).hexdigest(), 16)
        est = 120 + (h % 900)  # 120..1019 km
        return DistanceResult(est, "demo-estimator", True, self.NOTE)


# Approx coordinates [lat, lng] for common Indian cities (for OSRM live routing).
_CITY_COORDS = {
    "surat": (21.1702, 72.8311), "indore": (22.7196, 75.8577),
    "delhi": (28.6139, 77.2090), "jaipur": (26.9124, 75.7873),
    "mumbai": (19.0760, 72.8777), "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714), "udaipur": (24.5854, 73.7125),
    "chennai": (13.0827, 80.2707), "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946), "agra": (27.1767, 78.0081),
    "nashik": (19.9975, 73.7898), "hyderabad": (17.3850, 78.4867),
    "vijayawada": (16.5062, 80.6480), "kolkata": (22.5726, 88.3639),
    "ranchi": (23.3441, 85.3096), "nagpur": (21.1458, 79.0882),
    "lucknow": (26.8467, 80.9462), "bhopal": (23.2599, 77.4126),
}


class LiveOSRMProvider(DistanceProvider):
    """Live road distance via the public OSRM API. Falls back to demo on any failure."""

    def __init__(self):
        from ..config import settings
        self.base = settings.OSRM_BASE_URL.rstrip("/")
        self._fallback = DemoDistanceProvider()

    def estimate_distance(self, origin: str, destination: str) -> DistanceResult:
        oc = _CITY_COORDS.get((origin or "").strip().lower())
        dc = _CITY_COORDS.get((destination or "").strip().lower())
        if not oc or not dc:
            return self._fallback.estimate_distance(origin, destination)
        try:
            import httpx
            url = f"{self.base}/route/v1/driving/{oc[1]},{oc[0]};{dc[1]},{dc[0]}"
            r = httpx.get(url, params={"overview": "false"}, timeout=5.0)
            data = r.json()
            if data.get("code") == "Ok" and data.get("routes"):
                meters = data["routes"][0]["distance"]
                return DistanceResult(meters / 1000.0, "osrm-live", False,
                                      "Live road distance (OSRM).")
        except Exception:
            pass
        # graceful fallback, clearly labelled estimated
        return self._fallback.estimate_distance(origin, destination)


def get_distance_provider(live: bool = False) -> DistanceProvider:
    if live:
        return LiveOSRMProvider()
    return DemoDistanceProvider()


def distance_anomaly(declared_km: Optional[float], estimated_km: Optional[float]) -> dict:
    """Return anomaly score (0-100) + severity + human explanation."""
    if not declared_km or not estimated_km or estimated_km <= 0:
        return {
            "score": 45,
            "severity": "medium",
            "deviation_pct": None,
            "detail": "Declared distance could not be compared (missing values).",
        }
    deviation = (estimated_km - float(declared_km)) / estimated_km * 100.0
    abs_dev = abs(deviation)
    if abs_dev <= 8:
        score, severity = 8, "low"
    elif abs_dev <= 20:
        score, severity = 40, "medium"
    elif abs_dev <= 35:
        score, severity = 70, "high"
    else:
        score, severity = 92, "critical"
    direction = "below" if deviation > 0 else "above"
    detail = (
        f"Declared distance ({float(declared_km):.0f} km) is {abs_dev:.0f}% {direction} "
        f"the estimated route distance ({estimated_km:.0f} km)."
    )
    return {"score": score, "severity": severity, "deviation_pct": round(deviation, 1), "detail": detail}
