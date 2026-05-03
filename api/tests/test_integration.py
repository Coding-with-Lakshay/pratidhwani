"""Integration tests against a real PocketBase container.

Spin up first with:
    docker compose -f tests/docker-compose.yml up -d

Tests are skipped automatically when PB is not reachable.

Required env (set by docker-compose by default):
    PB_URL                http://127.0.0.1:8090
    PB_ADMIN_EMAIL        admin@example.com
    PB_ADMIN_PASSWORD     admin12345
"""
from __future__ import annotations

import json
import os
import time
import uuid
from typing import Any

import httpx
import pytest

PB_URL = os.environ.get("PB_URL", "http://127.0.0.1:8090")
PB_EMAIL = os.environ.get("PB_ADMIN_EMAIL", "admin@example.com")
PB_PASSWORD = os.environ.get("PB_ADMIN_PASSWORD", "admin12345")


def _pb_reachable() -> bool:
    try:
        with httpx.Client(timeout=1.5) as c:
            c.get(f"{PB_URL}/api/health")
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _pb_reachable(), reason="PocketBase not reachable; bring up tests/docker-compose.yml")


def _admin_token() -> str:
    with httpx.Client(timeout=5.0) as c:
        r = c.post(
            f"{PB_URL}/api/admins/auth-with-password",
            json={"identity": PB_EMAIL, "password": PB_PASSWORD},
        )
        # PocketBase >=0.23 may use /api/collections/_superusers/auth-with-password.
        if r.status_code == 404:
            r = c.post(
                f"{PB_URL}/api/collections/_superusers/auth-with-password",
                json={"identity": PB_EMAIL, "password": PB_PASSWORD},
            )
        r.raise_for_status()
        return r.json()["token"]


def _ensure_collection(token: str, name: str, schema: list[dict[str, Any]]) -> None:
    h = {"Authorization": token, "Content-Type": "application/json"}
    with httpx.Client(timeout=5.0) as c:
        existing = c.get(f"{PB_URL}/api/collections/{name}", headers=h)
        if existing.status_code == 200:
            return
        body = {
            "name": name,
            "type": "base",
            "schema": schema,
            "listRule": "",
            "viewRule": "",
            "createRule": "",
            "updateRule": "",
            "deleteRule": "",
        }
        r = c.post(f"{PB_URL}/api/collections", headers=h, json=body)
        if r.status_code >= 400:
            raise RuntimeError(f"create_collection {name} failed: {r.status_code} {r.text}")


@pytest.fixture(scope="module", autouse=True)
def setup_collections():
    token = _admin_token()
    _ensure_collection(
        token,
        "regions",
        [
            {"name": "name", "type": "text", "required": True},
            {"name": "gcp_region", "type": "text", "required": True},
            {"name": "base_latency_ms", "type": "number"},
            {"name": "price_per_million", "type": "number"},
            {"name": "carbon_g_per_kwh", "type": "number"},
            {"name": "last_p95_ms", "type": "number"},
            {"name": "last_seen", "type": "text"},
        ],
    )
    _ensure_collection(
        token,
        "decisions",
        [
            {"name": "ts", "type": "text"},
            {"name": "request_type", "type": "text"},
            {"name": "chosen_region", "type": "text"},
            {"name": "score", "type": "number"},
            {"name": "alt_scores_json", "type": "text"},
            {"name": "latency_observed_ms", "type": "number"},
            {"name": "was_cold", "type": "bool"},
            {"name": "corr_id", "type": "text"},
        ],
    )
    _ensure_collection(
        token,
        "forecasts",
        [
            {"name": "ts", "type": "text"},
            {"name": "region", "type": "text"},
            {"name": "predicted_qps", "type": "number"},
            {"name": "ci_low", "type": "number"},
            {"name": "ci_high", "type": "number"},
            {"name": "action_taken", "type": "text"},
        ],
    )
    _ensure_collection(
        token,
        "weights",
        [
            {"name": "w_lat", "type": "number"},
            {"name": "w_carbon", "type": "number"},
            {"name": "w_cost", "type": "number"},
            {"name": "updated_ts", "type": "text"},
        ],
    )
    _ensure_collection(
        token,
        "savings_baseline",
        [
            {"name": "ts", "type": "text"},
            {"name": "baseline_cost", "type": "number"},
            {"name": "our_cost", "type": "number"},
            {"name": "baseline_carbon", "type": "number"},
            {"name": "our_carbon", "type": "number"},
        ],
    )
    # Seed three regions.
    h = {"Authorization": token, "Content-Type": "application/json"}
    with httpx.Client(timeout=5.0) as c:
        existing = c.get(f"{PB_URL}/api/collections/regions/records", headers=h, params={"perPage": 200})
        if existing.json().get("totalItems", 0) == 0:
            for r in [
                {"name": "Mumbai", "gcp_region": "asia-south1", "base_latency_ms": 90, "price_per_million": 0.40, "carbon_g_per_kwh": 600, "last_p95_ms": 100},
                {"name": "Belgium", "gcp_region": "europe-west1", "base_latency_ms": 180, "price_per_million": 0.45, "carbon_g_per_kwh": 80, "last_p95_ms": 200},
                {"name": "Iowa", "gcp_region": "us-central1", "base_latency_ms": 170, "price_per_million": 0.20, "carbon_g_per_kwh": 400, "last_p95_ms": 180},
            ]:
                resp = c.post(f"{PB_URL}/api/collections/regions/records", headers=h, json=r)
                assert resp.status_code in (200, 201, 409), resp.text


@pytest.fixture()
def app_client(monkeypatch):
    # Configure app to talk to the real PocketBase.
    monkeypatch.setenv("PB_URL", PB_URL)
    monkeypatch.setenv("PB_ADMIN_EMAIL", PB_EMAIL)
    monkeypatch.setenv("PB_ADMIN_PASSWORD", PB_PASSWORD)
    monkeypatch.setenv("AUTH_MODE", "admin")
    monkeypatch.setenv(
        "REGION_URLS_JSON",
        json.dumps(
            {
                "asia-south1": "https://as.example",
                "europe-west1": "https://eu.example",
                "us-central1": "https://us.example",
            }
        ),
    )
    from app.config import get_settings
    get_settings.cache_clear()
    from app.main import create_app
    from fastapi.testclient import TestClient

    with TestClient(create_app()) as c:
        yield c


def test_healthz_against_real_pb(app_client):
    r = app_client.get("/healthz")
    assert r.status_code == 200, r.text
    assert r.json()["db"] is True


def test_route_persists_decision_to_real_pb(app_client):
    r = app_client.post("/api/v1/route", json={"request_type": "light"})
    assert r.status_code == 200, r.text
    decision_id = r.json()["decision_id"]
    assert decision_id

    # Verify the decision exists via /decisions
    r2 = app_client.get("/api/v1/decisions", params={"per_page": 5})
    assert r2.status_code == 200
    items = r2.json().get("items", [])
    assert any(it["id"] == decision_id for it in items)


def test_weights_round_trip(app_client):
    payload = {"w_lat": 0.5, "w_carbon": 0.3, "w_cost": 0.2}
    r = app_client.post("/api/v1/weights", json=payload)
    assert r.status_code == 200, r.text
    r2 = app_client.get("/api/v1/weights")
    assert r2.status_code == 200
    body = r2.json()
    s = body["w_lat"] + body["w_carbon"] + body["w_cost"]
    # Persisted (within rounding from PB number type).
    assert abs(s - 1.0) < 1e-6


def test_forecast_tick_writes_forecasts(app_client):
    r = app_client.post("/api/v1/forecast/tick")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "per_region" in body
    assert isinstance(body["per_region"], list)
    assert len(body["per_region"]) == 3
