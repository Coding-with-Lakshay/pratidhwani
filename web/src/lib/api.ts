import type { Decision, Region, Savings, SimReplayStatus, Weights } from "./types";

const API_BASE = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  regions: () => request<Region[]>("/regions"),
  decisions: (since?: string, limit = 50) =>
    request<Decision[]>(
      `/decisions?limit=${limit}${since ? `&since=${encodeURIComponent(since)}` : ""}`,
    ),
  savings: () =>
    request<Record<string, unknown>>("/metrics/savings").then((d): Savings => {
      const num = (k: string) => {
        const v = d[k];
        return typeof v === "number" && Number.isFinite(v) ? v : 0;
      };
      const cb = num("cost_baseline");
      const co = num("cost_ours");
      const carb_b = num("carbon_baseline");
      const carb_o = num("carbon_ours");
      const samples = num("samples");
      // The API exposes cost_baseline/cost_ours in INR; convert to a rough USD
      // for the secondary tile (1 USD ≈ 83 INR — illustrative only, FX is not
      // a research claim of this work).
      const inrSaved = Math.max(0, cb - co);
      const usdSaved = inrSaved / 83;
      return {
        cold_starts_averted_today: samples,
        gco2_saved_today: Math.max(0, carb_b - carb_o),
        inr_saved_today: inrSaved,
        usd_saved_today: usdSaved,
        p95_reduction_pct: num("cost_saved_pct"),
        baseline_cost_today: cb,
        our_cost_today: co,
        baseline_carbon_today: carb_b,
        our_carbon_today: carb_o,
      };
    }),
  weights: () => request<Weights>("/weights"),
  setWeights: (w: Weights) =>
    request<Weights>("/weights", { method: "POST", body: JSON.stringify(w) }),
  startReplay: () => request<SimReplayStatus>("/sim/replay", { method: "POST" }),
  replayStatus: () => request<SimReplayStatus>("/sim/replay/status"),
  health: () => request<{ ok: boolean; ts: string }>("/health"),
};

/**
 * Demo data used when API unreachable. Lets the dashboard, /pitch, and /sim
 * render real-looking values for screenshots and offline review.
 */
export const demoFallback = {
  regions: (): Region[] => [
    {
      id: "r-as1",
      name: "Mumbai",
      gcp_region: "asia-south1",
      base_latency_ms: 38,
      price_per_million: 0.40,
      carbon_g_per_kwh: 712,
      last_seen: new Date().toISOString(),
      predicted_qps: 184,
      ci_low: 162,
      ci_high: 209,
      observed_qps: 178,
      health: "ok",
    },
    {
      id: "r-ew1",
      name: "St. Ghislain",
      gcp_region: "europe-west1",
      base_latency_ms: 142,
      price_per_million: 0.40,
      carbon_g_per_kwh: 168,
      last_seen: new Date().toISOString(),
      predicted_qps: 96,
      ci_low: 81,
      ci_high: 113,
      observed_qps: 98,
      health: "ok",
    },
    {
      id: "r-uc1",
      name: "Council Bluffs",
      gcp_region: "us-central1",
      base_latency_ms: 218,
      price_per_million: 0.40,
      carbon_g_per_kwh: 396,
      last_seen: new Date().toISOString(),
      predicted_qps: 64,
      ci_low: 48,
      ci_high: 82,
      observed_qps: 67,
      health: "warm",
    },
  ],
  savings: (): Savings => ({
    cold_starts_averted_today: 1284,
    gco2_saved_today: 4720,
    inr_saved_today: 312.40,
    usd_saved_today: 3.74,
    p95_reduction_pct: 41.2,
    baseline_cost_today: 11.92,
    our_cost_today: 8.18,
    baseline_carbon_today: 19840,
    our_carbon_today: 15120,
  }),
  weights: (): Weights => ({ w_lat: 0.5, w_carbon: 0.3, w_cost: 0.2 }),
  decisions: (n = 50): Decision[] => {
    const regions = ["asia-south1", "europe-west1", "us-central1"];
    const types = ["light", "heavy", "gpu-mock"] as const;
    const now = Date.now();
    return Array.from({ length: n }, (_, i) => {
      const r = regions[i % regions.length];
      const t = types[i % 3];
      return {
        id: `d-${now - i * 1500}`,
        ts: new Date(now - i * 1500).toISOString(),
        request_type: t,
        chosen_region: r,
        score: 0.18 + Math.random() * 0.6,
        alt_scores: Object.fromEntries(
          regions.filter((x) => x !== r).map((x) => [x, 0.4 + Math.random() * 0.5]),
        ),
        latency_observed_ms: Math.round(
          t === "light" ? 30 + Math.random() * 60 :
          t === "heavy" ? 220 + Math.random() * 380 :
          1100 + Math.random() * 1600,
        ),
        was_cold: Math.random() < 0.06,
        reasons:
          t === "gpu-mock"
            ? ["forecast-spike", "low-carbon-window", "cheap-region"]
            : ["latency-budget", "carbon-tilt"],
      };
    });
  },
};
