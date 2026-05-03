"""Async PocketBase REST client.

Auth modes:
- "admin": send PB_ADMIN_TOKEN as Authorization header (PocketBase superuser JWT).
- "gcp_id_token": fetch GCP identity token from metadata server, send as Bearer.
                  Useful when PocketBase sits behind a Cloud Run IAM-only ingress and
                  PocketBase collection rules permit guest CRUD on internal traffic.
- "none": no Authorization header (local PocketBase with open rules).

If PB_ADMIN_TOKEN is empty but PB_ADMIN_EMAIL/PASSWORD are set, the client will
exchange them at /api/admins/auth-with-password and cache the resulting token.
"""
from __future__ import annotations

import asyncio
import json
import time
from typing import Any, Iterable, Mapping

import httpx

from .config import Settings, get_settings
from .logging_setup import get_logger

logger = get_logger("pratidhwani.db")

METADATA_TOKEN_URL = (
    "http://metadata.google.internal/computeMetadata/v1/"
    "instance/service-accounts/default/identity?audience={audience}"
)
METADATA_HEADERS = {"Metadata-Flavor": "Google"}


class PocketBaseError(RuntimeError):
    def __init__(self, message: str, status: int | None = None, payload: Any = None) -> None:
        super().__init__(message)
        self.status = status
        self.payload = payload


class PocketBaseClient:
    """Minimal async REST client with retry, JSON logging, lazy admin token exchange."""

    def __init__(self, settings: Settings | None = None, client: httpx.AsyncClient | None = None) -> None:
        self.settings = settings or get_settings()
        self._client = client
        self._owns_client = client is None
        self._token: str = self.settings.PB_ADMIN_TOKEN or ""
        self._token_fetched_at: float = 0.0
        self._token_lock = asyncio.Lock()

    # ---- lifecycle -------------------------------------------------------

    async def __aenter__(self) -> "PocketBaseClient":
        await self.startup()
        return self

    async def __aexit__(self, *exc: Any) -> None:
        await self.shutdown()

    async def startup(self) -> None:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.settings.PB_URL.rstrip("/"),
                timeout=self.settings.PB_TIMEOUT_S,
                http2=False,
            )
            self._owns_client = True
        await self._ensure_token()

    async def shutdown(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    # ---- auth ------------------------------------------------------------

    async def _ensure_token(self) -> None:
        mode = self.settings.AUTH_MODE
        if mode == "none":
            return
        if mode == "gcp_id_token":
            # Fetch on demand, cache for 30 minutes (id tokens are valid 1h).
            if self._token and (time.time() - self._token_fetched_at) < 1800:
                return
            audience = self.settings.METADATA_AUDIENCE or self.settings.PB_URL
            await self._fetch_id_token(audience)
            return
        # admin mode
        if self._token:
            return
        if self.settings.PB_ADMIN_EMAIL and self.settings.PB_ADMIN_PASSWORD:
            await self._exchange_admin_password()

    async def _fetch_id_token(self, audience: str) -> None:
        async with self._token_lock:
            if self._token and (time.time() - self._token_fetched_at) < 1800:
                return
            url = METADATA_TOKEN_URL.format(audience=audience)
            assert self._client is not None
            try:
                # Metadata server runs on the loopback path; use a fresh client.
                async with httpx.AsyncClient(timeout=2.0) as mc:
                    resp = await mc.get(url, headers=METADATA_HEADERS)
                resp.raise_for_status()
                self._token = resp.text.strip()
                self._token_fetched_at = time.time()
                logger.info("id_token_fetched", audience=audience, len=len(self._token))
            except Exception as e:  # noqa: BLE001
                logger.warning("id_token_fetch_failed", err=str(e), audience=audience)
                # In gcp mode without metadata, we cannot continue.
                raise PocketBaseError(f"failed to fetch GCP id token: {e}") from e

    async def _exchange_admin_password(self) -> None:
        async with self._token_lock:
            if self._token:
                return
            assert self._client is not None
            payload = {
                "identity": self.settings.PB_ADMIN_EMAIL,
                "password": self.settings.PB_ADMIN_PASSWORD,
            }
            try:
                # PocketBase v0.23+ moved admin auth under the superusers collection.
                resp = await self._client.post(
                    "/api/collections/_superusers/auth-with-password", json=payload
                )
                resp.raise_for_status()
                data = resp.json()
                self._token = data.get("token", "")
                self._token_fetched_at = time.time()
                logger.info("admin_token_exchanged", has_token=bool(self._token))
            except Exception as e:  # noqa: BLE001
                logger.warning("admin_password_auth_failed", err=str(e))
                raise PocketBaseError(f"admin auth failed: {e}") from e

    def _auth_headers(self) -> dict[str, str]:
        if not self._token:
            return {}
        if self.settings.AUTH_MODE == "gcp_id_token":
            return {"Authorization": f"Bearer {self._token}"}
        # PocketBase 0.22 accepts plain token in Authorization.
        return {"Authorization": self._token}

    # ---- core request ----------------------------------------------------

    async def request(
        self,
        method: str,
        path: str,
        *,
        params: Mapping[str, Any] | None = None,
        json_body: Any = None,
        retry: bool = True,
    ) -> Any:
        await self._ensure_token()
        assert self._client is not None
        headers = {"Accept": "application/json", **self._auth_headers()}
        last_err: Exception | None = None
        delays: Iterable[float] = (0.1, 0.3, 0.7, 1.5) if retry else (0.0,)
        for attempt, delay in enumerate(delays, start=1):
            t0 = time.perf_counter()
            try:
                resp = await self._client.request(
                    method,
                    path,
                    params=dict(params) if params else None,
                    json=json_body,
                    headers=headers,
                )
                latency_ms = (time.perf_counter() - t0) * 1000.0
                if resp.status_code >= 500:
                    logger.warning(
                        "pb_5xx",
                        method=method,
                        path=path,
                        status=resp.status_code,
                        attempt=attempt,
                        latency_ms=round(latency_ms, 2),
                    )
                    last_err = PocketBaseError(
                        f"PB {resp.status_code} on {method} {path}", resp.status_code, _safe_json(resp)
                    )
                    if attempt < self.settings.PB_RETRY_MAX:
                        await asyncio.sleep(delay)
                        continue
                    raise last_err
                if resp.status_code == 401 and self.settings.AUTH_MODE != "none":
                    # Token may be stale; clear and retry once.
                    logger.info("pb_401_refresh_token", path=path)
                    self._token = ""
                    await self._ensure_token()
                    headers = {"Accept": "application/json", **self._auth_headers()}
                    if attempt < self.settings.PB_RETRY_MAX:
                        await asyncio.sleep(delay)
                        continue
                if resp.status_code >= 400:
                    raise PocketBaseError(
                        f"PB {resp.status_code} on {method} {path}", resp.status_code, _safe_json(resp)
                    )
                logger.debug(
                    "pb_ok",
                    method=method,
                    path=path,
                    status=resp.status_code,
                    latency_ms=round(latency_ms, 2),
                )
                if not resp.content:
                    return None
                return resp.json()
            except (httpx.TimeoutException, httpx.TransportError) as e:
                last_err = e
                logger.warning("pb_transport_err", method=method, path=path, attempt=attempt, err=str(e))
                if attempt < self.settings.PB_RETRY_MAX:
                    await asyncio.sleep(delay)
                    continue
                raise PocketBaseError(f"transport error: {e}") from e
        if last_err is not None:
            raise PocketBaseError(str(last_err)) from last_err
        raise PocketBaseError("unreachable")

    # ---- collection helpers ---------------------------------------------

    async def list_records(
        self,
        collection: str,
        *,
        page: int = 1,
        per_page: int = 200,
        filter_: str | None = None,
        sort: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"page": page, "perPage": per_page}
        if filter_:
            params["filter"] = filter_
        if sort:
            params["sort"] = sort
        return await self.request("GET", f"/api/collections/{collection}/records", params=params)

    async def get_record(self, collection: str, record_id: str) -> dict[str, Any]:
        return await self.request("GET", f"/api/collections/{collection}/records/{record_id}")

    async def create_record(self, collection: str, data: Mapping[str, Any]) -> dict[str, Any]:
        return await self.request("POST", f"/api/collections/{collection}/records", json_body=dict(data))

    async def update_record(
        self, collection: str, record_id: str, data: Mapping[str, Any]
    ) -> dict[str, Any]:
        return await self.request(
            "PATCH", f"/api/collections/{collection}/records/{record_id}", json_body=dict(data)
        )

    async def delete_record(self, collection: str, record_id: str) -> None:
        await self.request("DELETE", f"/api/collections/{collection}/records/{record_id}")

    async def health(self) -> bool:
        """Returns True iff PocketBase health endpoint responds 200."""
        try:
            await self.request("GET", "/api/health", retry=False)
            return True
        except PocketBaseError as e:
            logger.warning("pb_health_failed", err=str(e), status=e.status)
            return False
        except Exception as e:  # noqa: BLE001
            logger.warning("pb_health_exception", err=str(e))
            return False


def _safe_json(resp: httpx.Response) -> Any:
    try:
        return resp.json()
    except (json.JSONDecodeError, ValueError):
        return resp.text[:512]


# Module-level singleton wired in app lifespan.
_client: PocketBaseClient | None = None


def get_client() -> PocketBaseClient:
    if _client is None:
        raise RuntimeError("PocketBase client not initialised; lifespan did not run")
    return _client


async def init_client(settings: Settings | None = None) -> PocketBaseClient:
    global _client
    if _client is not None:
        return _client
    _client = PocketBaseClient(settings)
    await _client.startup()
    return _client


async def close_client() -> None:
    global _client
    if _client is not None:
        await _client.shutdown()
        _client = None
