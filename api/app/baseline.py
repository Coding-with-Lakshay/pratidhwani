"""Baselines: round-robin and random-region pickers for delta computation.

Used by the replay simulator (sim.py) to compute savings vs naive routing.
Pure: given the same input list and seed, deterministic.
"""
from __future__ import annotations

import random
from itertools import cycle
from typing import Iterator

from .scorer import RegionInput


class RoundRobinBaseline:
    def __init__(self, regions: list[RegionInput]) -> None:
        if not regions:
            raise ValueError("regions must be non-empty")
        self._regions = regions
        self._cyc: Iterator[RegionInput] = cycle(regions)

    def pick(self) -> RegionInput:
        return next(self._cyc)


class RandomBaseline:
    def __init__(self, regions: list[RegionInput], seed: int | None = None) -> None:
        if not regions:
            raise ValueError("regions must be non-empty")
        self._regions = regions
        self._rng = random.Random(seed)

    def pick(self) -> RegionInput:
        return self._rng.choice(self._regions)


def cost_of(region: RegionInput, payload_size: int = 0) -> float:
    """Approximate cost in price-per-million units for one request.

    payload_size is currently unused in the simple model — Cloud Run pricing
    is per-request + per-cpu-second, but for the demo we model price/req only.
    """
    return float(region.price_per_million_req) / 1_000_000.0


def carbon_of(region: RegionInput, work_kwh: float = 1e-6) -> float:
    """Approximate carbon in grams for one request given assumed kWh of work.

    1 microkWh per request is a stand-in; absolute number does not matter for
    *delta* calculations as long as the same constant is used baseline + ours.
    """
    return float(region.carbon_g_per_kwh) * work_kwh
