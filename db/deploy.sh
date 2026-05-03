#!/usr/bin/env bash
# Deploy pratidhwani-db to Cloud Run (asia-south1) with a GCS Fuse volume.
# Idempotent: safe to re-run; creates only what's missing.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-dmjone}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-pratidhwani-db}"
BUCKET="${BUCKET:-dmjone-pratidhwani-db}"
REPO="${REPO:-cloud-run-source-deploy}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:${IMAGE_TAG}"
ADMIN_EMAIL="${PB_ADMIN_EMAIL:-admin@dmj.one}"
SECRET_NAME="${SECRET_NAME:-pratidhwani-pb-admin}"
SA_NAME="${SA_NAME:-pratidhwani-db-sa}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

log() { printf '\033[1;36m[deploy]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[deploy]\033[0m %s\n' "$*" >&2; }

require() {
  command -v "$1" >/dev/null 2>&1 || { err "missing command: $1"; exit 1; }
}
require gcloud
require gsutil
require docker

cd "$(dirname "$0")"

log "project=${PROJECT_ID} region=${REGION} service=${SERVICE} bucket=${BUCKET}"
gcloud config set project "${PROJECT_ID}" >/dev/null

# 1. APIs
log "ensuring required APIs are enabled"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
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

# 3. GCS bucket (uniform access, asia-south1, no public access)
if ! gsutil ls -b "gs://${BUCKET}" >/dev/null 2>&1; then
  log "creating bucket gs://${BUCKET}"
  gsutil mb -p "${PROJECT_ID}" -l "${REGION}" -b on "gs://${BUCKET}"
  gsutil pap set enforced "gs://${BUCKET}"
  gsutil ubla set on "gs://${BUCKET}" || true
else
  log "bucket gs://${BUCKET} exists"
fi

log "granting storage.objectAdmin on gs://${BUCKET} to ${SA_EMAIL}"
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin" \
  --project="${PROJECT_ID}" >/dev/null

# 4. Artifact Registry repo
if ! gcloud artifacts repositories describe "${REPO}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  log "creating Artifact Registry repo ${REPO} in ${REGION}"
  gcloud artifacts repositories create "${REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Pratidhwani container images" \
    --project="${PROJECT_ID}"
fi

# 5. Secret Manager: admin password
if ! gcloud secrets describe "${SECRET_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  if [ -z "${PB_ADMIN_PASSWORD:-}" ]; then
    log "generating a 24-char admin password (only shown once)"
    PB_ADMIN_PASSWORD="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24 || true)"
    [ -n "${PB_ADMIN_PASSWORD}" ] || { err "failed to generate password"; exit 1; }
    printf '\033[1;33m[deploy] >> ADMIN PASSWORD: %s <<\033[0m\n' "${PB_ADMIN_PASSWORD}"
    printf '\033[1;33m[deploy] >> Save it now. It will not be shown again. <<\033[0m\n'
  fi
  log "creating secret ${SECRET_NAME}"
  printf '%s' "${PB_ADMIN_PASSWORD}" | gcloud secrets create "${SECRET_NAME}" \
    --data-file=- \
    --replication-policy=automatic \
    --project="${PROJECT_ID}"
else
  log "secret ${SECRET_NAME} exists (use 'gcloud secrets versions add' to rotate)"
fi

gcloud secrets add-iam-policy-binding "${SECRET_NAME}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}" >/dev/null

# 6. Build & push image (Cloud Build = no local docker daemon needed)
log "building image ${IMAGE} via Cloud Build"
gcloud builds submit \
  --tag="${IMAGE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  .

# 7. Deploy to Cloud Run
log "deploying ${SERVICE} to Cloud Run"
gcloud run deploy "${SERVICE}" \
  --image="${IMAGE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --service-account="${SA_EMAIL}" \
  --no-allow-unauthenticated \
  --ingress=internal \
  --execution-environment=gen2 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=1 \
  --max-instances=1 \
  --concurrency=80 \
  --port=8080 \
  --timeout=300 \
  --add-volume="name=pb-data,type=cloud-storage,bucket=${BUCKET}" \
  --add-volume-mount="volume=pb-data,mount-path=/pb_data" \
  --set-env-vars="PB_ADMIN_EMAIL=${ADMIN_EMAIL},TZ=Asia/Kolkata" \
  --set-secrets="PB_ADMIN_PASSWORD=${SECRET_NAME}:latest"

URL="$(gcloud run services describe "${SERVICE}" \
  --region="${REGION}" --project="${PROJECT_ID}" \
  --format='value(status.url)')"

log "deployed: ${URL}"
log "admin UI: ${URL}/_/  (requires Cloud Run invoker auth + PB superuser login)"
log "admin email: ${ADMIN_EMAIL}"
log "rotate password: gcloud secrets versions add ${SECRET_NAME} --data-file=<(printf '%s' '<new-pw>') --project=${PROJECT_ID}"
