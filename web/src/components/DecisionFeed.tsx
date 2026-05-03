import { AnimatePresence, motion } from "framer-motion";
import { useTick } from "../hooks/useTick";
import { formatTimeAgo } from "../lib/format";
import type { Decision } from "../lib/types";

const typeGlyph: Record<Decision["request_type"], string> = {
  light: "·",
  heavy: "■",
  "gpu-mock": "◆",
};

const regionShort = (r: string) => {
  if (r.startsWith("asia-south")) return "MUM";
  if (r.startsWith("europe-west")) return "EUW";
  if (r.startsWith("us-central")) return "USC";
  if (r.startsWith("asia-northeast")) return "TOK";
  return r.slice(0, 6).toUpperCase();
};

interface DecisionFeedProps {
  decisions: Decision[];
}

export function DecisionFeed({ decisions }: DecisionFeedProps) {
  const now = useTick(1000);
  return (
    <div className="card divide-y divide-ink-line max-h-[34rem] overflow-y-auto scrollbar-quiet">
      <header className="sticky top-0 bg-paper-raised/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-ink-line z-10">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-signal-ok animate-pulse-soft"
          />
          <h3 className="font-display text-lg tracking-tight">Decision feed</h3>
        </div>
        <p className="label-eyebrow num-tabular">{decisions.length} live</p>
      </header>
      <ul className="divide-y divide-ink-line">
        <AnimatePresence initial={false}>
          {decisions.map((d) => (
            <motion.li
              key={d.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-3 grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 text-sm"
            >
              <span
                className="font-mono text-xs text-ink-mute num-tabular"
                title={new Date(d.ts).toLocaleString()}
              >
                {formatTimeAgo(d.ts, now)}
              </span>
              <span
                className="font-mono text-xs"
                aria-label={d.request_type}
                title={d.request_type}
              >
                {typeGlyph[d.request_type]} {d.request_type}
              </span>
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-medium num-tabular">{regionShort(d.chosen_region)}</span>
                <span className="text-ink-mute text-xs truncate">
                  {d.reasons?.slice(0, 2).join(" · ")}
                </span>
                {d.was_cold && (
                  <span className="pill" style={{ color: "var(--signal-warn)" }}>cold</span>
                )}
              </span>
              <span className="num-tabular text-xs text-ink-mute">
                {d.latency_observed_ms}ms · {d.score.toFixed(2)}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
        {decisions.length === 0 && (
          <li className="px-4 py-8 text-center text-ink-mute text-sm">
            Waiting for first decision…
          </li>
        )}
      </ul>
    </div>
  );
}
