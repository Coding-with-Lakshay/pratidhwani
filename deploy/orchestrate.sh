#!/usr/bin/env bash
# Pratidhwani end-to-end Cloud Run deployment orchestrator.
# Usage: bash deploy/orchestrate.sh [--skip-db] [--skip-api] [--skip-web]
set -euo pipefail

PROJECT="${PROJECT:-dmjone}"
REGION="${REGION:-asia-south1}"
DB_NAME="${DB_NAME:-pratidhwani-db}"
API_NAME="${API_NAME:-pratidhwani-api}"
WEB_NAME="${WEB_NAME:-pratidhwani-web}"
DB_BUCKET="${DB_BUCKET:-dmjone-pratidhwani-db}"
PB_ADMIN_SECRET="${PB_ADMIN_SECRET:-pratidhwani-pb-admin}"

DB_SA="pratidhwani-db-sa@${PROJECT}.iam.gserviceaccount.com"
API_SA="pratidhwani-api-sa@${PROJECT}.iam.gserviceaccount.com"
WEB_SA="pratidhwani-web-sa@${PROJECT}.iam.gserviceaccount.com"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

skip_db=0; skip_api=0; skip_web=0
for arg in "$@"; do
  case "$arg" in
    --skip-db)  skip_db=1  ;;
    --skip-api) skip_api=1 ;;
    --skip-web) skip_web=1 ;;
    *) echo "unknown arg: $arg"; exit 2 ;;
  esac
done

log() { printf '\n\033[1;36m[orchestrate]\033[0m %s\n' "$*"; }

############################
# 1) DB (PocketBase + GCS Fuse)
############################
DB_URL=""
if (( skip_db == 0 )); then
  log "Deploying ${DB_NAME}..."
  PROJECT="$PROJECT" REGION="$REGION" SERVICE="$DB_NAME" BUCKET="$DB_BUCKET" \
    SERVICE_ACCOUNT="$DB_SA" PB_ADMIN_SECRET="$PB_ADMIN_SECRET" \
    bash "$ROOT/db/deploy.sh"
fi
DB_URL=$(gcloud run services describe "$DB_NAME" --region="$REGION" --project="$PROJECT" --format='value(status.url)')
log "DB URL: $DB_URL"

# Allow API SA to invoke DB
gcloud run services add-iam-policy-binding "$DB_NAME" \
  --region="$REGION" --project="$PROJECT" \
  --member="serviceAccount:$API_SA" \
  --role="roles/run.invoker" >/dev/null

############################
# 2) API (FastAPI)
############################
API_URL=""
if (( skip_api == 0 )); then
  log "Deploying ${API_NAME}..."
  PROJECT="$PROJECT" REGION="$REGION" SERVICE="$API_NAME" \
    SERVICE_ACCOUNT="$API_SA" PB_URL="$DB_URL" \
    bash "$ROOT/api/deploy.sh"
fi
API_URL=$(gcloud run services describe "$API_NAME" --region="$REGION" --project="$PROJECT" --format='value(status.url)')
log "API URL: $API_URL"

# Allow Web SA to invoke API
gcloud run services add-iam-policy-binding "$API_NAME" \
  --region="$REGION" --project="$PROJECT" \
  --member="serviceAccount:$WEB_SA" \
  --role="roles/run.invoker" >/dev/null

############################
# 3) WEB (Vite + nginx)
############################
WEB_URL=""
if (( skip_web == 0 )); then
  log "Deploying ${WEB_NAME}..."
  PROJECT="$PROJECT" REGION="$REGION" SERVICE="$WEB_NAME" \
    SERVICE_ACCOUNT="$WEB_SA" API_URL="$API_URL" PB_URL="$DB_URL" \
    bash "$ROOT/web/deploy.sh"
fi
WEB_URL=$(gcloud run services describe "$WEB_NAME" --region="$REGION" --project="$PROJECT" --format='value(status.url)')

cat <<EOF

============================================================
  Pratidhwani is live
------------------------------------------------------------
  Dashboard : ${WEB_URL}/
  Simulator : ${WEB_URL}/sim
  Pitch     : ${WEB_URL}/pitch
  Report    : ${WEB_URL}/report
  API       : ${API_URL} (auth required)
  DB admin  : ${DB_URL}/_/      (auth required)
============================================================
EOF
