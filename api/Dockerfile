# syntax=docker/dockerfile:1.7
# Multistage build for pratidhwani-api.
# Builder installs Python deps into a venv; runtime copies the venv only.

ARG PYTHON_IMAGE=python:3.12-slim

# ---------- builder ----------
FROM ${PYTHON_IMAGE} AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# statsmodels/scipy/numpy ship manylinux wheels for cp312 — no compiler needed,
# but install build-essential for safety in case a wheel is missing.
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential gcc \
 && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

WORKDIR /build
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# ---------- runtime ----------
FROM ${PYTHON_IMAGE} AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:${PATH}" \
    PORT=8080 \
    LOG_LEVEL=INFO \
    SERVICE_NAME=pratidhwani-api \
    ENV=prod

# Run as non-root user; Cloud Run honours USER directive.
RUN groupadd -r app && useradd -r -g app -u 10001 -s /sbin/nologin app

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
COPY app /app/app
COPY pyproject.toml* /app/

USER app
EXPOSE 8080

# Cloud Run sets PORT; default to 8080 in dev. Lifespan ON so startup/shutdown hooks run.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1 --lifespan on --log-config app/log_config.json"]
