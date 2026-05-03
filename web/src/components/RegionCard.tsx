import { motion } from "framer-motion";
import { formatNumber } from "../lib/format";
import type { Region } from "../lib/types";

interface RegionCardProps {
  region: Region;
  isPrimary?: boolean;
}

const carbonBand = (g: number): { label: string; tone: string } => {
  if (g < 200) return { label: "clean", tone: "var(--signal-carbon)" };
  if (g < 450) return { label: "moderate", tone: "var(--signal-cost)" };
  return { label: "dirty", tone: "var(--signal-warn)" };
};

export function RegionCard({ region, isPrimary }: RegionCardProps) {
  const carbon = carbonBand(region.carbon_g_per_kwh);
  const ci = region.ci_high && region.ci_low ? region.ci_high - region.ci_low : 0;
  const center = region.predicted_qps ?? region.observed_qps ?? 0;
  const ciPct = center > 0 ? Math.min(100, (ci / center) * 100) : 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 flex flex-col gap-4 relative"
      aria-label={`Region ${region.name}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="label-eyebrow">{region.gcp_region}</p>
          <h3 className="font-display text-2xl font-medium tracking-tight mt-1">
            {region.name}
          </h3>
        </div>
        {isPrimary && (
          <span
            className="pill"
            style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" }}
          >
            primary
          </span>
        )}
      </header>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-ink-mute text-xs">latency</dt>
          <dd className="num-tabular text-lg mt-1">
            {region.base_latency_ms}
            <span className="text-ink-mute text-xs ml-0.5">ms</span>
          </dd>
        </div>
        <div>
          <dt className="text-ink-mute text-xs">carbon</dt>
          <dd className="num-tabular text-lg mt-1" style={{ color: carbon.tone }}>
            {region.carbon_g_per_kwh}
            <span className="text-ink-mute text-xs ml-0.5">g/kWh</span>
          </dd>
        </div>
        <div>
          <dt className="text-ink-mute text-xs">price</dt>
          <dd className="num-tabular text-lg mt-1">
            ${region.price_per_million.toFixed(2)}
            <span className="text-ink-mute text-xs ml-0.5">/M</span>
          </dd>
        </div>
      </dl>

      <div className="border-t border-ink-line pt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <p className="text-xs text-ink-mute">predicted QPS · next 5 min</p>
          <p className="num-tabular text-sm font-medium">
            {formatNumber(center)}
            {region.ci_low !== undefined && region.ci_high !== undefined && (
              <span className="text-ink-mute font-normal ml-1.5 text-xs">
                ({formatNumber(region.ci_low)}–{formatNumber(region.ci_high)})
              </span>
            )}
          </p>
        </div>
        {/* CI band visualization */}
        <div className="relative h-2 rounded-full bg-paper-sunk overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 rounded-full"
            style={{
              left: `${Math.max(0, 50 - ciPct / 2)}%`,
              right: `${Math.max(0, 50 - ciPct / 2)}%`,
              background: "var(--accent-soft)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 w-[2px] -ml-px"
            style={{ background: "var(--accent)" }}
          />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute right-3 top-3 size-2 rounded-full animate-pulse-soft"
        style={{ background: region.health === "cold" ? "var(--signal-warn)" : "var(--signal-ok)" }}
      />
    </motion.article>
  );
}
