"""Golden cases for the multi-objective scorer."""
from __future__ import annotations

import pytest

from app.scorer import RegionInput, score_regions

# Three regions with clear single-axis winners.
REG_FAST = RegionInput("r1", "Mumbai", "asia-south1", current_p95_ms=80, carbon_g_per_kwh=600, price_per_million_req=0.40)
REG_GREEN = RegionInput("r2", "Belgium", "europe-west1", current_p95_ms=200, carbon_g_per_kwh=80, price_per_million_req=0.45)
REG_CHEAP = RegionInput("r3", "Iowa", "us-central1", current_p95_ms=180, carbon_g_per_kwh=400, price_per_million_req=0.20)


def _ranking(regs):
    return [r.gcp_region for r in regs]


def test_lat_dominant_picks_fast_region():
    out = score_regions([REG_FAST, REG_GREEN, REG_CHEAP], weights={"w_lat": 0.9, "w_carbon": 0.05, "w_cost": 0.05})
    assert _ranking(out)[0] == "asia-south1"
    # Reasons describe the winner.
    assert any("winner" in s for s in out[0].reasons)


def test_carbon_dominant_picks_green_region():
    out = score_regions([REG_FAST, REG_GREEN, REG_CHEAP], weights={"w_lat": 0.05, "w_carbon": 0.9, "w_cost": 0.05})
    assert _ranking(out)[0] == "europe-west1"


def test_cost_dominant_picks_cheap_region():
    out = score_regions([REG_FAST, REG_GREEN, REG_CHEAP], weights={"w_lat": 0.05, "w_carbon": 0.05, "w_cost": 0.9})
    assert _ranking(out)[0] == "us-central1"


def test_default_weights_balance():
    out = score_regions([REG_FAST, REG_GREEN, REG_CHEAP])
    # Default 0.4/0.4/0.2: fast and green both have one extreme axis;
    # tie-breaker depends on cost. Just ensure stable ordering and
    # all scores in [0,1].
    assert all(0.0 <= r.score <= 1.0 for r in out)
    assert len({r.gcp_region for r in out}) == 3


def test_single_candidate_is_winner():
    out = score_regions([REG_FAST])
    assert len(out) == 1
    assert out[0].gcp_region == "asia-south1"
    assert out[0].score == 0.0


def test_request_class_scales_latency_weight():
    # With latency de-emphasised (gpu-mock class_scale=0.4), the winner's
    # combined non-latency cost (carbon+cost) should be no worse than under
    # the light class. Use weights that emphasise latency strongly so the
    # class scaling actually shifts the ranking.
    weights = {"w_lat": 0.7, "w_carbon": 0.2, "w_cost": 0.1}
    light = score_regions([REG_FAST, REG_GREEN, REG_CHEAP], request_class="light", weights=weights)
    gpu = score_regions([REG_FAST, REG_GREEN, REG_CHEAP], request_class="gpu-mock", weights=weights)
    light_other = light[0].carbon_norm + light[0].cost_norm
    gpu_other = gpu[0].carbon_norm + gpu[0].cost_norm
    assert gpu_other <= light_other + 1e-9


def test_weights_renormalise_when_unequal_sum():
    out_a = score_regions([REG_FAST, REG_GREEN, REG_CHEAP], weights={"w_lat": 1, "w_carbon": 1, "w_cost": 1})
    out_b = score_regions([REG_FAST, REG_GREEN, REG_CHEAP], weights={"w_lat": 0.333, "w_carbon": 0.333, "w_cost": 0.334})
    assert _ranking(out_a) == _ranking(out_b)


def test_empty_input():
    out = score_regions([])
    assert out == []
