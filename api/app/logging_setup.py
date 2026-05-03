"""Structured JSON logging via structlog. Wires stdlib logging to structlog."""
from __future__ import annotations

import logging
import logging.config
import sys
from contextvars import ContextVar
from pathlib import Path
from typing import Any

import structlog

# Correlation ID propagated through a request.
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="-")

_CONFIGURED = False


def _add_correlation_id(_logger: Any, _name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    event_dict.setdefault("corr_id", correlation_id_var.get())
    return event_dict


def _add_service_meta(service_name: str):
    def _proc(_logger: Any, _name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
        event_dict.setdefault("service", service_name)
        return event_dict

    return _proc


def configure_logging(level: str = "INFO", service_name: str = "pratidhwani-api") -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    log_config_path = Path(__file__).parent / "log_config.json"
    if log_config_path.is_file():
        import json

        with log_config_path.open("r", encoding="utf-8") as fh:
            cfg = json.load(fh)
        # Override level from settings.
        for h in cfg.get("handlers", {}).values():
            h["level"] = level
        for lg in cfg.get("loggers", {}).values():
            lg["level"] = level
        cfg.setdefault("root", {})["level"] = level
        logging.config.dictConfig(cfg)
    else:
        logging.basicConfig(level=level, stream=sys.stdout, format="%(message)s")

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            _add_correlation_id,
            _add_service_meta(service_name),
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    _CONFIGURED = True


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name) if name else structlog.get_logger()


def set_correlation_id(corr_id: str) -> None:
    correlation_id_var.set(corr_id)


def get_correlation_id() -> str:
    return correlation_id_var.get()
