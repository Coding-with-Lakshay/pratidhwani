# Pratidhwani — Predictive Carbon-Aware Serverless Gateway

**Capstone project** — Anshuman Mohanty, GF202217744, B.Tech CSE Cloud Computing
Yogananda School of AI, Computers and Data Sciences, Shoolini University, Solan, H.P.
Capstone Mentor: **Mr. Ashish**.

## Live demo

| Surface | URL |
|---|---|
| Dashboard | https://pratidhwani-web-azjqpkmlpa-el.a.run.app |
| Replay simulator | https://pratidhwani-web-azjqpkmlpa-el.a.run.app/sim |
| Pitch slide deck | https://pratidhwani-web-azjqpkmlpa-el.a.run.app/pitch |
| Capstone report | https://pratidhwani-web-azjqpkmlpa-el.a.run.app/report |
| API (OpenAPI) | https://pratidhwani-api-azjqpkmlpa-el.a.run.app/docs |
| DB admin | https://pratidhwani-db-azjqpkmlpa-el.a.run.app/_/ |

A drop-in HTTP gateway in front of multi-region Cloud Run services that
forecasts request bursts, pre-warms the right region, and routes each live
request via a multi-objective scorer (latency × grid carbon × spot price).

## Repository layout

```
.
├── SPEC.md            # the source of truth — read first
├── docs/              # literature review, BibTeX, design notes
├── db/                # pratidhwani-db Cloud Run service (PocketBase + GCS Fuse)
├── api/               # pratidhwani-api Cloud Run service (FastAPI)
├── web/               # pratidhwani-web Cloud Run service (Vite + React + nginx)
└── deploy/            # orchestration scripts
```

## Quick deploy (full stack)

```bash
bash deploy/orchestrate.sh
```

Runs the three service deploys in dependency order: `db → api → web`. The
final URL is printed at the end. Routes worth opening:

- `/`        — live dashboard
- `/sim`     — replay simulator
- `/pitch`   — slide deck (← / → / Esc / F)
- `/report`  — capstone report (printable to PDF)

## GCP context

- Project: `dmjone`
- Region:  `asia-south1`
- Artifact Registry: `cloud-run-source-deploy`
- DB persistence bucket: `gs://dmjone-pratidhwani-db`
- Service accounts:
  - `pratidhwani-db-sa@dmjone.iam.gserviceaccount.com` — runs DB, mounts bucket
  - `pratidhwani-api-sa@dmjone.iam.gserviceaccount.com` — runs API, invokes DB
  - `pratidhwani-web-sa@dmjone.iam.gserviceaccount.com` — runs web, invokes API
- Admin secret: `pratidhwani-pb-admin` (Secret Manager)

## Local development

Each service has its own README under `db/`, `api/`, `web/`.
