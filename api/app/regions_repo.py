"""Region/weights/decisions repository — thin wrapper over PocketBaseClient.

Centralises collection names so endpoints stay terse.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from .config import Settings
from .db import PocketBaseClient
from .logging_setup import get_logger
from .scorer import RegionInput, ScoredRegion

logger = get_logger("pratidhwani.repo")

COLL_REGIONS = "regions"
COLL_DECISIONS = "decisions"
COLL_FORECASTS = "forecasts"
COLL_WEIGHTS = "weights"
COLL_SAVINGS = "savings_baseline"


async def fetch_regions(client: PocketBaseClient) -> list[dict[str, Any]]:
    page = await client.list_records(COLL_REGIONS, page=1, per_page=200, sort="name")
    return list(page.get("items", []))


async def regions_as_inputs(client: PocketBaseClient) -> list[RegionInput]:
    rows = await fetch_regions(client)
    out: list[RegionInput] = []
    for r in rows:
        out.append(
            RegionInput(
                region_id=r["id"],
                name=r.get("name", r.get("gcp_region", "")),
                gcp_region=r.get("gcp_region", ""),
                current_p95_ms=float(
                    r.get("last_p95_ms")
                    if r.get("last_p95_ms") is not None
                    else r.get("base_latency_ms", 100.0)
                ),
                carbon_g_per_kwh=float(r.get("carbon_g_per_kwh", 400.0)),
                price_per_million_req=float(r.get("price_per_million", 0.4)),
            )
        )
    return out


async def fetch_weights(client: PocketBaseClient, settings: Settings) -> tuple[dict[str, float], str | None]:
    """Return (weights, record_id). Falls back to settings default if collection empty."""
    page = await client.list_records(COLL_WEIGHTS, page=1, per_page=1, sort="-updated_ts")
    items = page.get("items", [])
    if not items:
        return dict(settings.default_weights), None
    row = items[0]
    return (
        {
            "w_lat": float(row.get("w_lat", 0.4)),
            "w_carbon": float(row.get("w_carbon", 0.4)),
            "w_cost": float(row.get("w_cost", 0.2)),
        },
        row["id"],
    )


async def upsert_weights(
    client: PocketBaseClient, w_lat: float, w_carbon: float, w_cost: float
) -> dict[str, Any]:
    page = await client.list_records(COLL_WEIGHTS, page=1, per_page=1, sort="-updated_ts")
    payload = {
        "w_lat": float(w_lat),
        "w_carbon": float(w_carbon),
        "w_cost": float(w_cost),
        "updated_ts": _now_iso(),
    }
    items = page.get("items", [])
    if items:
        return await client.update_record(COLL_WEIGHTS, items[0]["id"], payload)
    return await client.create_record(COLL_WEIGHTS, payload)


async def write_decision(
    client: PocketBaseClient,
    *,
    request_type: str,
    chosen: ScoredRegion,
    alt: list[ScoredRegion],
    latency_observed_ms: float | None,
    was_cold: bool,
    corr_id: str,
) -> dict[str, Any]:
    payload = {
        "ts": _now_iso(),
        "request_type": request_type,
        "chosen_region": chosen.region_id,
        "score": chosen.score,
        "alt_scores_json": json.dumps([_alt_to_dict(s) for s in alt]),
        "latency_observed_ms": latency_observed_ms,
        "was_cold": was_cold,
        "corr_id": corr_id,
    }
    return await client.create_record(COLL_DECISIONS, payload)


async def list_decisions(
    client: PocketBaseClient, *, since_iso: str | None, page: int = 1, per_page: int = 100
) -> dict[str, Any]:
    filter_ = f'ts >= "{since_iso}"' if since_iso else None
    return await client.list_records(
        COLL_DECISIONS, page=page, per_page=per_page, filter_=filter_, sort="-ts"
    )


async def write_forecast(
    client: PocketBaseClient,
    *,
    region_id: str,
    predicted_qps: float,
    ci_low: float,
    ci_high: float,
    action_taken: str,
) -> dict[str, Any]:
    payload = {
        "ts": _now_iso(),
        "region": region_id,
        "predicted_qps": predicted_qps,
        "ci_low": ci_low,
        "ci_high": ci_high,
        "action_taken": action_taken,
    }
    return await client.create_record(COLL_FORECASTS, payload)


async def write_savings(
    client: PocketBaseClient,
    *,
    baseline_cost: float,
    our_cost: float,
    baseline_carbon: float,
    our_carbon: float,
) -> dict[str, Any]:
    payload = {
        "ts": _now_iso(),
        "baseline_cost": baseline_cost,
        "our_cost": our_cost,
        "baseline_carbon": baseline_carbon,
        "our_carbon": our_carbon,
    }
    return await client.create_record(COLL_SAVINGS, payload)


async def aggregate_savings(client: PocketBaseClient, *, last_n: int = 100) -> dict[str, Any]:
    page = await client.list_records(
        COLL_SAVINGS, page=1, per_page=last_n, sort="-ts"
    )
    items = page.get("items", [])
    if not items:
        return {
            "samples": 0,
            "cost_baseline": 0.0,
            "cost_ours": 0.0,
            "carbon_baseline": 0.0,
            "carbon_ours": 0.0,
            "cost_saved_pct": 0.0,
            "carbon_saved_pct": 0.0,
        }
    cb = sum(float(x.get("baseline_cost", 0.0)) for x in items)
    co = sum(float(x.get("our_cost", 0.0)) for x in items)
    crb = sum(float(x.get("baseline_carbon", 0.0)) for x in items)
    cro = sum(float(x.get("our_carbon", 0.0)) for x in items)
    return {
        "samples": len(items),
        "cost_baseline": cb,
        "cost_ours": co,
        "carbon_baseline": crb,
        "carbon_ours": cro,
        "cost_saved_pct": _safe_pct(cb, co),
        "carbon_saved_pct": _safe_pct(crb, cro),
    }


async def fetch_region_qps_history(
    client: PocketBaseClient, region_id: str, *, n: int = 120
) -> list[float]:
    """Reads recent decisions for a region and rolls them into per-tick QPS counts.

    For bootstrap we tolerate a thin DB and just return whatever we have, padded
    to length 0 on the low side (forecaster handles bootstrap).
    """
    page = await client.list_records(
        COLL_DECISIONS,
        page=1,
        per_page=min(n * 5, 1000),
        filter_=f'chosen_region = "{region_id}"',
        sort="-ts",
    )
    items = page.get("items", [])
    if not items:
        return []
    # Bucket by 30s window backwards from now.
    from collections import Counter
    buckets: Counter[int] = Counter()
    now = datetime.now(timezone.utc)
    for it in items:
        ts = _parse_iso(it.get("ts", ""))
        if ts is None:
            continue
        delta = (now - ts).total_seconds()
        bucket = int(delta // 30)
        if 0 <= bucket < n:
            buckets[bucket] += 1
    series = [float(buckets.get(i, 0)) for i in range(n)]
    series.reverse()  # oldest -> newest
    return series


def _alt_to_dict(s: ScoredRegion) -> dict[str, Any]:
    return {
        "region_id": s.region_id,
        "gcp_region": s.gcp_region,
        "score": s.score,
        "lat_norm": s.lat_norm,
        "carbon_norm": s.carbon_norm,
        "cost_norm": s.cost_norm,
    }


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + "Z"


def _parse_iso(s: str) -> datetime | None:
    if not s:
        return None
    try:
        # PocketBase stores "YYYY-MM-DD HH:MM:SS.fffZ"
        s2 = s.replace("Z", "+00:00").replace(" ", "T", 1)
        return datetime.fromisoformat(s2)
    except ValueError:
        return None


def _safe_pct(baseline: float, ours: float) -> float:
    if baseline <= 0:
        return 0.0
    return round((baseline - ours) / baseline * 100.0, 2)
