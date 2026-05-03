"""Baseline picker tests."""
from __future__ import annotations

from app.baseline import RandomBaseline, RoundRobinBaseline, carbon_of, cost_of
from app.scorer import RegionInput

REGS = [
    RegionInput("r1", "M", "asia-south1", 100, 600, 0.40),
    RegionInput("r2", "B", "europe-west1", 200, 80, 0.45),
    RegionInput("r3", "I", "us-central1", 180, 400, 0.20),
]


def test_round_robin_cycles():
    rr = RoundRobinBaseline(REGS)
    picks = [rr.pick().gcp_region for _ in range(6)]
    assert picks == ["asia-south1", "europe-west1", "us-central1"] * 2


def test_random_seeded_is_deterministic():
    a = RandomBaseline(REGS, seed=1)
    b = RandomBaseline(REGS, seed=1)
    seq_a = [a.pick().region_id for _ in range(20)]
    seq_b = [b.pick().region_id for _ in range(20)]
    assert seq_a == seq_b


def test_cost_and_carbon_of_proportional():
    a, b = REGS[0], REGS[2]
    assert cost_of(a) > cost_of(b)
    assert carbon_of(a) > carbon_of(b)
