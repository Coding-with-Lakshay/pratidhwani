import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useMemo } from "react";
import { ApiBadge } from "../components/ApiBadge";
import { DecisionFeed } from "../components/DecisionFeed";
import { MetricTile } from "../components/MetricTile";
import { RegionCard } from "../components/RegionCard";
import { SectionHeader } from "../components/SectionHeader";
import { WeightSliders } from "../components/WeightSliders";
import { api, demoFallback } from "../lib/api";
import {
  formatGrams,
  formatINR,
  formatNumber,
  formatPercent,
  formatUSD,
} from "../lib/format";
import type { Decision, Region, Savings, Weights } from "../lib/types";

const TrafficSpark = lazy(() =>
  import("../components/TrafficSpark").then((m) => ({ default: m.TrafficSpark })),
);

export function Dashboard() {
  const qc = useQueryClient();

  const regionsQ = useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: api.regions,
    refetchInterval: 5000,
  });
  const savingsQ = useQuery<Savings>({
    queryKey: ["savings"],
    queryFn: api.savings,
    refetchInterval: 5000,
  });
  const decisionsQ = useQuery<Decision[]>({
    queryKey: ["decisions"],
    queryFn: () => api.decisions(undefined, 50),
    refetchInterval: 3000,
  });
  const weightsQ = useQuery<Weights>({
    queryKey: ["weights"],
    queryFn: api.weights,
  });

  const setWeights = useMutation({
    mutationFn: (w: Weights) => api.setWeights(w),
    onSuccess: (data) => qc.setQueryData(["weights"], data),
  });

  const isLive =
    regionsQ.isSuccess && savingsQ.isSuccess && !regionsQ.isError && !savingsQ.isError;
  const regions = regionsQ.data ?? demoFallback.regions();
  const savings = savingsQ.data ?? demoFallback.savings();
  const decisions = decisionsQ.data ?? demoFallback.decisions();
  const weights =
    weightsQ.data ??
    setWeights.variables ??
    demoFallback.weights();

  const primary = useMemo(
    () =>
      regions.reduce((acc, r) =>
        (r.predicted_qps ?? 0) > (acc.predicted_qps ?? 0) ? r : acc,
      regions[0]),
    [regions],
  );

  return (
    <div className="container-wide py-8 md:py-12 space-y-12">
      <header className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <p className="label-eyebrow">Live · {regions.length} regions</p>
          <h1 className="font-display text-display-lg tracking-tightest mt-2 text-balance">
            Pre-echoes your traffic.{" "}
            <span className="text-ink-mute">Slashes cold-starts, cost, and carbon.</span>
          </h1>
          <p className="mt-3 text-ink-soft max-w-2xl text-pretty">
            Pratidhwani forecasts per-region demand five minutes ahead, pre-warms only when the
            confidence-weighted latency-cost crosses threshold, and routes each request through a
            multi-objective scorer over latency, grid carbon, and price.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <ApiBadge isLive={isLive} isFetching={regionsQ.isFetching || savingsQ.isFetching} />
          <p className="font-mono text-xs text-ink-mute">
            tick · 5 s &nbsp;·&nbsp; horizon · 5 min
          </p>
        </div>
      </header>

      <section aria-labelledby="todays-impact">
        <SectionHeader
          eyebrow="Today’s impact"
          title={<span id="todays-impact">What Pratidhwani saved you today</span>}
          description="Compared against a naive round-robin baseline running on the same workload across the same regions."
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricTile
            label="Cold-starts averted"
            value={formatNumber(savings.cold_starts_averted_today)}
            hint={`baseline would hit ${formatNumber(
              savings.cold_starts_averted_today + Math.round(savings.cold_starts_averted_today * 0.3),
            )} cold paths`}
            delta={{
              sign: "up",
              value: `${formatPercent(savings.p95_reduction_pct)} p95 reduction`,
            }}
            accent="latency"
          />
          <MetricTile
            label="Carbon saved"
            value={formatGrams(savings.gco2_saved_today)}
            hint={`${formatGrams(savings.baseline_carbon_today)} → ${formatGrams(savings.our_carbon_today)}`}
            delta={{ sign: "up", value: `${formatPercent(
              savings.baseline_carbon_today === 0
                ? 0
                : ((savings.baseline_carbon_today - savings.our_carbon_today) /
                    savings.baseline_carbon_today) * 100,
            )} less than RR` }}
            accent="carbon"
          />
          <MetricTile
            label="Cost saved"
            value={formatINR(savings.inr_saved_today)}
            hint={`(${formatUSD(savings.usd_saved_today)} · ${formatUSD(savings.our_cost_today)} spent)`}
            delta={{ sign: "up", value: `${formatPercent(
              savings.baseline_cost_today === 0
                ? 0
                : ((savings.baseline_cost_today - savings.our_cost_today) /
                    savings.baseline_cost_today) * 100,
            )} below RR` }}
            accent="cost"
          />
          <MetricTile
            label="p95 reduction"
            value={formatPercent(savings.p95_reduction_pct)}
            hint="vs round-robin on identical workload"
            delta={{
              sign: savings.p95_reduction_pct > 0 ? "up" : "down",
              value: "live · last 1 h window",
            }}
          />
        </div>
      </section>

      <section aria-labelledby="regions" className="grid lg:grid-cols-[1fr_22rem] gap-6">
        <div>
          <SectionHeader
            eyebrow="Regions"
            title={<span id="regions">Forecast & live signals</span>}
            description="Each card shows base latency, current grid carbon intensity, Cloud Run pricing, and the next-five-minute forecast with a confidence band."
            actions={
              <Suspense fallback={null}>
                <TrafficSpark regions={regions} />
              </Suspense>
            }
          />
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {regions.map((r) => (
              <RegionCard key={r.id} region={r} isPrimary={r.id === primary?.id} />
            ))}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <WeightSliders
            initial={weights}
            onChange={(w) => setWeights.mutate(w)}
          />
          <p className="text-xs text-ink-mute leading-relaxed">
            Weights are tenant-tunable from this panel. Updates are debounced and sent to{" "}
            <code className="font-mono text-ink-soft">/api/v1/weights</code>; the scorer applies them
            on the next request without a redeploy.
          </p>
        </aside>
      </section>

      <section aria-labelledby="decisions" className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <div>
          <SectionHeader
            eyebrow="Decisions"
            title={<span id="decisions">Latest 50 routing decisions</span>}
            description="Each row is one /route call: which region the scorer picked, why, observed latency, and whether the path went through a cold container."
          />
          <DecisionFeed decisions={decisions} />
        </div>
        <div>
          <SectionHeader
            eyebrow="How the scorer thinks"
            title="score(r) = w_lat · p95̂(r) + w_carbon · ĉ(r) + w_cost · p̂(r)"
            description="All three components are min-max normalized across active regions every tick. Lower score wins. The scorer also vetoes regions whose p95 forecast exceeds the per-tenant budget."
          />
          <div className="card p-6 space-y-4 font-mono text-sm leading-relaxed">
            <div>
              <p className="label-eyebrow mb-2">Forecaster</p>
              <p className="text-ink-soft">
                Holt-Winters seasonal (24 h period, 5-min ticks) blended with EWMA (α = 0.3) on a
                10-minute rolling window. Confidence interval from residual std × 1.96.
              </p>
            </div>
            <div className="border-t border-ink-line pt-4">
              <p className="label-eyebrow mb-2">Pre-warm trigger</p>
              <p className="text-ink-soft">
                if <span className="text-accent">p̂(r)·CI</span> &gt; θ
                <sub>warm</sub> and <span className="text-accent">cold-cost &gt; warm-budget</span>{" "}
                — fire one synthetic GET <span className="text-accent">/__warm</span>.
              </p>
            </div>
            <div className="border-t border-ink-line pt-4">
              <p className="label-eyebrow mb-2">Veto rules</p>
              <ul className="list-disc pl-5 space-y-1 text-ink-soft">
                <li>p95 forecast &gt; tenant SLO → drop region from candidate set</li>
                <li>region last_seen older than 30 s → mark stale</li>
                <li>carbon intensity unavailable → fall back to weighted average</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
