# pratidhwani-api

FastAPI gateway, forecaster, scorer and decision logger for **Pratidhwani**.
Runs on Cloud Run, talks to PocketBase (`pratidhwani-db`).

## Endpoints (`/api/v1/...`)

| Method | Path                | Purpose                                                  |
|--------|---------------------|----------------------------------------------------------|
| POST   | `/route`            | Multi-objective region routing (lat / carbon / cost)     |
| POST   | `/forecast/tick`    | Forecast next-tick QPS per region; pre-warm where needed |
| GET    | `/decisions`        | Recent routing decisions (paginated)                     |
| GET    | `/metrics/savings`  | Aggregated savings vs round-robin baseline               |
| GET    | `/regions`          | Region health view (latency, carbon, price)              |
| GET    | `/weights`          | Current routing weights                                  |
| POST   | `/weights`          | Update routing weights (singleton)                       |
| POST   | `/sim/replay`       | Synthetic traffic replay simulator                       |
| GET    | `/healthz`          | Health probe (200 ok / 503 if DB unreachable)            |
| GET    | `/`                 | Service identity                                         |
| GET    | `/docs`             | OpenAPI Swagger UI                                       |
| GET    | `/openapi.json`     | OpenAPI schema                                           |

Every response includes an `X-Correlation-ID` header. Send your own with the
same header on the request to thread it through logs.

## Environment variables

| Var                       | Default                                | Notes |
|---------------------------|----------------------------------------|-------|
| `PB_URL`                  | `http://127.0.0.1:8090`                | PocketBase base URL |
| `PB_ADMIN_TOKEN`          | empty                                  | Static superuser JWT (admin auth) |
| `PB_ADMIN_EMAIL`          | empty                                  | Fallback if token absent |
| `PB_ADMIN_PASSWORD`       | empty                                  | Fallback if token absent |
| `PB_TIMEOUT_S`            | `5.0`                                  | per-request timeout |
| `PB_RETRY_MAX`            | `4`                                    | max retry attempts |
| `AUTH_MODE`               | `admin`                                | `admin` / `gcp_id_token` / `none` |
| `METADATA_AUDIENCE`       | empty (defaults to `PB_URL`)           | Audience for GCP id_token |
| `REGION_URLS_JSON`        | demo map                                | JSON: `{"asia-south1":"https://..."}` |
| `DEFAULT_WEIGHTS_JSON`    | `{"w_lat":0.4,"w_carbon":0.4,"w_cost":0.2}` | Per-tenant overrides via /weights |
| `FORECAST_WINDOW_TICKS`   | `120`                                  | 60 min @ 30s |
| `FORECAST_TICK_SECONDS`   | `30`                                   | tick cadence |
| `PREWARM_BUDGET_PER_TICK` | `3`                                    | max warms per tick |
| `PREWARM_TRIGGER_QPS`     | `2.0`                                  | warm if predicted_qps >= this AND ci_low > 0 |
| `FEATURE_CARBON_API_URL`  | empty                                  | Optional carbon-intensity API |
| `FEATURE_CARBON_API_KEY`  | empty                                  | API key for above |
| `CORS_ORIGINS`            | `*`                                    | Comma list (`*` allows all) |
| `LOG_LEVEL`               | `INFO`                                 | DEBUG / INFO / WARNING |
| `ENV`                     | `dev`                                  | dev / staging / prod |
| `SERVICE_NAME`            | `pratidhwani-api`                      | for log enrichment |

## Run locally

```bash
cd api
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
export PB_URL=http://127.0.0.1:8090
export PB_ADMIN_EMAIL=admin@example.com
export PB_ADMIN_PASSWORD=admin12345
export AUTH_MODE=admin
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Then open <http://localhost:8080/docs>.

## Run with Docker

```bash
docker build -t pratidhwani-api:dev .
docker run --rm -p 8080:8080 \
  -e PB_URL=http://host.docker.internal:8090 \
  -e PB_ADMIN_EMAIL=admin@example.com \
  -e PB_ADMIN_PASSWORD=admin12345 \
  pratidhwani-api:dev
```

## Tests

Unit tests run with stdlib only:

```bash
pytest tests/ -k "not integration" -q
```

Integration tests boot a real PocketBase via `docker compose`:

```bash
docker compose -f tests/docker-compose.yml up -d
pytest tests/ -q
docker compose -f tests/docker-compose.yml down -v
```

## Deploy

```bash
PB_URL=https://pratidhwani-db-XXXX-as.a.run.app \
REGION_URLS_JSON='{"asia-south1":"https://...","europe-west1":"https://...","us-central1":"https://..."}' \
CORS_ORIGINS='https://pratidhwani-web-XXXX-as.a.run.app' \
GCP_PROJECT=dmjone \
./deploy.sh
```

## Observability

All logs are JSON, one per line (Cloud Logging native). Common fields:
`ts`, `corr_id`, `service`, `endpoint`, `region`, `score`, `action`,
`latency_ms`, `was_cold`, `level`, `logger`, `event`.

`/healthz` returns `503` when PocketBase is unreachable so Cloud Run can
mark the revision unhealthy.
