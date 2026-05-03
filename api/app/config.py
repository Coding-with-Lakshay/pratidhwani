"""Settings via pydantic-settings. All env-driven, no hard-coded paths."""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # PocketBase connectivity.
    PB_URL: str = Field(default="http://127.0.0.1:8090", description="PocketBase base URL")
    PB_ADMIN_TOKEN: str = Field(default="", description="PocketBase admin auth JWT (dev) or static superuser token")
    PB_ADMIN_EMAIL: str = Field(default="", description="Optional fallback admin email for token exchange")
    PB_ADMIN_PASSWORD: str = Field(default="", description="Optional fallback admin password for token exchange")
    PB_TIMEOUT_S: float = Field(default=5.0)
    PB_RETRY_MAX: int = Field(default=4)

    # Cloud Run service-to-service auth.
    AUTH_MODE: str = Field(default="admin", description="One of: admin, gcp_id_token, none")
    METADATA_AUDIENCE: str = Field(default="", description="Audience for GCP id_token; defaults to PB_URL when empty")

    # Region routing.
    REGION_URLS_JSON: str = Field(
        default='{"asia-south1":"https://asia-south1.example.run.app","europe-west1":"https://europe-west1.example.run.app","us-central1":"https://us-central1.example.run.app"}',
        description="JSON map of gcp_region -> Cloud Run URL",
    )

    # Routing weights default.
    DEFAULT_WEIGHTS_JSON: str = Field(
        default='{"w_lat":0.4,"w_carbon":0.4,"w_cost":0.2}',
        description="JSON object of default scoring weights",
    )

    # Forecast / pre-warm tunables.
    FORECAST_WINDOW_TICKS: int = Field(default=120, description="History length for forecaster (60 min @ 30s tick)")
    FORECAST_TICK_SECONDS: int = Field(default=30)
    PREWARM_BUDGET_PER_TICK: int = Field(default=3, description="Max warm pings per tick across all regions")
    PREWARM_TRIGGER_QPS: float = Field(default=2.0, description="Send warm if predicted_qps >= this and CI low > 0")

    # Optional carbon-intensity API.
    FEATURE_CARBON_API_URL: str = Field(default="")
    FEATURE_CARBON_API_KEY: str = Field(default="")

    # CORS.
    CORS_ORIGINS: str = Field(default="*", description="Comma-separated list of allowed origins; * = all")

    # Misc.
    LOG_LEVEL: str = Field(default="INFO")
    ENV: str = Field(default="dev", description="dev / staging / prod")
    SERVICE_NAME: str = Field(default="pratidhwani-api")

    # Parsed properties.
    @property
    def region_urls(self) -> dict[str, str]:
        return _parse_json_obj(self.REGION_URLS_JSON, "REGION_URLS_JSON")

    @property
    def default_weights(self) -> dict[str, float]:
        raw = _parse_json_obj(self.DEFAULT_WEIGHTS_JSON, "DEFAULT_WEIGHTS_JSON")
        return {k: float(v) for k, v in raw.items()}

    @property
    def cors_origins(self) -> list[str]:
        s = (self.CORS_ORIGINS or "").strip()
        if not s or s == "*":
            return ["*"]
        return [o.strip() for o in s.split(",") if o.strip()]

    @field_validator("AUTH_MODE")
    @classmethod
    def _check_auth_mode(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in {"admin", "gcp_id_token", "none"}:
            raise ValueError(f"AUTH_MODE must be admin|gcp_id_token|none, got {v!r}")
        return v


def _parse_json_obj(s: str, name: str) -> dict[str, Any]:
    if not s:
        return {}
    try:
        out = json.loads(s)
    except json.JSONDecodeError as e:
        raise ValueError(f"{name} is not valid JSON: {e}") from e
    if not isinstance(out, dict):
        raise ValueError(f"{name} must decode to JSON object")
    return out


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
