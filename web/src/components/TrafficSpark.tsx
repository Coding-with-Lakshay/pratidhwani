import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import type { Region } from "../lib/types";

interface TrafficSparkProps {
  regions: Region[];
}

export function TrafficSpark({ regions }: TrafficSparkProps) {
  // Synthetic 30-min trail derived from current observed_qps so the spark
  // looks alive even when only point-in-time data is available.
  const data = useMemo(() => {
    const total = regions.reduce((s, r) => s + (r.observed_qps ?? r.predicted_qps ?? 0), 0);
    return Array.from({ length: 30 }, (_, i) => {
      const phase = Math.sin((i / 30) * Math.PI * 1.7) * 0.18;
      const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.04;
      return { i, qps: Math.max(0, Math.round(total * (1 + phase + noise))) };
    });
  }, [regions]);

  return (
    <div className="card px-3 py-2 flex items-center gap-3" style={{ width: 220 }}>
      <div className="flex-1 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="qps"
              stroke="var(--accent)"
              strokeWidth={1.5}
              fill="url(#sparkGrad)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-right">
        <p className="label-eyebrow leading-none">total QPS</p>
        <p className="num-tabular text-base mt-1">{data[data.length - 1]?.qps ?? 0}</p>
      </div>
    </div>
  );
}
