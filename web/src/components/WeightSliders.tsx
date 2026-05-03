import { useEffect, useRef, useState } from "react";
import type { Weights } from "../lib/types";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";

interface WeightSlidersProps {
  initial: Weights;
  onChange: (w: Weights) => void;
}

const KEYS: Array<{ key: keyof Weights; label: string; tone: string; help: string }> = [
  { key: "w_lat", label: "Latency", tone: "var(--signal-latency)", help: "p95 budget" },
  { key: "w_carbon", label: "Carbon", tone: "var(--signal-carbon)", help: "gCO₂/kWh" },
  { key: "w_cost", label: "Cost", tone: "var(--signal-cost)", help: "$ / req" },
];

function normalize(w: Weights): Weights {
  const sum = w.w_lat + w.w_carbon + w.w_cost;
  if (sum === 0) return { w_lat: 1 / 3, w_carbon: 1 / 3, w_cost: 1 / 3 };
  return {
    w_lat: w.w_lat / sum,
    w_carbon: w.w_carbon / sum,
    w_cost: w.w_cost / sum,
    updated_ts: w.updated_ts,
  };
}

export function WeightSliders({ initial, onChange }: WeightSlidersProps) {
  const [w, setW] = useState<Weights>(initial);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const debouncedPush = useDebouncedCallback((next: Weights) => {
    onChangeRef.current(normalize(next));
  }, 350);

  const update = (key: keyof Weights, raw: number) => {
    const next = { ...w, [key]: raw };
    setW(next);
    debouncedPush(next);
  };

  const sum = w.w_lat + w.w_carbon + w.w_cost;
  const norm = normalize(w);

  return (
    <fieldset className="card p-5">
      <legend className="label-eyebrow mb-4 px-1">Routing weights</legend>
      <div className="space-y-5">
        {KEYS.map(({ key, label, tone, help }) => {
          const id = `w-${key}`;
          const raw = w[key] as number;
          const normalized = norm[key] as number;
          return (
            <div key={key}>
              <label htmlFor={id} className="flex items-baseline justify-between mb-2">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ background: tone }}
                  />
                  <span className="font-medium text-sm">{label}</span>
                  <span className="text-ink-mute text-xs">· {help}</span>
                </span>
                <span className="num-tabular text-sm font-medium">
                  {(normalized * 100).toFixed(0)}%
                </span>
              </label>
              <input
                id={id}
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={raw}
                onChange={(e) => update(key, parseFloat(e.target.value))}
                aria-valuetext={`${(normalized * 100).toFixed(0)} percent`}
                className="w-full accent-accent"
                style={{ accentColor: tone }}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-xs text-ink-mute num-tabular">
        Raw sum: {sum.toFixed(2)} · auto-normalized to 1.00 before posting to{" "}
        <code className="font-mono">/api/v1/weights</code>
      </p>
    </fieldset>
  );
}
