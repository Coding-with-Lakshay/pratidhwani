#!/bin/sh
# Pratidhwani DB entrypoint.
#  1. ensure /pb_data is writable (ephemeral container disk)
#  2. exec `pocketbase serve` on $PORT — auto-applies pb_migrations/*.js
#  3. background task: when server is up, seed regions if empty (collection
#     rules are open to internal callers, so no auth is needed; Cloud Run
#     IAM is the single security gate).
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

mkdir -p "${PB_DATA_DIR}"
if ! [ -w "${PB_DATA_DIR}" ]; then
  log "ERROR" "PB_DATA_DIR ${PB_DATA_DIR} is not writable"
  exit 1
fi

# Background seeder — open writes mean no token needed.
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

  COUNT="$(curl -fsS \
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
