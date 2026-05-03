#!/usr/bin/env bash
# Pratidhwani web — Cloud Run deploy
#
# Required env: API_URL, PB_URL
# Optional env: PROJECT, REGION, SERVICE
set -euo pipefail

PROJECT="${PROJECT:-dmjone}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-pratidhwani-web}"

if [[ -z "${API_URL:-}" ]]; then
  echo "[deploy] ERROR: API_URL must be set (e.g. https://pratidhwani-api-xxxx-as.a.run.app)" >&2
  exit 1
fi
if [[ -z "${PB_URL:-}" ]]; then
  echo "[deploy] ERROR: PB_URL must be set (e.g. https://pratidhwani-db-xxxx-as.a.run.app)" >&2
  exit 1
fi

echo "[deploy] project=${PROJECT} region=${REGION} service=${SERVICE}"
echo "[deploy] API_URL=${API_URL}"
echo "[deploy] PB_URL=${PB_URL}"

gcloud run deploy "${SERVICE}" \
  --project="${PROJECT}" \
  --region="${REGION}" \
  --source=. \
  --allow-unauthenticated \
  --set-env-vars="API_URL=${API_URL},PB_URL=${PB_URL}" \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=200 \
  --port=8080 \
  --timeout=60s

URL="$(gcloud run services describe "${SERVICE}" \
  --project="${PROJECT}" --region="${REGION}" --format='value(status.url)')"

echo
echo "[deploy] done. Open: ${URL}"
echo "[deploy] routes: / /sim /pitch /report"
