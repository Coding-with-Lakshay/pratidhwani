"""Forecaster tests on synthetic series."""
from __future__ import annotations

import math
import random

import pytest

from app.forecaster import forecast


def test_bootstrap_short_history():
    res = forecast([1.0, 2.0, 1.5])
    assert res.method == "bootstrap"
    assert res.predicted_qps >= 0.0
    assert res.ci_low <= res.predicted_qps <= res.ci_high


def test_empty_history():
    res = forecast([])
    assert res.predicted_qps == 0.0
    assert res.method == "bootstrap"


def test_flat_series_falls_back_to_ewma_or_blend():
    # Flat series: HW may converge to a constant; either way prediction ~ constant.
    series = [5.0] * 80
    res = forecast(series)
    assert res.method in {"ewma", "blend", "hw"}
    assert abs(res.predicted_qps - 5.0) < 1.0


def test_ramp_series_predicts_increase():
    series = [float(i) for i in range(0, 80)]
    res = forecast(series)
    # Should predict near the last sample or above it (rising trend).
    assert res.predicted_qps > 50.0
    assert res.ci_high >= res.predicted_qps
    assert res.ci_low <= res.predicted_qps


def test_seasonal_diurnal_series():
    # Simulate two cycles of a 30-period sine wave.
    series = []
    for t in range(120):
        v = 10.0 + 5.0 * math.sin(2 * math.pi * t / 30.0)
        series.append(max(0.0, v))
    res = forecast(series)
    assert res.method in {"blend", "ewma", "hw"}
    assert 0.0 <= res.predicted_qps <= 25.0


def test_noisy_series_has_nonzero_ci():
    rng = random.Random(7)
    series = [max(0.0, 10.0 + rng.gauss(0, 2.0)) for _ in range(80)]
    res = forecast(series)
    assert res.ci_high - res.ci_low > 0.0


def test_zero_series_returns_zero():
    res = forecast([0.0] * 60)
    assert res.predicted_qps == 0.0


def test_handles_nan_gracefully():
    # NaNs should not crash; HW will reject and EWMA fallback produces finite output.
    series = [1.0, 2.0, float("nan"), 3.0] + [2.0] * 30
    res = forecast(series)
    assert math.isfinite(res.predicted_qps)
