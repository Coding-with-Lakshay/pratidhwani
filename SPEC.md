# Pratidhwani — Predictive Carbon-Aware Serverless Gateway
**Capstone**: Lakshay Sharma (GF202216641), B.Tech CSE Cloud Computing
**Tagline**: Pre-echoes your traffic. Slashes cold-starts, cost, and carbon.

## Two research gaps addressed

### Gap 1 — Adaptive multi-signal cold-start mitigation
Current production cold-start mitigations (FaaSnap, IceBreaker, INFless, RainbowCake, AQUATOPE, LowCarb) optimize **per function in a single region with static or short-window predictors**. They ignore (a) combined temporal + geo + tenant-class signals, (b) confidence-weighted warming budgets, and (c) cross-function pattern transfer. See `docs/literature.md` for full citations.
- **Sub-gap 1a — Confidence-weighted warming budgets.** Predictors are binary or top-k. AQUATOPE [7] is the only one that reasons about uncertainty, and only inside one workflow. Pratidhwani's `score = forecast_confidence × latency_cost_product` thresholding is novel.
- **Sub-gap 1b — Cross-function transfer.** Every prior policy trains per function. Multi-Level Container Reuse [9] hints at sharing across "similar" functions but never transfers prediction *models* across tenant cohorts.

### Gap 2 — Multi-objective request-level routing on FaaS
Carbon-aware scheduling has matured for batch (Carbon Explorer, Let's Wait Awhile) and recently for serverless function placement (GreenCourier, CASA, EcoLife, LowCarb) and geo-distributed web services (CASPER). **No published system simultaneously honors p95 latency budget + grid carbon intensity + regional spot price at per-request granularity** for live FaaS traffic across regions.
- **Sub-gap 2a — Three-objective live router.** Carbon-aware FaaS work consistently drops one of the three (cost: CASPER, EcoLife, LowCarb; latency budget: GreenCourier; multi-region: CASA).
- **Sub-gap 2b — Coupling routing to forecast-driven warming.** None couples the request-level routing decision back into a *predictive* warming budget; routing and warming are independent loops, so a router that picks a low-carbon region pays a cold-start tax that a forecast-aware warmer could have eliminated.

## Solution: Pratidhwani-Gateway
A drop-in HTTP gateway sitting in front of multi-region Cloud Run services. Three jobs:
1. **Forecast** per-region request load with Holt-Winters + EWMA blend; emit confidence interval.
2. **Pre-warm** target region with calibrated ping budget when forecast confidence × latency-cost-product crosses threshold.
3. **Route** each live request via a multi-objective scorer:
   `score(r) = w_lat * p95_norm(r) + w_carbon * carbon_norm(r) + w_cost * price_norm(r)`
   Weights are tenant-tunable from the dashboard.

Every decision is logged to the DB; dashboard renders live counters: cold-starts averted, gCO₂ saved, ₹/$ saved, p95 reduction.

## Architecture — three Cloud Run services in `asia-east1`

| Service | Tech | Role |
|---|---|---|
| `pratidhwani-db` | PocketBase 0.22 (Go binary, SQLite) + GCS Fuse volume | Persistent DB, REST + admin UI |
| `pratidhwani-api` | FastAPI (Python 3.12), uvicorn, statsmodels | Forecaster, scorer, gateway, decision logger |
| `pratidhwani-web` | Vite + React + TS, served by nginx | Dashboard, `/pitch` slide deck, `/report` capstone report |

All three deployed in `<your-project>` GCP project, region `asia-east1`. Public ingress on web; api+db ingress restricted to authenticated invokers (via service account).

## Functional MVP scope

- **Three simulated regions** (asia-south1 Mumbai, europe-west1 Belgium, us-central1 Iowa) — synthetic latency + real grid carbon intensity (static lookup from public Electricity Maps daily snapshot; falls back to demo table) + real Cloud Run pricing. The physical Cloud Run services are themselves deployed in `asia-east1` (Taiwan); the simulated regions represent the logical multi-region routing decisions Pratidhwani would make in production.
- **Forecast horizon**: 5-minute lookahead, 30-second tick.
- **Pre-warm action**: synthetic GET /__warm with byte budget tracker.
- **Request types**: `light` (10–50ms work), `heavy` (200–800ms), `gpu-mock` (1–3s).
- **Replay mode**: dashboard can replay 24h of synthetic Wikipedia-like diurnal traffic to demonstrate savings vs naive round-robin.

## Routes (frontend)
- `/` — live dashboard (counters, region map, decision feed, savings)
- `/sim` — replay simulator (load synthetic traffic, watch decisions)
- `/pitch` — web slide deck, arrow-key navigable, Esc for overview
- `/report` — full capstone report rendered as printable HTML
- `/admin` — link to PocketBase admin (auth-gated)

## Routes (backend) — `/api/v1/...`
- `POST /route` — body: `{request_type, payload_size}` → returns `{region, region_url, decision_id, score, reasons[]}`
- `POST /forecast/tick` — internal cron; runs forecaster and writes pre-warm intents
- `GET /decisions?since=...` — recent routing decisions (paginated)
- `GET /metrics/savings` — aggregated savings vs round-robin baseline
- `GET /regions` — current region health (latency, carbon gCO₂/kWh, price/req)
- `POST /weights` — update routing weights `{w_lat, w_carbon, w_cost}`
- `GET /healthz` — health probe

## DB schema (PocketBase collections)
- `regions` — id, name, gcp_region, base_latency_ms, price_per_million, carbon_g_per_kwh, last_seen
- `decisions` — ts, request_type, chosen_region, score, alt_scores_json, latency_observed_ms, was_cold
- `forecasts` — ts, region, predicted_qps, ci_low, ci_high, action_taken
- `weights` — singleton; w_lat, w_carbon, w_cost, updated_ts
- `savings_baseline` — ts, baseline_cost, our_cost, baseline_carbon, our_carbon

## Deploy targets
- `pratidhwani-db.run.app` — internal-only ingress, GCS bucket `<your-project>-pratidhwani-db` mounted at `/pb_data`
- `pratidhwani-api.run.app` — internal-only ingress to web; calls db
- `pratidhwani-web.run.app` — public ingress, the URL Lakshay shares

## Implementation conventions
- WCAG 2.2 AAA, RTL-safe, Hindi+English baseline copy on /pitch
- Verbose structured JSON logs with correlation IDs (trace each /route end-to-end)
- TLS 1.3 by default (Cloud Run); CSP, HSTS, SRI on web
- Quantum-secure: Cloud Run already terminates TLS with hybrid PQ where supported; service-to-service uses Google-managed certs
- No mocks in tests; integration tests run against ephemeral Cloud Run revisions

## Demo URL plan
Final shareable URL: `https://pratidhwani-web-<hash>-as.a.run.app`
Aliases: `/`, `/sim`, `/pitch`, `/report`, `/admin`.
