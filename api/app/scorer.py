"""Multi-objective request-routing scorer.

Inputs per candidate region:
    current_p95_ms       — observed p95 latency for the request class
    carbon_g_per_kwh     — grid carbon intensity
    price_per_million_req — Cloud Run pricing in currency/1M req

Lower is better on all three axes. We min-max normalize each axis across
candidates, then compute:

    score = w_lat * lat_norm + w_carbon * carbon_norm + w_cost * cost_norm

Default weights w_lat=0.4, w_carbon=0.4, w_cost=0.2. Lower score = better region.

If a single candidate is provided, normalisation collapses to 0 across axes
and we still emit a deterministic ordering with the constant winner.

Request weight class scales the latency penalty (heavy/gpu requests value
latency less because absolute work dominates):
    light  -> 1.0
    heavy  -> 0.6
    gpu    -> 0.4
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable

DEFAULT_WEIGHTS: dict[str, float] = {"w_lat": 0.4, "w_carbon": 0.4, "w_cost": 0.2}

CLASS_LATENCY_SCALE: dict[str, float] = {
    "light": 1.0,
    "heavy": 0.6,
    "gpu-mock": 0.4,
    "gpu": 0.4,
}


@dataclass(slots=True)
class RegionInput:
    region_id: str
    name: str
    gcp_region: str
    current_p95_ms: float
    carbon_g_per_kwh: float
    price_per_million_req: float


@dataclass(slots=True)
class ScoredRegion:
    region_id: str
    name: str
    gcp_region: str
    score: float
    lat_norm: float
    carbon_norm: float
    cost_norm: float
    reasons: list[str] = field(default_factory=list)


def _validate_weights(w: dict[str, float]) -> dict[str, float]:
    out = {k: float(w.get(k, DEFAULT_WEIGHTS[k])) for k in DEFAULT_WEIGHTS}
    s = sum(out.values())
    if s <= 0:
        return dict(DEFAULT_WEIGHTS)
    # Renormalise so weights sum to 1 — keeps scores comparable across tenants.
    return {k: v / s for k, v in out.items()}


def _minmax(values: list[float]) -> list[float]:
    if not values:
        return []
    lo = min(values)
    hi = max(values)
    if hi - lo < 1e-12:
        return [0.0 for _ in values]
    return [(v - lo) / (hi - lo) for v in values]


def score_regions(
    regions: Iterable[RegionInput],
    *,
    request_class: str = "light",
    weights: dict[str, float] | None = None,
) -> list[ScoredRegion]:
    regs = list(regions)
    if not regs:
        return []
    w = _validate_weights(weights or DEFAULT_WEIGHTS)
    lat_scale = CLASS_LATENCY_SCALE.get(request_class.lower(), 1.0)

    lat_norm = _minmax([r.current_p95_ms for r in regs])
    car_norm = _minmax([r.carbon_g_per_kwh for r in regs])
    cost_norm = _minmax([r.price_per_million_req for r in regs])

    out: list[ScoredRegion] = []
    for r, ln, cn, kn in zip(regs, lat_norm, car_norm, cost_norm):
        eff_lat = ln * lat_scale
        score = w["w_lat"] * eff_lat + w["w_carbon"] * cn + w["w_cost"] * kn
        reasons = _build_reasons(r, ln, cn, kn, w, lat_scale)
        out.append(
            ScoredRegion(
                region_id=r.region_id,
                name=r.name,
                gcp_region=r.gcp_region,
                score=round(score, 6),
                lat_norm=round(ln, 4),
                carbon_norm=round(cn, 4),
                cost_norm=round(kn, 4),
                reasons=reasons,
            )
        )
    out.sort(key=lambda x: x.score)
    if out:
        out[0].reasons.insert(0, "winner: lowest weighted score")
    return out


def _build_reasons(
    r: RegionInput,
    ln: float,
    cn: float,
    kn: float,
    w: dict[str, float],
    lat_scale: float,
) -> list[str]:
    items: list[str] = []
    items.append(f"p95={r.current_p95_ms:.0f}ms (norm={ln:.2f}, w={w['w_lat']:.2f}, class_scale={lat_scale:.2f})")
    items.append(f"carbon={r.carbon_g_per_kwh:.0f}gCO2/kWh (norm={cn:.2f}, w={w['w_carbon']:.2f})")
    items.append(f"price={r.price_per_million_req:.2f}/1M (norm={kn:.2f}, w={w['w_cost']:.2f})")
    return items
