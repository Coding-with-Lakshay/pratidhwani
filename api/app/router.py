"""POST /api/v1/route — multi-objective region routing.

Reads regions from PocketBase, runs the scorer, persists a `decisions`
row, and returns the chosen region URL with reasons + alt scores.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from .config import Settings, get_settings
from .db import PocketBaseClient, get_client
from .logging_setup import get_logger, get_correlation_id
from .regions_repo import (
    fetch_weights,
    regions_as_inputs,
    write_decision,
)
from .schemas import RouteAltScore, RouteRequest, RouteResponse
from .scorer import score_regions

logger = get_logger("pratidhwani.router")
router = APIRouter()


@router.post("/route", response_model=RouteResponse)
async def route(
    body: RouteRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
) -> RouteResponse:
    t0 = time.perf_counter()
    corr_id = get_correlation_id()
    client: PocketBaseClient = get_client()

    inputs = await regions_as_inputs(client)
    if not inputs:
        logger.warning("route_no_regions", corr_id=corr_id)
        raise HTTPException(status_code=503, detail="no regions configured")

    weights, _ = await fetch_weights(client, settings)
    scored = score_regions(inputs, request_class=body.request_type, weights=weights)
    if not scored:
        raise HTTPException(status_code=500, detail="scorer returned empty")

    chosen = scored[0]
    region_url = settings.region_urls.get(chosen.gcp_region, "")
    if not region_url:
        logger.warning(
            "route_missing_region_url", region=chosen.gcp_region, corr_id=corr_id
        )

    decision = await write_decision(
        client,
        request_type=body.request_type,
        chosen=chosen,
        alt=scored,
        latency_observed_ms=None,
        was_cold=False,
        corr_id=corr_id,
    )

    latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    logger.info(
        "route_decision",
        endpoint="/api/v1/route",
        ts=datetime.now(timezone.utc).isoformat(),
        region=chosen.gcp_region,
        score=chosen.score,
        action="route",
        latency_ms=latency_ms,
        was_cold=False,
        request_type=body.request_type,
        decision_id=decision.get("id"),
        corr_id=corr_id,
    )

    return RouteResponse(
        region=chosen.gcp_region,
        region_url=region_url,
        decision_id=str(decision.get("id", "")),
        score=chosen.score,
        reasons=chosen.reasons,
        alt_scores=[
            RouteAltScore(
                region_id=s.region_id,
                gcp_region=s.gcp_region,
                score=s.score,
                lat_norm=s.lat_norm,
                carbon_norm=s.carbon_norm,
                cost_norm=s.cost_norm,
            )
            for s in scored
        ],
        corr_id=corr_id,
    )
