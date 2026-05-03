#!/usr/bin/env bash
# Deploys pratidhwani-api to Cloud Run.
#
# Required env:
#   PB_URL                 e.g. https://pratidhwani-db-XXXX-de.a.run.app
#   REGION_URLS_JSON       JSON map gcp_region -> Cloud Run URL
#   CORS_ORIGINS           comma list incl. the web service URL
#   GCP_PROJECT            your GCP project id
#
# Auth model: IAM only. The api uses Cloud Run's metadata server to fetch
# a Google identity token with the audience set to PB_URL, sends that as
# `Authorization: Bearer <id_token>` to the db. No PocketBase superuser,
# no Secret Manager dependency.
set -euo pipefail

REGION="${REGION:-asia-east1}"
SERVICE="${SERVICE:-pratidhwani-api}"
PROJECT="${GCP_PROJECT:?GCP_PROJECT must be set}"
PB_URL="${PB_URL:?PB_URL must be set to the pratidhwani-db Cloud Run URL}"
DEFAULT_REGION_URLS='{"asia-south1":"https://example.run.app","europe-west1":"https://example.run.app","us-central1":"https://example.run.app"}'
DEFAULT_DEFAULT_WEIGHTS='{"w_lat":0.4,"w_carbon":0.4,"w_cost":0.2}'
REGION_URLS_JSON="${REGION_URLS_JSON:-$DEFAULT_REGION_URLS}"
DEFAULT_WEIGHTS_JSON="${DEFAULT_WEIGHTS_JSON:-$DEFAULT_DEFAULT_WEIGHTS}"
CORS_ORIGINS="${CORS_ORIGINS:-*}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-pratidhwani-api-sa@${PROJECT}.iam.gserviceaccount.com}"

# Always run from this script's directory so --source=. uploads the api/ source.
cd "$(dirname "$0")"

echo ">> deploying ${SERVICE} to ${REGION} (project=${PROJECT})"

# Use a YAML env-vars file so JSON values with commas survive Cloud Run's parser.
ENV_FILE="$(mktemp /tmp/pratidhwani-api-env.XXXXXX.yaml)"
trap 'rm -f "${ENV_FILE}"' EXIT
cat >"${ENV_FILE}" <<YAML
PB_URL: "${PB_URL}"
REGION_URLS_JSON: '${REGION_URLS_JSON}'
DEFAULT_WEIGHTS_JSON: '${DEFAULT_WEIGHTS_JSON}'
CORS_ORIGINS: "${CORS_ORIGINS}"
AUTH_MODE: "gcp_id_token"
METADATA_AUDIENCE: "${PB_URL}"
ENV: "prod"
LOG_LEVEL: "INFO"
SERVICE_NAME: "${SERVICE}"
YAML

gcloud run deploy "${SERVICE}" \
  --project="${PROJECT}" \
  --region="${REGION}" \
  --source=. \
  --allow-unauthenticated \
  --service-account="${SERVICE_ACCOUNT}" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --concurrency=80 \
  --timeout=60 \
  --port=8080 \
  --env-vars-file="${ENV_FILE}"

echo ">> done. OpenAPI: $(gcloud run services describe ${SERVICE} --project=${PROJECT} --region=${REGION} --format='value(status.url)')/docs"
