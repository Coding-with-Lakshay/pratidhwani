#!/usr/bin/env bash
# End-to-end smoke test against the deployed Pratidhwani stack.
# Usage: bash deploy/smoke.sh
set -euo pipefail

PROJECT="${PROJECT:-dmjone}"
REGION="${REGION:-asia-south1}"

WEB_URL=$(gcloud run services describe pratidhwani-web --region="$REGION" --project="$PROJECT" --format='value(status.url)')
API_URL=$(gcloud run services describe pratidhwani-api --region="$REGION" --project="$PROJECT" --format='value(status.url)')
DB_URL=$(gcloud run services describe pratidhwani-db  --region="$REGION" --project="$PROJECT" --format='value(status.url)')

ID_TOKEN=$(gcloud auth print-identity-token)

step() { printf '\n\033[1;33m[smoke]\033[0m %s\n' "$*"; }
ok()   { printf '  \033[1;32mOK\033[0m %s\n' "$*"; }
fail() { printf '  \033[1;31mFAIL\033[0m %s\n' "$*"; exit 1; }

step "WEB: dashboard 200"
http_code=$(curl -s -o /dev/null -w '%{http_code}' "$WEB_URL/")
[[ "$http_code" == "200" ]] && ok "/" || fail "web / -> $http_code"

step "WEB: /pitch 200"
http_code=$(curl -s -o /dev/null -w '%{http_code}' "$WEB_URL/pitch")
[[ "$http_code" == "200" ]] && ok "/pitch" || fail "web /pitch -> $http_code"

step "WEB: /report 200"
http_code=$(curl -s -o /dev/null -w '%{http_code}' "$WEB_URL/report")
[[ "$http_code" == "200" ]] && ok "/report" || fail "web /report -> $http_code"

step "API: /health 200"
http_code=$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/health")
[[ "$http_code" == "200" ]] && ok "/health" || fail "api /health -> $http_code"

step "API: /api/v1/regions returns 3"
n=$(curl -s "$API_URL/api/v1/regions" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))')
[[ "$n" -ge "3" ]] && ok "$n regions" || fail "regions count $n"

step "API: /api/v1/route returns chosen region"
out=$(curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"request_type":"light","payload_size":256}' "$API_URL/api/v1/route")
echo "$out" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d.get("region"), d; print("  chose:", d["region"])'
ok "route"

echo
echo "All smoke checks passed."
echo "Open: $WEB_URL/pitch"
