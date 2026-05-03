"""Holt-Winters + EWMA forecaster.

Inputs:
    history: list[float] of QPS samples at FORECAST_TICK_SECONDS cadence,
             ordered oldest -> newest, length up to FORECAST_WINDOW_TICKS.

Output: ForecastResult with predicted_qps for the next tick + 95% CI.

Algorithm:
- Bootstrap (< 12 samples): return naive mean / EWMA estimate with wide CI.
- Hot path: blend a Holt-Winters Exponential Smoothing forecast with an EWMA
  forecast. HW captures multiplicative diurnal seasonality if present;
  EWMA stabilises against flat or noisy series.
- If HW fails to converge (flat data, all zeros, NaNs), fall back to EWMA only.
- 95% CI computed from residual stddev * 1.96; clipped at 0 lower bound.
"""
from __future__ import annotations

import math
import warnings
from dataclasses import dataclass
from typing import Sequence

import numpy as np

from .logging_setup import get_logger

logger = get_logger("pratidhwani.forecaster")

# Defaults match SPEC: 60 min @ 30s tick = 120 samples; 5-min lookahead = 10 ticks.
DEFAULT_WINDOW = 120
DEFAULT_HORIZON_TICKS = 1
EWMA_ALPHA = 0.30
HW_BLEND_WEIGHT = 0.6  # Trust HW more than EWMA when it converges.
MIN_HW_SAMPLES = 24
SEASONAL_PERIODS_DEFAULT = 30  # 15 minutes at 30s cadence; sub-hour cycle.


@dataclass(slots=True, frozen=True)
class ForecastResult:
    predicted_qps: float
    ci_low: float
    ci_high: float
    method: str  # one of: "bootstrap", "ewma", "hw", "blend"
    horizon_ticks: int


def _ewma_forecast(history: Sequence[float], alpha: float = EWMA_ALPHA) -> tuple[float, float]:
    """Returns (point, residual_std) using simple exponentially-weighted mean."""
    if not history:
        return 0.0, 0.0
    s = float(history[0])
    residuals: list[float] = []
    for v in history[1:]:
        residuals.append(float(v) - s)
        s = alpha * float(v) + (1.0 - alpha) * s
    if residuals:
        std = float(np.std(residuals, ddof=0))
    else:
        std = 0.0
    return max(0.0, s), std


def _hw_forecast(
    history: Sequence[float],
    horizon: int,
    seasonal_periods: int,
) -> tuple[float, float] | None:
    """Returns (point, residual_std) or None on failure."""
    try:
        # Local import to keep optional / faster cold-start when unused.
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
    except Exception as e:  # noqa: BLE001
        logger.warning("hw_import_failed", err=str(e))
        return None

    arr = np.asarray(history, dtype=float)
    if arr.size < MIN_HW_SAMPLES:
        return None
    if not np.isfinite(arr).all():
        return None
    # statsmodels HW with multiplicative seasonality cannot handle zeros/negatives.
    use_seasonal = arr.size >= 2 * seasonal_periods and float(arr.min()) > 0.0
    seasonal = "add"  # additive is robust for QPS that may dip to zero.
    seasonal_periods_eff = seasonal_periods if use_seasonal else None

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = ExponentialSmoothing(
                arr,
                trend="add",
                seasonal=seasonal if seasonal_periods_eff else None,
                seasonal_periods=seasonal_periods_eff,
                initialization_method="estimated",
            )
            fit = model.fit(optimized=True, use_brute=False)
            forecast = np.asarray(fit.forecast(horizon))
            if forecast.size == 0:
                return None
            point = float(forecast[-1])
            if not math.isfinite(point):
                return None
            point = max(0.0, point)
            resid = np.asarray(fit.resid)
            std = float(np.std(resid, ddof=1)) if resid.size > 1 else 0.0
            return point, std
    except Exception as e:  # noqa: BLE001
        logger.info("hw_fit_failed", err=str(e), n=int(arr.size))
        return None


def forecast(
    history: Sequence[float],
    *,
    horizon_ticks: int = DEFAULT_HORIZON_TICKS,
    seasonal_periods: int = SEASONAL_PERIODS_DEFAULT,
) -> ForecastResult:
    """Forecast next-tick QPS with 95% CI."""
    n = len(history)
    if n == 0:
        return ForecastResult(0.0, 0.0, 0.0, "bootstrap", horizon_ticks)

    if n < 12:
        point = float(np.mean(history))
        std = float(np.std(history, ddof=0)) if n > 1 else max(point, 1.0)
        ci_half = 1.96 * std + 1.0  # bootstrap pad
        return ForecastResult(
            predicted_qps=max(0.0, point),
            ci_low=max(0.0, point - ci_half),
            ci_high=point + ci_half,
            method="bootstrap",
            horizon_ticks=horizon_ticks,
        )

    ewma_point, ewma_std = _ewma_forecast(history)
    hw = _hw_forecast(history, horizon_ticks, seasonal_periods)

    if hw is None:
        std = max(ewma_std, 1e-6)
        ci_half = 1.96 * std
        return ForecastResult(
            predicted_qps=ewma_point,
            ci_low=max(0.0, ewma_point - ci_half),
            ci_high=ewma_point + ci_half,
            method="ewma",
            horizon_ticks=horizon_ticks,
        )

    hw_point, hw_std = hw
    blend_point = HW_BLEND_WEIGHT * hw_point + (1.0 - HW_BLEND_WEIGHT) * ewma_point
    # Combine residual variance conservatively (sum of weighted variances).
    blended_var = (HW_BLEND_WEIGHT ** 2) * (hw_std ** 2) + ((1.0 - HW_BLEND_WEIGHT) ** 2) * (ewma_std ** 2)
    std = math.sqrt(max(blended_var, 1e-12))
    ci_half = 1.96 * std
    return ForecastResult(
        predicted_qps=max(0.0, blend_point),
        ci_low=max(0.0, blend_point - ci_half),
        ci_high=blend_point + ci_half,
        method="blend",
        horizon_ticks=horizon_ticks,
    )
