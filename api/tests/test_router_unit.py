"""Unit tests for the router that don't require a live PocketBase.

We patch the module-level `get_client` to return a stubbed PB client whose
methods we control. This is NOT a mock of the PocketBase HTTP API — it
replaces the PB client object entirely. Integration tests in
test_integration.py exercise the real HTTP path.
"""
from __future__ import annotations

import asyncio
from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


class _StubClient:
    """Stand-in for PocketBaseClient in unit tests.

    Records create/list/update calls and returns canned data. NO real HTTP.
    """

    def __init__(self, regions: list[dict[str, Any]], weights_row: dict[str, Any] | None = None) -> None:
        self._regions = regions
        self._weights_row = weights_row
        self.created: list[tuple[str, dict[str, Any]]] = []

    async def list_records(self, collection: str, **kw):
        if collection == "regions":
            return {"items": list(self._regions), "page": 1, "perPage": 200, "totalItems": len(self._regions)}
        if collection == "weights":
            return {"items": [self._weights_row] if self._weights_row else [], "page": 1, "perPage": 1, "totalItems": 1 if self._weights_row else 0}
        if collection == "decisions":
            return {"items": [], "page": 1, "perPage": 100, "totalItems": 0}
        if collection == "savings_baseline":
            return {"items": [], "page": 1, "perPage": 100, "totalItems": 0}
        return {"items": [], "page": 1, "perPage": 100, "totalItems": 0}

    async def create_record(self, collection: str, data):
        self.created.append((collection, dict(data)))
        rec = {"id": f"{collection}-id-{len(self.created)}", **dict(data)}
        if collection == "weights":
            self._weights_row = rec
        return rec

    async def update_record(self, collection: str, record_id: str, data):
        rec = {"id": record_id, **dict(data)}
        if collection == "weights":
            self._weights_row = rec
        return rec

    async def health(self) -> bool:
        return True

    async def startup(self):
        return None

    async def shutdown(self):
        return None


REGIONS = [
    {"id": "r1", "name": "Mumbai", "gcp_region": "asia-south1", "base_latency_ms": 90, "last_p95_ms": 100, "carbon_g_per_kwh": 600, "price_per_million": 0.40},
    {"id": "r2", "name": "Belgium", "gcp_region": "europe-west1", "base_latency_ms": 180, "last_p95_ms": 200, "carbon_g_per_kwh": 80, "price_per_million": 0.45},
    {"id": "r3", "name": "Iowa", "gcp_region": "us-central1", "base_latency_ms": 170, "last_p95_ms": 180, "carbon_g_per_kwh": 400, "price_per_million": 0.20},
]


@pytest.fixture()
def stub_client():
    return _StubClient(REGIONS, weights_row=None)


@pytest.fixture()
def client(stub_client, monkeypatch):
    # Don't init real PB at startup — patch init/get/close.
    async def _init(*a, **kw):
        return stub_client

    async def _close():
        return None

    def _get():
        return stub_client

    monkeypatch.setattr("app.main.init_client", _init, raising=True)
    monkeypatch.setattr("app.main.close_client", _close, raising=True)
    monkeypatch.setattr("app.main.get_client", _get, raising=True)
    monkeypatch.setattr("app.router.get_client", _get, raising=True)
    monkeypatch.setattr("app.prewarmer.get_client", _get, raising=True)
    monkeypatch.setattr("app.sim.get_client", _get, raising=True)

    # Provide region URLs in env-like config.
    import os

    os.environ["REGION_URLS_JSON"] = (
        '{"asia-south1":"https://as.example","europe-west1":"https://eu.example","us-central1":"https://us.example"}'
    )
    os.environ["AUTH_MODE"] = "none"
    # Reset cached settings.
    from app.config import get_settings
    get_settings.cache_clear()

    app = create_app()
    with TestClient(app) as c:
        yield c


def test_health_ok(client, stub_client):
    r = client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["db"] is True


def test_route_picks_region_writes_decision(client, stub_client):
    r = client.post("/api/v1/route", json={"request_type": "light", "payload_size": 0})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["region"] in {"asia-south1", "europe-west1", "us-central1"}
    assert body["region_url"].startswith("https://")
    assert isinstance(body["alt_scores"], list)
    assert len(body["alt_scores"]) == 3
    # Decision was recorded.
    assert any(c[0] == "decisions" for c in stub_client.created)


def test_correlation_id_passthrough(client):
    r = client.post(
        "/api/v1/route",
        json={"request_type": "heavy"},
        headers={"X-Correlation-ID": "abc-123"},
    )
    assert r.status_code == 200
    assert r.headers["X-Correlation-ID"] == "abc-123"
    assert r.json()["corr_id"] == "abc-123"


def test_regions_endpoint(client):
    r = client.get("/api/v1/regions")
    assert r.status_code == 200
    body = r.json()
    assert {b["gcp_region"] for b in body} == {"asia-south1", "europe-west1", "us-central1"}


def test_weights_get_default(client):
    r = client.get("/api/v1/weights")
    assert r.status_code == 200
    body = r.json()
    assert body["w_lat"] + body["w_carbon"] + body["w_cost"] > 0


def test_weights_post_persists(client, stub_client):
    r = client.post("/api/v1/weights", json={"w_lat": 0.5, "w_carbon": 0.3, "w_cost": 0.2})
    assert r.status_code == 200
    assert any(c[0] == "weights" for c in stub_client.created)


def test_weights_zero_sum_rejected(client):
    r = client.post("/api/v1/weights", json={"w_lat": 0.0, "w_carbon": 0.0, "w_cost": 0.0})
    assert r.status_code == 400


def test_sim_replay_returns_savings_signs(client, stub_client):
    r = client.post(
        "/api/v1/sim/replay",
        json={"minutes": 2, "profile": "diurnal_wiki", "qps_peak": 5.0, "seed": 7, "write_decisions": False},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    # Sim returns finite savings on every axis. Sign depends on weight balance
    # — with default 0.4/0.4/0.2 weights and these synthetic regions, latency
    # often wins out and may pull carbon/cost in the wrong direction. What
    # we assert: the simulator runs to completion, produces non-zero traffic,
    # and reports finite numbers that aren't pathologically off-scale.
    assert body["requests_simulated"] > 0
    for k in ("cost_saved_pct", "carbon_saved_pct"):
        v = body[k]
        assert -100.0 <= v <= 100.0, f"{k}={v}"
    assert body["p95_ours_ms"] > 0
    assert body["p95_baseline_ms"] > 0


def test_sim_replay_accepts_no_body(client, stub_client):
    # Frontend hits POST /sim/replay with no JSON body — must not 422.
    r = client.post("/api/v1/sim/replay")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["requests_simulated"] > 0


def test_sim_replay_status_returns_idle_then_complete(client, stub_client):
    r = client.get("/api/v1/sim/replay/status")
    assert r.status_code == 200
    # State may be idle or complete depending on test ordering; both shapes valid.
    assert r.json()["state"] in {"idle", "complete"}

    client.post(
        "/api/v1/sim/replay",
        json={"minutes": 1, "profile": "diurnal_wiki", "qps_peak": 5.0, "seed": 7, "write_decisions": False},
    )
    r2 = client.get("/api/v1/sim/replay/status")
    assert r2.status_code == 200
    body = r2.json()
    assert body["state"] == "complete"
    assert body["delta"] is not None
    assert body["requests_simulated"] > 0
    assert body["delta"]["p95_pratidhwani_ms"] > 0


def test_sim_replay_with_carbon_heavy_weights_saves_carbon(client, stub_client):
    # Push weights toward carbon and the simulator should *demonstrate*
    # carbon savings vs round-robin baseline. This is what the dashboard demo
    # surfaces to validate the multi-objective router actually works.
    client.post("/api/v1/weights", json={"w_lat": 0.0, "w_carbon": 1.0, "w_cost": 0.0})
    r = client.post(
        "/api/v1/sim/replay",
        json={"minutes": 2, "profile": "diurnal_wiki", "qps_peak": 5.0, "seed": 7, "write_decisions": False},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["carbon_saved_pct"] > 0.0, body
