# syntax=docker/dockerfile:1.7
# Pratidhwani DB - PocketBase on Cloud Run with GCS Fuse persistence.
# Single-instance, single-writer SQLite served at /pb_data (GCS-backed volume).

ARG PB_VERSION=0.37.5
ARG PB_SHA256=8faf6fc372604c62a20450daadbbe83b090e191a9784ff0eb1fb361d288fdb98

FROM alpine:3.21 AS fetch
ARG PB_VERSION
ARG PB_SHA256
RUN apk add --no-cache curl unzip ca-certificates \
 && curl -fsSL -o /tmp/pb.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
 && echo "${PB_SHA256}  /tmp/pb.zip" | sha256sum -c - \
 && unzip -q /tmp/pb.zip -d /pb \
 && chmod +x /pb/pocketbase \
 && rm /tmp/pb.zip

FROM alpine:3.21
ARG PB_VERSION
LABEL org.opencontainers.image.title="pratidhwani-db" \
      org.opencontainers.image.description="PocketBase ${PB_VERSION} backing store for Pratidhwani gateway" \
      org.opencontainers.image.source="https://github.com/pocketbase/pocketbase" \
      org.opencontainers.image.licenses="MIT"

RUN apk add --no-cache ca-certificates curl jq tini tzdata \
 && addgroup -S pb && adduser -S -G pb -h /home/pb pb \
 && mkdir -p /pb_data /app/pb_migrations /app/pb_seed \
 && chown -R pb:pb /pb_data /app

COPY --from=fetch /pb/pocketbase /usr/local/bin/pocketbase
COPY pb_migrations/ /app/pb_migrations/
COPY pb_seed/      /app/pb_seed/
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
 && chown -R pb:pb /app

ENV PB_DATA_DIR=/pb_data \
    PB_MIGRATIONS_DIR=/app/pb_migrations \
    PB_SEED_DIR=/app/pb_seed \
    PORT=8080 \
    TZ=Asia/Kolkata

EXPOSE 8080
USER pb
WORKDIR /app

ENTRYPOINT ["/sbin/tini","--","/usr/local/bin/entrypoint.sh"]
