import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface MetricTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: { sign: "up" | "down" | "neutral"; value: string };
  accent?: "latency" | "carbon" | "cost" | "default";
}

const accentVar: Record<NonNullable<MetricTileProps["accent"]>, string> = {
  latency: "var(--signal-latency)",
  carbon: "var(--signal-carbon)",
  cost: "var(--signal-cost)",
  default: "var(--ink)",
};

export function MetricTile({ label, value, hint, delta, accent = "default" }: MetricTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="card p-5 relative overflow-hidden"
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: accentVar[accent] }}
      />
      <p className="label-eyebrow">{label}</p>
      <div className="mt-3 num-tabular font-display text-display-md leading-none">
        {value}
      </div>
      {hint && <p className="mt-2 text-xs text-ink-mute num-tabular">{hint}</p>}
      {delta && (
        <p
          className="mt-3 text-xs font-medium num-tabular flex items-center gap-1.5"
          style={{
            color:
              delta.sign === "up"
                ? "var(--signal-ok)"
                : delta.sign === "down"
                  ? "var(--signal-warn)"
                  : "var(--ink-mute)",
          }}
        >
          <span aria-hidden="true">
            {delta.sign === "up" ? "▲" : delta.sign === "down" ? "▼" : "—"}
          </span>
          {delta.value}
        </p>
      )}
    </motion.div>
  );
}
