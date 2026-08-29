"""API + authorization tests via FastAPI TestClient (hits the real Neon DB)."""
import uuid
import pytest
from starlette.testclient import TestClient
from server import app


@pytest.fixture(scope="module")
def client():
    # context manager => single event loop for the client's lifetime + runs startup
    with TestClient(app) as c:
        yield c


def _register(client):
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Pass@1234", "full_name": "T"})
    assert r.status_code == 201, r.text
    return r.json()["data"]["token"], email


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200 and r.json()["success"] is True


def test_register_login_me(client):
    tok, email = _register(client)
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "Pass@1234"})
    assert r.status_code == 200
    me = client.get("/api/v1/auth/me", headers=_h(tok)).json()["data"]
    assert me["email"] == email
    assert "password_hash" not in me


def test_login_wrong_password(client):
    _, email = _register(client)
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "nope"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_protected_requires_token(client):
    assert client.get("/api/v1/trips").status_code == 401


def test_trip_create_analyze_flow(client):
    tok, _ = _register(client)
    trip = client.post("/api/v1/trips", headers=_h(tok), json={
        "origin": "Surat", "destination": "Indore", "declared_distance_km": 380,
        "vehicle_number": "GJ05AB1234", "invoice_value": 100000, "goods_description": "cotton",
    }).json()["data"]
    res = client.post(f"/api/v1/trips/{trip['id']}/analyze", headers=_h(tok)).json()["data"]
    assert 0 <= res["score"] <= 100
    assert len(res["factors"]) == 5


def test_cross_user_isolation(client):
    tok_a, _ = _register(client)
    tok_b, _ = _register(client)
    trip = client.post("/api/v1/trips", headers=_h(tok_a), json={
        "origin": "Delhi", "destination": "Jaipur"}).json()["data"]
    r = client.get(f"/api/v1/trips/{trip['id']}", headers=_h(tok_b))
    assert r.status_code == 404
    b_list = client.get("/api/v1/trips", headers=_h(tok_b)).json()["data"]
    assert all(t["id"] != trip["id"] for t in b_list)
