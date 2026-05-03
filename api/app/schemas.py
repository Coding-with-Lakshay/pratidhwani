"""Pydantic request/response models shared across routers."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    request_type: str = Field(default="light", description="One of: light, heavy, gpu-mock")
    payload_size: int = Field(default=0, ge=0, description="Approx payload size in bytes")
    tenant_id: str | None = Field(default=None)


class RouteAltScore(BaseModel):
    region_id: str
    gcp_region: str
    score: float
    lat_norm: float
    carbon_norm: float
    cost_norm: float


class RouteResponse(BaseModel):
    region: str
    region_url: str
    decision_id: str
    score: float
    reasons: list[str]
    alt_scores: list[RouteAltScore]
    corr_id: str


class WeightsPayload(BaseModel):
    w_lat: float = Field(ge=0.0)
    w_carbon: float = Field(ge=0.0)
    w_cost: float = Field(ge=0.0)


class WeightsResponse(BaseModel):
    w_lat: float
    w_carbon: float
    w_cost: float
    updated_ts: str | None = None
    record_id: str | None = None


class RegionView(BaseModel):
    id: str
    name: str
    gcp_region: str
    base_latency_ms: float
    price_per_million: float
    carbon_g_per_kwh: float
    last_seen: str | None = None
    last_p95_ms: float | None = None


class ForecastTickResponse(BaseModel):
    ts: str
    per_region: list[dict[str, Any]]
    warmed_regions: list[str]
    budget_used: int
    budget_limit: int


class SavingsResponse(BaseModel):
    window_ts: str
    samples: int
    cost_saved_pct: float
    carbon_saved_pct: float
    cost_baseline: float
    cost_ours: float
    carbon_baseline: float
    carbon_ours: float


class ReplayRequest(BaseModel):
    minutes: int = Field(default=60, ge=1, le=1440)
    profile: str = Field(default="diurnal_wiki")
    tenant_id: str | None = None
    qps_peak: float = Field(default=20.0, ge=0.1)
    seed: int | None = None
    write_decisions: bool = Field(default=True)


class ReplayResponse(BaseModel):
    profile: str
    minutes: int
    requests_simulated: int
    cost_baseline: float
    cost_ours: float
    carbon_baseline: float
    carbon_ours: float
    cost_saved_pct: float
    carbon_saved_pct: float
    p95_ours_ms: float
    p95_baseline_ms: float
    sample_decisions: list[dict[str, Any]]


class HealthzResponse(BaseModel):
    status: str
    db: bool
    service: str
    env: str
    version: str
