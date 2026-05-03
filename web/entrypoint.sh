#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${API_URL:?API_URL must be set}"
: "${PB_URL:=}"

# envsubst variables we explicitly allow into the template
export PORT API_URL PB_URL

envsubst '${PORT} ${API_URL} ${PB_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

# Quick syntax check before launching
nginx -t

exec nginx -g 'daemon off;'
