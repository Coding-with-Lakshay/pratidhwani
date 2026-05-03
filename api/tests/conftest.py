"""Shared pytest fixtures.

Integration tests use a real PocketBase container started by docker-compose.yml.
The PB_URL env var must point at it. If it's not reachable, integration tests
are skipped (not faked).
"""
from __future__ import annotations

import os
import socket
import sys
from pathlib import Path

import pytest

# Make `app` importable when running pytest from repo root or api/.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture(scope="session")
def pb_url() -> str:
    return os.environ.get("PB_URL", "http://127.0.0.1:8090")


def _tcp_open(host: str, port: int, timeout: float = 0.5) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


@pytest.fixture(scope="session")
def pb_reachable(pb_url: str) -> bool:
    # Strip scheme; assume http or https
    rest = pb_url.split("://", 1)[-1]
    host_port = rest.split("/", 1)[0]
    if ":" in host_port:
        host, port_s = host_port.rsplit(":", 1)
        port = int(port_s)
    else:
        host = host_port
        port = 443 if pb_url.startswith("https") else 80
    return _tcp_open(host, port)


@pytest.fixture(scope="session")
def integration_marker(pb_reachable: bool):
    if not pb_reachable:
        pytest.skip("PocketBase not reachable; start tests/docker-compose.yml first")
