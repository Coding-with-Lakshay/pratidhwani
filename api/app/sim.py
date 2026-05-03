"""Replay simulator: synthesises diurnal Wikipedia-like traffic and runs the
scorer/router locally to compute savings vs round-robin.

Endpoint: POST /api/v1/sim/replay
"""
from __future__ import annotations

import math
import random
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from .baseline import RoundRobinBaseline, carbon_of, cost_of
from .config import Settings, get_settings
from .db import PocketBaseClient, get_client
from .logging_setup import get_correlation_id, get_logger
from .regions_repo import (
    fetch_weights,
    regions_as_inputs,
    write_savings,
)
from .schemas import ReplayRequest, ReplayResponse
from .scorer import RegionInput, score_regions

logger = get_logger("pratidhwani.sim")
router = APIRouter()

# Wikipedia-style diurnal: peak around 20:00 UTC (Europe afternoon / India night),
# trough around 06:00 UTC. Sigma controls peakedness.
PROFILES: dict[str, dict[str, float]] = {
    "diurnal_wiki": {"peak_hour": 20.0, "trough_hour": 6.0, "min_factor": 0.15},
    "flat":        {"peak_hour": 12.0, "trough_hour": 0.0, "min_factor": 1.00},
    "spiky":       {"peak_hour": 14.0, "trough_hour": 4.0, "min_factor": 0.05},
}


@router.post("/sim/replay", response_model=ReplayResponse)
async def replay(
    body: ReplayRequest, settings: Settings = Depends(get_settings)
) -> ReplayResponse:
    t0 = time.perf_counter()
    corr_id = get_correlation_id()
    client: PocketBaseClient = get_client()

    regions = await regions_as_inputs(client)
    if not regions:
        raise HTTPException(status_code=503, detail="no regions configured")

    weights, _ = await fetch_weights(client, settings)
    if body.profile not in PROFILES:
        raise HTTPException(status_code=400, detail=f"unknown profile: {body.profile}")

    rng = random.Random(body.seed if body.seed is not None else 42)

    # Generate per-second QPS following the chosen profile.
    qps_series = _diurnal_qps(body.profile, body.minutes, body.qps_peak, rng)

    rr = RoundRobinBaseline(regions)
    cost_baseline = 0.0
    cost_ours = 0.0
    carbon_baseline = 0.0
    carbon_ours = 0.0
    p95_ours: list[float] = []
    p95_baseline: list[float] = []
    samples: list[dict[str, Any]] = []
    request_count = 0

    for second_index, qps in enumerate(qps_series):
        n = _poisson_count(qps, rng)
        for _ in range(n):
            request_count += 1
            request_class = _pick_class(rng)
            # Slightly perturb each region's p95 to mimic noise.
            perturbed = _perturb_regions(regions, rng)

            scored = score_regions(perturbed, request_class=request_class, weights=weights)
            chosen = scored[0]
            chosen_input = next(r for r in perturbed if r.region_id == chosen.region_id)

            baseline_pick = rr.pick()
            baseline_input = next(r for r in perturbed if r.region_id == baseline_pick.region_id)

            cost_ours += cost_of(chosen_input)
            cost_baseline += cost_of(baseline_input)
            carbon_ours += carbon_of(chosen_input)
            carbon_baseline += carbon_of(baseline_input)
            p95_ours.append(chosen_input.current_p95_ms)
            p95_baseline.append(baseline_input.current_p95_ms)

            if len(samples) < 25 and second_index % max(1, len(qps_series) // 25) == 0:
                samples.append(
                    {
                        "second": second_index,
                        "request_class": request_class,
                        "ours": chosen.gcp_region,
                        "baseline": baseline_input.gcp_region,
                        "score": chosen.score,
                    }
                )

    if body.write_decisions:
        await write_savings(
            client,
            baseline_cost=cost_baseline,
            our_cost=cost_ours,
            baseline_carbon=carbon_baseline,
            our_carbon=carbon_ours,
        )

    cost_pct = _safe_pct(cost_baseline, cost_ours)
    carbon_pct = _safe_pct(carbon_baseline, carbon_ours)
    p95_o = _percentile(p95_ours, 95.0) if p95_ours else 0.0
    p95_b = _percentile(p95_baseline, 95.0) if p95_baseline else 0.0

    latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    logger.info(
        "sim_replay_done",
        endpoint="/api/v1/sim/replay",
        ts=datetime.now(timezone.utc).isoformat(),
        profile=body.profile,
        minutes=body.minutes,
        requests=request_count,
        cost_saved_pct=cost_pct,
        carbon_saved_pct=carbon_pct,
        latency_ms=latency_ms,
        action="sim_replay",
        corr_id=corr_id,
    )

    return ReplayResponse(
        profile=body.profile,
        minutes=body.minutes,
        requests_simulated=request_count,
        cost_baseline=cost_baseline,
        cost_ours=cost_ours,
        carbon_baseline=carbon_baseline,
        carbon_ours=carbon_ours,
        cost_saved_pct=cost_pct,
        carbon_saved_pct=carbon_pct,
        p95_ours_ms=p95_o,
        p95_baseline_ms=p95_b,
        sample_decisions=samples,
    )


def _diurnal_qps(profile: str, minutes: int, peak: float, rng: random.Random) -> list[float]:
    cfg = PROFILES[profile]
    seconds = minutes * 60
    out: list[float] = []
    peak_h = float(cfg["peak_hour"])
    trough_h = float(cfg["trough_hour"])
    min_f = float(cfg["min_factor"])
    # cosine wave between trough and peak, period = 24h.
    for s in range(seconds):
        hour = (s / 3600.0) % 24.0
        # Center at peak hour; scale to [min_f .. 1].
        x = math.cos((hour - peak_h) / 24.0 * 2.0 * math.pi)
        x = (x + 1.0) / 2.0  # 0..1
        x = min_f + (1.0 - min_f) * x
        # ±15% jitter
        noise = 1.0 + (rng.random() - 0.5) * 0.30
        out.append(max(0.0, peak * x * noise))
    return out


def _poisson_count(rate: float, rng: random.Random) -> int:
    if rate <= 0.0:
        return 0
    # Knuth's algorithm — fine for small rates (per-second QPS in our demo).
    if rate > 30.0:
        # Normal approximation for stability.
        return max(0, int(round(rng.gauss(rate, math.sqrt(rate)))))
    L = math.exp(-rate)
    k = 0
    p = 1.0
    while True:
        k += 1
        p *= rng.random()
        if p <= L:
            return k - 1


def _pick_class(rng: random.Random) -> str:
    r = rng.random()
    if r < 0.7:
        return "light"
    if r < 0.95:
        return "heavy"
    return "gpu-mock"


def _perturb_regions(regions: list[RegionInput], rng: random.Random) -> list[RegionInput]:
    out: list[RegionInput] = []
    for r in regions:
        jitter = 1.0 + (rng.random() - 0.5) * 0.20
        out.append(
            RegionInput(
                region_id=r.region_id,
                name=r.name,
                gcp_region=r.gcp_region,
                current_p95_ms=max(1.0, r.current_p95_ms * jitter),
                carbon_g_per_kwh=r.carbon_g_per_kwh,
                price_per_million_req=r.price_per_million_req,
            )
        )
    return out


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    k = (len(s) - 1) * (pct / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return float(s[int(k)])
    return float(s[f]) + (float(s[c]) - float(s[f])) * (k - f)


def _safe_pct(baseline: float, ours: float) -> float:
    if baseline <= 0:
        return 0.0
    return round((baseline - ours) / baseline * 100.0, 2)
