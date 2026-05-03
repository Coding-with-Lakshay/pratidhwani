#!/bin/sh
# Pratidhwani DB entrypoint.
#  1. ensure /pb_data is writable (GCS Fuse mount)
#  2. upsert the initial superuser from PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD
#  3. run JS migrations (pocketbase serve auto-applies pb_migrations/*.js)
#  4. exec `pocketbase serve` on $PORT
#  5. background task: when server is up, seed regions if empty
set -eu

PORT="${PORT:-8080}"
PB_DATA_DIR="${PB_DATA_DIR:-/pb_data}"
PB_MIGRATIONS_DIR="${PB_MIGRATIONS_DIR:-/app/pb_migrations}"
PB_SEED_DIR="${PB_SEED_DIR:-/app/pb_seed}"
PB_QUERY_TIMEOUT="${PB_QUERY_TIMEOUT:-30}"
PB_HTTP_ADDR="0.0.0.0:${PORT}"

log() {
  printf '{"ts":"%s","severity":"%s","service":"pratidhwani-db","msg":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2"
}

if [ -z "${PB_ADMIN_EMAIL:-}" ] || [ -z "${PB_ADMIN_PASSWORD:-}" ]; then
  log "ERROR" "PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set (use --set-secrets in deploy)"
  exit 1
fi

mkdir -p "${PB_DATA_DIR}"
if ! [ -w "${PB_DATA_DIR}" ]; then
  log "ERROR" "PB_DATA_DIR ${PB_DATA_DIR} is not writable - check GCS Fuse mount"
  exit 1
fi

# Idempotent superuser bootstrap. `superuser upsert` creates if missing,
# updates the password otherwise. Safe to run on every cold start.
log "INFO" "upserting superuser ${PB_ADMIN_EMAIL}"
pocketbase superuser upsert \
  "${PB_ADMIN_EMAIL}" "${PB_ADMIN_PASSWORD}" \
  --dir "${PB_DATA_DIR}" \
  --migrationsDir "${PB_MIGRATIONS_DIR}" \
  >/tmp/pb_su.log 2>&1 || {
    log "ERROR" "superuser upsert failed: $(tr -d '\n' </tmp/pb_su.log)"
    exit 1
  }

# Background seeder runs after the server starts.
seed_regions() {
  i=0
  while [ $i -lt 60 ]; do
    if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
      break
    fi
    i=$((i + 1)); sleep 1
  done
  if [ $i -ge 60 ]; then
    log "WARN" "seed: server did not become healthy in 60s, skipping"
    return 0
  fi

  TOKEN_RESP="$(curl -fsS -X POST \
    -H "Content-Type: application/json" \
    -d "{\"identity\":\"${PB_ADMIN_EMAIL}\",\"password\":\"${PB_ADMIN_PASSWORD}\"}" \
    "http://127.0.0.1:${PORT}/api/collections/_superusers/auth-with-password" 2>/dev/null || echo '')"
  TOKEN="$(printf '%s' "${TOKEN_RESP}" | jq -r '.token // empty')"
  if [ -z "${TOKEN}" ]; then
    log "WARN" "seed: superuser auth failed, skipping"
    return 0
  fi

  COUNT="$(curl -fsS \
    -H "Authorization: ${TOKEN}" \
    "http://127.0.0.1:${PORT}/api/collections/regions/records?perPage=1&fields=id" \
    | jq -r '.totalItems // 0' 2>/dev/null || echo 0)"

  if [ "${COUNT}" != "0" ]; then
    log "INFO" "seed: regions already populated (${COUNT} rows), skipping"
    return 0
  fi

  if [ ! -f "${PB_SEED_DIR}/regions.json" ]; then
    log "WARN" "seed: ${PB_SEED_DIR}/regions.json missing, skipping"
    return 0
  fi

  log "INFO" "seed: inserting regions from ${PB_SEED_DIR}/regions.json"
  jq -c '.[]' "${PB_SEED_DIR}/regions.json" | while IFS= read -r row; do
    HTTP_CODE="$(curl -s -o /tmp/seed_resp -w '%{http_code}' \
      -X POST \
      -H "Authorization: ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "${row}" \
      "http://127.0.0.1:${PORT}/api/collections/regions/records" || echo 000)"
    NAME="$(printf '%s' "${row}" | jq -r '.gcp_region')"
    if [ "${HTTP_CODE}" = "200" ] || [ "${HTTP_CODE}" = "201" ]; then
      log "INFO" "seed: inserted region ${NAME}"
    else
      log "ERROR" "seed: region ${NAME} insert failed (http=${HTTP_CODE} body=$(tr -d '\n' </tmp/seed_resp))"
    fi
  done
}

seed_regions &

log "INFO" "starting pocketbase serve on ${PB_HTTP_ADDR}"
exec pocketbase serve \
  --http="${PB_HTTP_ADDR}" \
  --dir="${PB_DATA_DIR}" \
  --migrationsDir="${PB_MIGRATIONS_DIR}" \
  --queryTimeout="${PB_QUERY_TIMEOUT}"
