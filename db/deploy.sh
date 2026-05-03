#!/usr/bin/env bash
# Deploy pratidhwani-db to Cloud Run.
# Idempotent: safe to re-run; creates only what's missing.
#
# Auth model: IAM-only. PocketBase has no superuser, no admin password,
# no Secret Manager dependency. Cloud Run --no-allow-unauthenticated is
# the single security gate; only the api service-account holds
# roles/run.invoker on this service. Collection rules are open ("") so
# any IAM-authenticated caller can read/write — that caller is always
# the api SA in production.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?PROJECT_ID must be set}"
REGION="${REGION:-asia-east1}"
SERVICE="${SERVICE:-pratidhwani-db}"
REPO="${REPO:-cloud-run-source-deploy}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${IMAGE_TAG}"
SA_NAME="${SA_NAME:-pratidhwani-db-sa}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

log() { printf '\033[1;36m[deploy]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[deploy]\033[0m %s\n' "$*" >&2; }

require() {
  command -v "$1" >/dev/null 2>&1 || { err "missing command: $1"; exit 1; }
}
require gcloud

cd "$(dirname "$0")"

log "project=${PROJECT_ID} region=${REGION} service=${SERVICE}"
gcloud config set project "${PROJECT_ID}" >/dev/null

# 1. APIs
log "ensuring required APIs are enabled"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project="${PROJECT_ID}" >/dev/null

# 2. Service account
if ! gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  log "creating service account ${SA_EMAIL}"
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="Pratidhwani DB runtime" \
    --project="${PROJECT_ID}"
else
  log "service account ${SA_EMAIL} exists"
fi

# 3. Artifact Registry repo
if ! gcloud artifacts repositories describe "${REPO}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  log "creating Artifact Registry repo ${REPO} in ${REGION}"
  gcloud artifacts repositories create "${REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Pratidhwani container images" \
    --project="${PROJECT_ID}"
fi

# 4. Build & push image
log "building image ${IMAGE} via Cloud Build"
gcloud builds submit \
  --tag="${IMAGE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  .

# 5. Deploy. IAM gates ingress; no secret, no admin env.
log "deploying ${SERVICE} to Cloud Run"
gcloud run deploy "${SERVICE}" \
  --image="${IMAGE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --service-account="${SA_EMAIL}" \
  --no-allow-unauthenticated \
  --ingress=all \
  --execution-environment=gen2 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=1 \
  --concurrency=80 \
  --port=8080 \
  --timeout=300 \
  --set-env-vars="TZ=Asia/Kolkata"

URL="$(gcloud run services describe "${SERVICE}" \
  --region="${REGION}" --project="${PROJECT_ID}" \
  --format='value(status.url)')"

log "deployed: ${URL}"
log "ingress=all but only roles/run.invoker holders are admitted; grant the api SA after deploy."
