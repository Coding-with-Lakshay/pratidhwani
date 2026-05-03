# pratidhwani-db

PocketBase v0.37.5 backing store for the Pratidhwani gateway.
Single-binary Go app, embedded SQLite, served from a GCS Fuse volume on Cloud Run.

```
   Cloud Run service "pratidhwani-db" (asia-south1)
   |- internal-only ingress, IAM-gated (--no-allow-unauthenticated)
   |- min-instances=1, max-instances=1   (SQLite is single-writer)
   |- /pb_data  -> GCS Fuse mount of  gs://<your-project>-pratidhwani-db
   |- /api/*    -> PocketBase REST + realtime
   `- /_/       -> PocketBase admin UI (PB superuser login)
```

## Files

| Path | Purpose |
|---|---|
| `Dockerfile` | Alpine 3.21 image, SHA-pinned PocketBase download. |
| `entrypoint.sh` | Bootstraps superuser, applies JS migrations, seeds regions, runs `pocketbase serve`. |
| `pb_migrations/1700000000_init.js` | Schema for `regions`, `decisions`, `forecasts`, `weights`, `savings_baseline` and indexes. |
| `pb_seed/regions.json` | Three-region seed (asia-south1, europe-west1, us-central1). Inserted on first boot only. |
| `deploy.sh` | One-shot deployer: enables APIs, creates SA, bucket, secret, AR repo, Cloud Build image, and Cloud Run service. |

## Schema

| Collection | Key fields | Indexes |
|---|---|---|
| `regions` | `gcp_region` (unique), `base_latency_ms`, `price_per_million`, `carbon_g_per_kwh`, `last_seen` | `idx_regions_gcp_region` UNIQUE |
| `decisions` | `ts`, `request_type`, `chosen_region`, `score`, `alt_scores_json`, `latency_observed_ms`, `was_cold`, `trace_id` | `idx_decisions_ts`, `idx_decisions_region_ts` |
| `forecasts` | `ts`, `region`, `predicted_qps`, `ci_low`, `ci_high`, `action_taken` | `idx_forecasts_ts_region`, `idx_forecasts_region_ts` |
| `weights` | `w_lat`, `w_carbon`, `w_cost`, `updated_ts` (singleton row) | none |
| `savings_baseline` | `ts`, `baseline_cost`, `our_cost`, `baseline_carbon`, `our_carbon` | `idx_savings_ts` |

API rules on every collection:
- `listRule` / `viewRule` = `""` (any caller that already passed the internal-ingress + IAM check can read).
- `createRule` / `updateRule` / `deleteRule` = `null` (PB superuser only). The `pratidhwani-api` service authenticates as the bootstrap superuser to perform writes.

## Deploy

```bash
# from the repo root
PROJECT_ID=<your-project> bash db/deploy.sh
```

`deploy.sh` is idempotent. First run prints the generated admin password once. Save it; afterwards retrieve it from Secret Manager:

```bash
gcloud secrets versions access latest --secret=<your-secret> --project=<your-project>
```

To override the email or password before the first deploy:

```bash
PB_ADMIN_EMAIL=ops@dmj.one PB_ADMIN_PASSWORD='your-pw' bash db/deploy.sh
```

## Access the admin UI

The service has `--no-allow-unauthenticated` and `--ingress=internal`. To open the admin UI from your laptop, use a Cloud Run-authenticated proxy:

```bash
gcloud run services proxy pratidhwani-db --region=asia-south1 --project=<your-project> --port=8787
```

Then browse to <http://127.0.0.1:8787/_/> and log in with `PB_ADMIN_EMAIL` + the secret value.

## Rotate the admin password

```bash
NEW_PW="$(openssl rand -base64 24 | tr -d '+/=' | head -c 24)"
printf '%s' "$NEW_PW" | gcloud secrets versions add <your-secret> \
  --data-file=- --project=<your-project>
gcloud run services update pratidhwani-db \
  --region=asia-south1 --project=<your-project> \
  --set-secrets=PB_ADMIN_PASSWORD=<your-secret>:latest
```

`entrypoint.sh` runs `pocketbase superuser upsert` on every cold start, so the new password is applied to the existing superuser record automatically.

## Why min-instances=1 and max-instances=1

PocketBase wraps SQLite. SQLite supports only one writer at a time. Cloud Run can spawn additional instances for concurrency, but a second instance would corrupt the WAL on the GCS Fuse-mounted DB. We pin the service to exactly one warm instance:

- `--min-instances=1` keeps the SQLite WAL hot (no cold-boot replay) and avoids GCS Fuse mount latency on first request.
- `--max-instances=1` guarantees no second writer ever exists.
- `--concurrency=80` lets that one instance handle bursty read traffic from the api service.

This is also why the api service must be the only writer.

## Logs and observability

Every line emitted by `entrypoint.sh` is structured JSON `{ts,severity,service,msg}`, ingested by Cloud Logging without parsing. PocketBase's own access log goes to stdout in its native format and is scraped by the Cloud Run logging agent under the same `pratidhwani-db` resource.

```bash
gcloud run services logs read pratidhwani-db --region=asia-south1 --project=<your-project> --limit=50
```

## Local smoke test

```bash
docker build -t pratidhwani-db:dev .
docker run --rm -it -p 8080:8080 \
  -e PB_ADMIN_EMAIL=admin@local.test \
  -e PB_ADMIN_PASSWORD=changeme123 \
  -v "$(pwd)/.local-pb-data:/pb_data" \
  pratidhwani-db:dev
# admin: http://127.0.0.1:8080/_/
# health: http://127.0.0.1:8080/api/health
# regions: curl http://127.0.0.1:8080/api/collections/regions/records
```

The seed runs once; deleting `.local-pb-data` triggers a fresh schema + seed.

## Versions

- PocketBase: `v0.37.5` (linux_amd64), SHA256 `8faf6fc372604c62a20450daadbbe83b090e191a9784ff0eb1fb361d288fdb98`. Pinned in `Dockerfile`.
- Base image: `alpine:3.21`.
- Cloud Run gen2 (required for GCS Fuse volume mounts).
