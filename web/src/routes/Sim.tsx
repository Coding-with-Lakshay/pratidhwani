import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { MetricTile } from "../components/MetricTile";
import { SectionHeader } from "../components/SectionHeader";
import { api } from "../lib/api";
import {
  formatGrams,
  formatNumber,
  formatPercent,
  formatUSD,
} from "../lib/format";
import type { SimReplayStatus } from "../lib/types";

const demoStatus = (): SimReplayStatus => ({
  state: "idle",
  progress: 0,
  ticks_done: 0,
  ticks_total: 288,
});

const demoComplete = (): SimReplayStatus => ({
  state: "complete",
  progress: 1,
  ticks_done: 288,
  ticks_total: 288,
  delta: {
    cold_starts_averted: 1284,
    gco2_saved: 4720,
    p95_baseline_ms: 612,
    p95_pratidhwani_ms: 359,
    cost_baseline: 11.92,
    cost_pratidhwani: 8.18,
  },
});

export function Sim() {
  const qc = useQueryClient();
  const statusQ = useQuery<SimReplayStatus>({
    queryKey: ["sim-status"],
    queryFn: api.replayStatus,
    refetchInterval: (q) => {
      const s = q.state.data;
      return s && s.state === "running" ? 1000 : false;
    },
  });

  const start = useMutation({
    mutationFn: () => api.startReplay(),
    onSuccess: (data) => qc.setQueryData(["sim-status"], data),
  });

  const status = statusQ.data ?? demoStatus();
  const isLive = !statusQ.isError;
  const display = useMemo<SimReplayStatus>(() => {
    if (!isLive && status.state === "idle") return demoComplete();
    return status;
  }, [isLive, status]);

  const pct = Math.round(display.progress * 100);
  const running = display.state === "running";

  return (
    <div className="container-wide py-8 md:py-12 space-y-10">
      <header className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <p className="label-eyebrow">/sim · 24 h replay</p>
          <h1 className="font-display text-display-lg tracking-tightest mt-2 text-balance">
            Replay synthetic Wikipedia-like diurnal traffic.
          </h1>
          <p className="mt-3 text-ink-soft max-w-2xl text-pretty">
            We push 288 five-minute ticks of three-region traffic through both Pratidhwani and a
            naive round-robin baseline. The dashboard below summarizes the delta — cold-starts
            averted, p95 reduction, carbon and cost savings.
          </p>
        </div>
        <div className="flex flex-col gap-2 items-start md:items-end">
          <button
            type="button"
            className="btn btn-accent"
            disabled={running || start.isPending}
            onClick={() => start.mutate()}
          >
            {running || start.isPending ? "Replay running…" : "Start 24 h replay"}
          </button>
          <p className="text-xs text-ink-mute font-mono">
            POST <span className="text-ink-soft">/api/v1/sim/replay</span>
          </p>
        </div>
      </header>

      <section aria-label="Replay progress" className="card p-6">
        <div className="flex items-baseline justify-between mb-3">
          <p className="label-eyebrow">Progress</p>
          <p className="num-tabular text-sm font-medium">
            {display.ticks_done} / {display.ticks_total} ticks ({pct}%)
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-2 bg-paper-sunk rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full"
            style={{ background: "var(--accent)" }}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ ease: "linear", duration: 0.8 }}
          />
        </div>
        <p className="mt-3 text-xs text-ink-mute font-mono">
          state: <span className="text-ink-soft">{display.state}</span>
          {!isLive && (
            <span className="ml-3 pill" style={{ color: "var(--signal-cost)" }}>demo data</span>
          )}
        </p>
      </section>

      {display.delta && (
        <section aria-labelledby="delta">
          <SectionHeader
            eyebrow="Replay result"
            title={<span id="delta">Pratidhwani vs naive round-robin</span>}
            description="288 ticks · 24 hours wall time, identical traffic profile and per-region capacity model."
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Cold-starts averted"
              value={formatNumber(display.delta.cold_starts_averted)}
              accent="latency"
              hint="vs round-robin"
            />
            <MetricTile
              label="p95 latency"
              value={`${display.delta.p95_pratidhwani_ms} ms`}
              hint={`baseline · ${display.delta.p95_baseline_ms} ms`}
              delta={{
                sign: "up",
                value: formatPercent(
                  ((display.delta.p95_baseline_ms - display.delta.p95_pratidhwani_ms) /
                    display.delta.p95_baseline_ms) * 100,
                ),
              }}
              accent="latency"
            />
            <MetricTile
              label="Carbon saved"
              value={formatGrams(display.delta.gco2_saved)}
              accent="carbon"
              hint="full 24-hour window"
            />
            <MetricTile
              label="Cost"
              value={formatUSD(display.delta.cost_pratidhwani)}
              hint={`baseline · ${formatUSD(display.delta.cost_baseline)}`}
              accent="cost"
              delta={{
                sign: "up",
                value: formatPercent(
                  ((display.delta.cost_baseline - display.delta.cost_pratidhwani) /
                    display.delta.cost_baseline) * 100,
                ),
              }}
            />
          </div>
        </section>
      )}

      <section className="card p-6 grid md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="label-eyebrow mb-2">Workload model</p>
          <p className="text-ink-soft">
            Diurnal (24 h sinusoid) + weekly seasonality + Poisson burst at minute 71 to stress the
            forecaster around an unexpected spike.
          </p>
        </div>
        <div>
          <p className="label-eyebrow mb-2">Region capacity</p>
          <p className="text-ink-soft">
            Each region has a soft QPS ceiling drawn from real Cloud Run autoscaling curves. Cold
            penalty is sampled from observed 95th-percentile cold-start times per region.
          </p>
        </div>
        <div>
          <p className="label-eyebrow mb-2">Carbon source</p>
          <p className="text-ink-soft">
            Hourly grid-intensity series from Electricity Maps daily snapshots — asia-south1,
            europe-west1, us-central1 — falling back to a static demo table when offline.
          </p>
        </div>
      </section>
    </div>
  );
}
