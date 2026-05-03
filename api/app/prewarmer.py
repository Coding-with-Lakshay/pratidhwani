"""POST /api/v1/forecast/tick — prewarmer cron.

Reads recent decisions to build a per-region QPS series, runs the
forecaster, and conditionally fires a synthetic warm GET to the region's
/__warm endpoint. Persists a `forecasts` row per region.

Pre-warm trigger:
    predicted_qps >= settings.PREWARM_TRIGGER_QPS AND ci_low > 0
    AND warm_budget_remaining > 0
"""
from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException

from .config import Settings, get_settings
from .db import PocketBaseClient, get_client
from .forecaster import forecast as run_forecast
from .logging_setup import get_correlation_id, get_logger
from .regions_repo import (
    fetch_region_qps_history,
    fetch_regions,
    write_forecast,
)
from .schemas import ForecastTickResponse

logger = get_logger("pratidhwani.prewarmer")
router = APIRouter()

WARM_TIMEOUT_S = 3.0


@router.post("/forecast/tick", response_model=ForecastTickResponse)
async def forecast_tick(settings: Settings = Depends(get_settings)) -> ForecastTickResponse:
    t0 = time.perf_counter()
    corr_id = get_correlation_id()
    client: PocketBaseClient = get_client()

    regions = await fetch_regions(client)
    if not regions:
        raise HTTPException(status_code=503, detail="no regions configured")

    budget_limit = int(settings.PREWARM_BUDGET_PER_TICK)
    budget_used = 0
    warmed: list[str] = []
    per_region_summary: list[dict] = []

    for r in regions:
        region_id = r["id"]
        gcp_region = r.get("gcp_region", "")
        history = await fetch_region_qps_history(
            client, region_id, n=settings.FORECAST_WINDOW_TICKS
        )
        result = run_forecast(history)
        action = "none"
        warm_target_url = settings.region_urls.get(gcp_region, "")
        if (
            result.predicted_qps >= settings.PREWARM_TRIGGER_QPS
            and result.ci_low > 0.0
            and budget_used < budget_limit
            and warm_target_url
        ):
            ok = await _warm(warm_target_url)
            action = "warm" if ok else "warm_failed"
            if ok:
                budget_used += 1
                warmed.append(gcp_region)

        await write_forecast(
            client,
            region_id=region_id,
            predicted_qps=result.predicted_qps,
            ci_low=result.ci_low,
            ci_high=result.ci_high,
            action_taken=action,
        )

        per_region_summary.append(
            {
                "region_id": region_id,
                "gcp_region": gcp_region,
                "predicted_qps": result.predicted_qps,
                "ci_low": result.ci_low,
                "ci_high": result.ci_high,
                "method": result.method,
                "action": action,
            }
        )

        logger.info(
            "forecast_emit",
            endpoint="/api/v1/forecast/tick",
            ts=datetime.now(timezone.utc).isoformat(),
            region=gcp_region,
            predicted_qps=round(result.predicted_qps, 3),
            ci_low=round(result.ci_low, 3),
            ci_high=round(result.ci_high, 3),
            method=result.method,
            action=action,
            corr_id=corr_id,
        )

    latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    logger.info(
        "forecast_tick_done",
        latency_ms=latency_ms,
        regions=len(regions),
        warmed=warmed,
        budget_used=budget_used,
        budget_limit=budget_limit,
        corr_id=corr_id,
    )

    return ForecastTickResponse(
        ts=datetime.now(timezone.utc).isoformat(),
        per_region=per_region_summary,
        warmed_regions=warmed,
        budget_used=budget_used,
        budget_limit=budget_limit,
    )


async def _warm(url: str) -> bool:
    target = url.rstrip("/") + "/__warm"
    try:
        async with httpx.AsyncClient(timeout=WARM_TIMEOUT_S) as cx:
            r = await cx.get(target)
        return 200 <= r.status_code < 500
    except Exception as e:  # noqa: BLE001
        logger.info("warm_failed", url=target, err=str(e))
        return False
