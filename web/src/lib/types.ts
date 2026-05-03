export type RegionId = "asia-south1" | "europe-west1" | "us-central1" | string;

export interface Region {
  id: string;
  name: string;
  gcp_region: RegionId;
  base_latency_ms: number;
  price_per_million: number;
  carbon_g_per_kwh: number;
  last_seen: string;
  predicted_qps?: number;
  ci_low?: number;
  ci_high?: number;
  observed_qps?: number;
  health?: "ok" | "warm" | "cold";
}

export type RequestType = "light" | "heavy" | "gpu-mock";

export interface Decision {
  id: string;
  ts: string;
  request_type: RequestType;
  chosen_region: string;
  score: number;
  alt_scores: Record<string, number>;
  latency_observed_ms: number;
  was_cold: boolean;
  reasons?: string[];
}

export interface Weights {
  w_lat: number;
  w_carbon: number;
  w_cost: number;
  updated_ts?: string;
}

export interface Savings {
  cold_starts_averted_today: number;
  gco2_saved_today: number;
  inr_saved_today: number;
  usd_saved_today: number;
  p95_reduction_pct: number;
  baseline_cost_today: number;
  our_cost_today: number;
  baseline_carbon_today: number;
  our_carbon_today: number;
}

export interface SimReplayStatus {
  state: "idle" | "running" | "complete" | "failed";
  progress: number;
  ticks_done: number;
  ticks_total: number;
  delta?: {
    cold_starts_averted: number;
    gco2_saved: number;
    p95_baseline_ms: number;
    p95_pratidhwani_ms: number;
    cost_baseline: number;
    cost_pratidhwani: number;
  };
}
