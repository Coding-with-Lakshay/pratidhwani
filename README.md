# Pratidhwani — Predictive Carbon-Aware Serverless Gateway

**Capstone project** — Lakshay Sharma, GF202216641, B.Tech CSE Cloud Computing
Yogananda School of AI, Computers and Data Sciences, Shoolini University, Solan, H.P.
Capstone Mentor: **Dr. Kritika Rana**.

A drop-in HTTP gateway in front of multi-region Cloud Run services that
forecasts request bursts, pre-warms the right region, and routes each live
request via a multi-objective scorer (latency × grid carbon × spot price).

## Live demo

| Surface | URL |
|---|---|
| Dashboard | https://pratidhwani.dmj.one |
| Replay simulator | https://pratidhwani.dmj.one/sim |
| Pitch slide deck | https://pratidhwani.dmj.one/pitch |
| Capstone report | https://pratidhwani.dmj.one/report |

## Repository layout

```
.
├── SPEC.md            # the source of truth — read first
├── docs/              # literature review, BibTeX, design notes
├── db/                # pratidhwani-db Cloud Run service (PocketBase)
├── api/               # pratidhwani-api Cloud Run service (FastAPI)
├── web/               # pratidhwani-web Cloud Run service (Vite + React + nginx)
└── deploy/            # orchestration scripts
```

## Quick deploy (your own GCP project)

```bash
# Override defaults via env, never bake yours into the repo.
PROJECT_ID=<your-project>          \
REGION=asia-east1                  \
PB_ADMIN_EMAIL=<your-admin-email>  \
bash deploy/orchestrate.sh
```

Runs the three service deploys in dependency order: `db → api → web`.

The deploy script auto-creates everything it needs in **your** GCP project on
first run: a runtime service account per service, an Artifact Registry repo, a
Secret Manager entry that holds an auto-generated PocketBase admin password,
and the Cloud Run services themselves. Override any of those via env (see the
top of `db/deploy.sh` and `api/deploy.sh` for the full env-var matrix).

> **Privacy note.** This README intentionally does not list the upstream
> project ID, service-account emails, or Secret Manager entry name — they are
> all environment-driven and do not belong in a public document.

## What runs where

- All three services deploy to **Google Cloud Run** in your chosen region.
- `min-instances=0` on every service, so the system **costs nothing when idle**.
- DB persistence is intentionally **none**: PocketBase rebuilds the schema and
  reseeds the three demo regions on every cold start. Switch to a managed
  Postgres (Cloud SQL or AlloyDB Omni) for production decision-history.
- Custom domains: `asia-east1` supports Cloud Run domain mappings. After the
  orchestrator runs, point a CNAME for your subdomain at `ghs.googlehosted.com.`

## Local development

Each service has its own README under `db/`, `api/`, `web/`.

Made in India for #AatmnirbharBharat
