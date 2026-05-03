"""FastAPI app entrypoint: wires routers, lifespan, CORS, correlation IDs.

Endpoints (all under /api/v1):
    POST /route                   — multi-objective region routing
    POST /forecast/tick           — forecaster + pre-warm cron
    GET  /decisions               — recent decisions (paginated)
    GET  /metrics/savings         — aggregated savings vs baseline
    GET  /regions                 — current region health view
    POST /weights                 — update routing weights (singleton)
    POST /sim/replay              — synthetic traffic replay simulator

Top-level:
    GET  /healthz                 — health (200 if DB reachable, else 503)
    GET  /                        — service identity ping
"""
from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncIterator

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .config import Settings, get_settings
from .db import PocketBaseClient, close_client, get_client, init_client
from .logging_setup import (
    configure_logging,
    get_correlation_id,
    get_logger,
    set_correlation_id,
)
from .prewarmer import router as prewarmer_router
from .regions_repo import (
    aggregate_savings,
    fetch_regions,
    fetch_weights,
    list_decisions,
    upsert_weights,
)
from .router import router as route_router
from .schemas import (
    HealthzResponse,
    RegionView,
    SavingsResponse,
    WeightsPayload,
    WeightsResponse,
)
from .sim import router as sim_router

logger = get_logger("pratidhwani.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.LOG_LEVEL, settings.SERVICE_NAME)
    logger.info("startup", env=settings.ENV, version=__version__, pb_url=settings.PB_URL)
    try:
        await init_client(settings)
    except Exception as e:  # noqa: BLE001
        # We start up even if PB is briefly unavailable so /healthz can
        # surface the failure to the orchestrator.
        logger.warning("pb_init_failed_at_startup", err=str(e))
    yield
    logger.info("shutdown")
    await close_client()


_WARM_HITS = 0  # in-process counter; observability for the demo

def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.LOG_LEVEL, settings.SERVICE_NAME)
    app = FastAPI(
        title="Pratidhwani API",
        version=__version__,
        description="Predictive carbon-aware serverless gateway. /docs for OpenAPI.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Correlation-ID"],
    )

    @app.middleware("http")
    async def correlation_middleware(request: Request, call_next):  # noqa: ANN001
        corr_id = request.headers.get("X-Correlation-ID") or uuid.uuid4().hex
        set_correlation_id(corr_id)
        t0 = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as e:  # noqa: BLE001
            latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
            logger.error(
                "request_failed",
                method=request.method,
                path=request.url.path,
                err=str(e),
                latency_ms=latency_ms,
                corr_id=corr_id,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "internal_error",
                        "message": "internal error",
                        "details": {"corr_id": corr_id},
                    }
                },
                headers={"X-Correlation-ID": corr_id},
            )
        latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        response.headers["X-Correlation-ID"] = corr_id
        logger.info(
            "request",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            latency_ms=latency_ms,
            corr_id=corr_id,
        )
        return response

    v1 = APIRouter(prefix="/api/v1")
    v1.include_router(route_router, tags=["routing"])
    v1.include_router(prewarmer_router, tags=["forecast"])
    v1.include_router(sim_router, tags=["simulator"])

    # ---- v1 GET / POST utility endpoints ----------------------------------

    @v1.get("/regions", response_model=list[RegionView], tags=["regions"])
    async def get_regions() -> list[RegionView]:
        client: PocketBaseClient = get_client()
        rows = await fetch_regions(client)
        out: list[RegionView] = []
        for r in rows:
            out.append(
                RegionView(
                    id=r["id"],
                    name=r.get("name", r.get("gcp_region", "")),
                    gcp_region=r.get("gcp_region", ""),
                    base_latency_ms=float(r.get("base_latency_ms", 100.0)),
                    price_per_million=float(r.get("price_per_million", 0.4)),
                    carbon_g_per_kwh=float(r.get("carbon_g_per_kwh", 400.0)),
                    last_seen=r.get("last_seen"),
                    last_p95_ms=(
                        float(r["last_p95_ms"])
                        if r.get("last_p95_ms") is not None
                        else None
                    ),
                )
            )
        return out

    @v1.get("/decisions", tags=["decisions"])
    async def get_decisions(
        since: str | None = Query(default=None, description="ISO 8601 timestamp"),
        page: int = Query(default=1, ge=1),
        per_page: int = Query(default=100, ge=1, le=500),
    ) -> dict:
        client: PocketBaseClient = get_client()
        return await list_decisions(client, since_iso=since, page=page, per_page=per_page)

    @v1.get("/metrics/savings", response_model=SavingsResponse, tags=["metrics"])
    async def metrics_savings() -> SavingsResponse:
        client: PocketBaseClient = get_client()
        agg = await aggregate_savings(client)
        return SavingsResponse(
            window_ts=datetime.now(timezone.utc).isoformat(),
            samples=int(agg["samples"]),
            cost_saved_pct=float(agg["cost_saved_pct"]),
            carbon_saved_pct=float(agg["carbon_saved_pct"]),
            cost_baseline=float(agg["cost_baseline"]),
            cost_ours=float(agg["cost_ours"]),
            carbon_baseline=float(agg["carbon_baseline"]),
            carbon_ours=float(agg["carbon_ours"]),
        )

    @v1.post("/weights", response_model=WeightsResponse, tags=["weights"])
    async def post_weights(
        body: WeightsPayload, settings: Settings = Depends(get_settings)
    ) -> WeightsResponse:
        s = body.w_lat + body.w_carbon + body.w_cost
        if s <= 0:
            raise HTTPException(status_code=400, detail="weights must sum > 0")
        client: PocketBaseClient = get_client()
        row = await upsert_weights(client, body.w_lat, body.w_carbon, body.w_cost)
        logger.info(
            "weights_updated",
            endpoint="/api/v1/weights",
            ts=datetime.now(timezone.utc).isoformat(),
            action="upsert_weights",
            w_lat=body.w_lat,
            w_carbon=body.w_carbon,
            w_cost=body.w_cost,
            corr_id=get_correlation_id(),
        )
        return WeightsResponse(
            w_lat=float(row.get("w_lat", body.w_lat)),
            w_carbon=float(row.get("w_carbon", body.w_carbon)),
            w_cost=float(row.get("w_cost", body.w_cost)),
            updated_ts=row.get("updated_ts"),
            record_id=row.get("id"),
        )

    @v1.get("/weights", response_model=WeightsResponse, tags=["weights"])
    async def get_weights_ep(settings: Settings = Depends(get_settings)) -> WeightsResponse:
        client: PocketBaseClient = get_client()
        weights, rec_id = await fetch_weights(client, settings)
        return WeightsResponse(
            w_lat=weights["w_lat"],
            w_carbon=weights["w_carbon"],
            w_cost=weights["w_cost"],
            record_id=rec_id,
        )

    app.include_router(v1)

    # ---- top-level ---------------------------------------------------------

    @app.get("/", tags=["meta"])
    async def root(settings: Settings = Depends(get_settings)) -> dict:
        return {
            "service": settings.SERVICE_NAME,
            "version": __version__,
            "env": settings.ENV,
            "docs": "/docs",
        }

    @app.get("/__warm", tags=["meta"])
    async def warm() -> dict:
        # Cheap, instance-warming hit invoked by the prewarmer cron.
        # 200 OK is the only contract; the body is informational for the demo.
        global _WARM_HITS
        _WARM_HITS += 1
        return {"warm": True, "hits": _WARM_HITS, "ts": datetime.now(timezone.utc).isoformat()}

    @app.get("/health", response_model=HealthzResponse, tags=["meta"])
    @app.get("/api/v1/health", response_model=HealthzResponse, tags=["meta"])
    @app.get("/healthz", response_model=HealthzResponse, tags=["meta"], include_in_schema=False)
    async def healthz(settings: Settings = Depends(get_settings)) -> HealthzResponse:
        try:
            client = get_client()
        except RuntimeError:
            raise HTTPException(status_code=503, detail="db client not initialised")
        ok = await client.health()
        if not ok:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "unhealthy",
                    "db": False,
                    "service": settings.SERVICE_NAME,
                    "env": settings.ENV,
                    "version": __version__,
                },
            )
        return HealthzResponse(
            status="ok",
            db=True,
            service=settings.SERVICE_NAME,
            env=settings.ENV,
            version=__version__,
        )

    return app


app = create_app()
