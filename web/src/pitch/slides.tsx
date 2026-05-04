import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Region, Savings } from "../lib/types";
import { formatGrams, formatNumber, formatPercent, formatUSD } from "../lib/format";

export interface SlideContext {
  regions: Region[];
  savings: Savings;
  isLive: boolean;
}

export interface SlideDef {
  id: string;
  title: string;
  notes: string;
  render: (ctx: SlideContext) => ReactNode;
  background?: "default" | "ink" | "accent" | "paper";
}

const SlideShell = ({
  eyebrow,
  children,
  align = "left",
}: {
  eyebrow?: string;
  children: ReactNode;
  align?: "left" | "center";
}) => (
  <div
    className={`w-full h-full flex flex-col ${
      align === "center" ? "items-center justify-center text-center" : "justify-center"
    } px-[6vw] py-[5vh]`}
  >
    {eyebrow && (
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="label-eyebrow"
      >
        {eyebrow}
      </motion.p>
    )}
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
      }}
    >
      {children}
    </motion.div>
  </div>
);

const Reveal = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 14 },
      show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const slides: SlideDef[] = [
  {
    id: "title",
    title: "Pratidhwani",
    notes:
      "Open with the name. The Hindi subtitle is intentional — your traffic, pre-echoed. Pause two beats before next slide.",
    background: "ink",
    render: () => (
      <div className="relative w-full h-full text-paper overflow-hidden">
        {/* Concentric arcs evoking a sound echo */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
        >
          {[140, 230, 340, 470, 620, 800, 1000].map((r, i) => (
            <motion.circle
              key={r}
              cx={1180}
              cy={760}
              r={r}
              fill="none"
              stroke="rgba(245,241,232,0.10)"
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.4, delay: i * 0.12, ease: "easeOut" }}
            />
          ))}
          <motion.circle
            cx={1180}
            cy={760}
            r={6}
            fill="var(--accent)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </svg>
        <div className="relative z-10 h-full flex flex-col justify-between px-[7vw] py-[7vh]">
          <div className="flex items-center gap-3 text-paper/70 font-mono text-xs uppercase tracking-[0.3em]">
            <span>Pratidhwani · v0.1</span>
            <span aria-hidden="true">/</span>
            <span>capstone defense</span>
          </div>
          <div>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="font-deva text-2xl text-paper/70"
            >
              प्रतिध्वनि — आपके ट्रैफ़िक की पूर्व-प्रतिध्वनि
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="font-display text-[clamp(3rem,9vw,8.5rem)] leading-[0.9] tracking-tightest mt-3"
            >
              Pratidhwani.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-6 text-paper/80 max-w-3xl text-balance text-xl md:text-2xl font-light"
            >
              A predictive, carbon-aware serverless gateway. Pre-echoes traffic five minutes ahead,
              cuts the cold-start tail, and routes each request through latency, grid carbon, and
              price — together.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm"
          >
            <div>
              <p className="label-eyebrow text-paper/60">presented by</p>
              <p className="mt-1 font-medium">Lakshay Sharma</p>
            </div>
            <div>
              <p className="label-eyebrow text-paper/60">enrolment</p>
              <p className="mt-1 font-mono">GF202216641</p>
            </div>
            <div>
              <p className="label-eyebrow text-paper/60">programme</p>
              <p className="mt-1">B.Tech CSE · Cloud Computing</p>
            </div>
            <div>
              <p className="label-eyebrow text-paper/60">institution</p>
              <p className="mt-1">Shoolini University · Solan, H.P.</p>
            </div>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: "hook",
    title: "The cold-start tail.",
    notes: "Open emotional. The story is: serverless is fast except when it isn't, and that's the whole pitch.",
    render: () => (
      <SlideShell eyebrow="Why this exists">
        <Reveal>
          <h2 className="font-display text-display-xl tracking-tightest text-balance">
            Slow on the first hit.
          </h2>
        </Reveal>
        <Reveal>
          <p className="mt-6 text-2xl md:text-3xl text-ink-soft max-w-4xl text-pretty leading-snug">
            The cold-start tail of a serverless request makes a fast architecture feel slow. The
            user does not blame the cloud — they blame your product.
          </p>
        </Reveal>
        <Reveal>
          <p className="mt-8 font-mono text-sm text-ink-mute max-w-3xl text-pretty">
            Peer-reviewed measurements show 53–68% of average function startup latency is
            recoverable headroom over state-of-the-art production schedulers — yet schedulers
            leave it on the table.
          </p>
        </Reveal>
        <Reveal>
          <p className="mt-3 font-mono text-xs text-ink-mute">
            References — [8] Yu et al., RainbowCake, ASPLOS '24 (68%) · [9] Zhou et al.,
            Multi-Level Container Reuse, IPDPS '24 (53%).
          </p>
        </Reveal>
      </SlideShell>
    ),
  },
  {
    id: "problem",
    title: "Two costs, both invisible.",
    notes:
      "Frame the dual cost. Latency costs the user; carbon costs the planet. Most schedulers see one or the other.",
    render: () => (
      <SlideShell eyebrow="The problem">
        <Reveal>
          <h2 className="font-display text-display-lg tracking-tightest text-balance">
            Serverless has <span className="text-accent">two invisible costs</span>.
          </h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-5xl">
          <Reveal className="border-l-2 border-signal-latency pl-6">
            <p className="label-eyebrow" style={{ color: "var(--signal-latency)" }}>
              cost the user pays
            </p>
            <p className="mt-3 font-display text-display-md tracking-tight">
              Cold-start tail latency.
            </p>
            <p className="mt-3 text-ink-soft text-pretty">
              Pre-warming pings, snapshot restore, container caching — each optimizes one function
              with static heuristics. None combine temporal, geo, and tenant-class signals or honor
              a confidence-weighted budget.
            </p>
          </Reveal>
          <Reveal className="border-l-2 border-signal-carbon pl-6">
            <p className="label-eyebrow" style={{ color: "var(--signal-carbon)" }}>
              cost the planet pays
            </p>
            <p className="mt-3 font-display text-display-md tracking-tight">
              Grid-carbon mismatch.
            </p>
            <p className="mt-3 text-ink-soft text-pretty">
              Carbon-aware schedulers — Carbon Explorer [11], CASPER [12], GreenCourier [13],
              CASA [14] — each drop one of latency-budget, carbon, or spot-price. None do
              request-level FaaS routing across all three together.
            </p>
          </Reveal>
        </div>
        <Reveal>
          <p className="mt-10 font-mono text-xs text-ink-mute max-w-5xl">
            References — [11] Acun et al., ASPLOS '23 · [12] Souza et al., IGSC '23 ·
            [13] Chadha et al., WOSC '23 · [14] Qi et al., IGSC '24.
          </p>
        </Reveal>
      </SlideShell>
    ),
  },
  {
    id: "gap1",
    title: "Gap 1 — Adaptive multi-signal cold-start mitigation",
    notes:
      "Be specific about what existing work misses: combined signals, confidence weighting, transfer.",
    render: () => (
      <SlideShell eyebrow="Research gap 1">
        <Reveal>
          <h2 className="font-display text-display-lg tracking-tightest text-balance max-w-5xl">
            Existing pre-warming optimizes <em>per function</em>. Real workloads ride{" "}
            <em>combined</em> signals.
          </h2>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-6 max-w-5xl">
          {[
            {
              tag: "missing",
              h: "Multi-signal fusion",
              p: "Hour of day × geography × tenant class. Per-function predictors [4], [5], [8] see only the first.",
            },
            {
              tag: "missing",
              h: "Confidence-weighted budget",
              p: "Pre-warm only when CI × cold-cost > warm-budget. AQUATOPE [7] is the only system that reasons about uncertainty — and only inside one workflow.",
            },
            {
              tag: "missing",
              h: "Cross-function transfer",
              p: "Multi-Level Container Reuse [9] shares warm containers across similar functions, but never transfers prediction models across tenants.",
            },
          ].map((b) => (
            <Reveal key={b.h} className="card p-5">
              <p className="label-eyebrow" style={{ color: "var(--accent)" }}>{b.tag}</p>
              <p className="font-display text-xl mt-2">{b.h}</p>
              <p className="mt-2 text-sm text-ink-soft">{b.p}</p>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-10 font-mono text-xs text-ink-mute max-w-5xl">
            References — [4] Roy et al., IceBreaker, ASPLOS '22 · [5] Yang et al., INFless,
            ASPLOS '22 · [7] Zhou et al., AQUATOPE, ASPLOS '23 · [8] Yu et al., RainbowCake,
            ASPLOS '24 · [9] Zhou et al., Multi-Level Container Reuse, IPDPS '24.
          </p>
        </Reveal>
      </SlideShell>
    ),
  },
  {
    id: "gap2",
    title: "Gap 2 — Multi-objective request-level routing on FaaS",
    notes: "The novelty: nobody does request-level latency × carbon × cost on live serverless.",
    render: () => (
      <SlideShell eyebrow="Research gap 2">
        <Reveal>
          <h2 className="font-display text-display-lg tracking-tightest text-balance max-w-5xl">
            Carbon-aware schedulers exist. None route <em>live</em> serverless requests.
          </h2>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-2 gap-8 max-w-5xl">
          <Reveal className="card p-6">
            <p className="label-eyebrow">prior work · single-axis or non-FaaS</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><span className="font-mono">Carbon Explorer [11]</span> · datacenter design, batch shifting</li>
              <li><span className="font-mono">CASPER [12]</span> · web-service migration, drops cost</li>
              <li><span className="font-mono">GreenCourier [13]</span> · FaaS, carbon-only</li>
              <li><span className="font-mono">CASA [14]</span> · single-cluster autoscaling</li>
              <li><span className="font-mono">EcoLife [15]</span> · embodied carbon, hardware tier</li>
              <li><span className="font-mono">LowCarb [16]</span> · single-region keep-alive vs carbon</li>
            </ul>
          </Reveal>
          <Reveal className="card p-6 relative">
            <span
              aria-hidden="true"
              className="absolute -top-3 left-6 pill"
              style={{ background: "var(--accent)", color: "var(--paper)", borderColor: "var(--accent)" }}
            >
              Pratidhwani
            </span>
            <p className="label-eyebrow" style={{ color: "var(--accent)" }}>
              this work · interactive FaaS
            </p>
            <p className="mt-4 font-mono text-sm leading-relaxed text-ink-soft">
              score(r) = w<sub>lat</sub> · p̂<sub>95</sub>(r) +<br />
              &nbsp;&nbsp;&nbsp;&nbsp;w<sub>carbon</sub> · ĉ(r) +<br />
              &nbsp;&nbsp;&nbsp;&nbsp;w<sub>cost</sub> · p̂(r)
            </p>
            <p className="mt-4 text-sm text-ink-soft">
              Per-request, sub-millisecond, p95-budgeted, with tenant-tunable weights. No prior
              system simultaneously honors all three live.
            </p>
          </Reveal>
        </div>
        <Reveal>
          <p className="mt-10 font-mono text-xs text-ink-mute max-w-5xl">
            References — [11] Acun et al., ASPLOS '23 · [12] Souza et al., IGSC '23 ·
            [13] Chadha et al., WOSC '23 · [14] Qi et al., IGSC '24 · [15] Jiang et al., SC '24 ·
            [16] Roy &amp; Tiwari, HPCA '26.
          </p>
        </Reveal>
      </SlideShell>
    ),
  },
  {
    id: "solution",
    title: "Solution — a drop-in HTTP gateway.",
    notes: "Keep architecture concrete: three Cloud Run services, asia-south1, real region URLs at demo time.",
    render: () => (
      <SlideShell eyebrow="What we built">
        <Reveal>
          <h2 className="font-display text-display-lg tracking-tightest text-balance">
            A drop-in HTTP gateway over multi-region Cloud Run.
          </h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              n: "1",
              h: "Forecast",
              p: "Per-region load with Holt-Winters + EWMA blend. Confidence interval per tick.",
            },
            {
              n: "2",
              h: "Pre-warm",
              p: "Calibrated ping budget when CI × cold-cost crosses the warm-budget threshold.",
            },
            {
              n: "3",
              h: "Route",
              p: "Multi-objective scorer — latency · carbon · cost — weights tunable per tenant.",
            },
          ].map((s) => (
            <Reveal key={s.n} className="card p-6 relative">
              <span
                aria-hidden="true"
                className="absolute -top-4 -left-2 font-display text-[6rem] leading-none text-paper-sunk select-none"
              >
                {s.n}
              </span>
              <p className="font-display text-2xl tracking-tight relative">{s.h}</p>
              <p className="mt-2 text-ink-soft relative">{s.p}</p>
            </Reveal>
          ))}
        </div>
      </SlideShell>
    ),
  },
  {
    id: "architecture",
    title: "Architecture — three Cloud Run services, asia-south1.",
    notes: "Concrete: pratidhwani-db, -api, -web. Public ingress only on web.",
    render: () => (
      <SlideShell eyebrow="System architecture">
        <Reveal>
          <h2 className="font-display text-display-md tracking-tightest text-balance">
            Three Cloud Run services. One region. Strict ingress.
          </h2>
        </Reveal>
        <Reveal className="mt-10">
          <ArchitectureDiagram />
        </Reveal>
        <Reveal>
          <p className="mt-6 font-mono text-xs text-ink-mute max-w-5xl">
            Carbon-intensity figures are a daily snapshot from Electricity Maps, mid-2024.
            Pricing tracked against{" "}
            <span className="underline decoration-dotted">cloud.google.com/run/pricing</span>.
          </p>
        </Reveal>
      </SlideShell>
    ),
  },
  {
    id: "math",
    title: "Forecaster + scorer math.",
    notes: "Walk through the equation slowly. The audience cares that there is real math here.",
    render: () => (
      <SlideShell eyebrow="The math">
        <Reveal>
          <h2 className="font-display text-display-lg tracking-tightest text-balance">
            Two equations. Predictable everything else.
          </h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-5xl">
          <Reveal className="card p-6">
            <p className="label-eyebrow mb-3">Forecast — per region, 5-min lookahead</p>
            <p className="font-mono text-sm leading-relaxed text-ink-soft">
              q̂<sub>t+1</sub>(r) = α · HW<sub>24h</sub>(r) + (1 − α) · EWMA<sub>10m</sub>(r)
              <br />
              CI = ±1.96 · σ<sub>residual</sub>
            </p>
            <p className="mt-3 text-sm text-ink-mute">
              Holt-Winters captures diurnal + weekly cycles; EWMA reacts to local bursts.
            </p>
          </Reveal>
          <Reveal className="card p-6">
            <p className="label-eyebrow mb-3">Score — per request, all candidate regions</p>
            <p className="font-mono text-sm leading-relaxed text-ink-soft">
              score(r) =<br />
              &nbsp;&nbsp;w<sub>lat</sub> · p95̂<sub>norm</sub>(r) +<br />
              &nbsp;&nbsp;w<sub>carbon</sub> · carbon<sub>norm</sub>(r) +<br />
              &nbsp;&nbsp;w<sub>cost</sub> · price<sub>norm</sub>(r)
            </p>
            <p className="mt-3 text-sm text-ink-mute">
              Min-max normalized per tick. Lowest score wins. Budget-violating regions are vetoed
              before the scorer sees them.
            </p>
          </Reveal>
        </div>
      </SlideShell>
    ),
  },
  {
    id: "live-numbers",
    title: "Live numbers, right now.",
    notes: "If the API is reachable, the numbers update on screen. Otherwise we fall back to demo numbers.",
    render: ({ savings, isLive }) => (
      <SlideShell eyebrow={isLive ? "live · pulled at slide load" : "demo data"}>
        <Reveal>
          <h2 className="font-display text-display-lg tracking-tightest text-balance">
            Today’s numbers from the deployed system.
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl">
          {[
            { l: "cold-starts averted", v: formatNumber(savings.cold_starts_averted_today) },
            { l: "carbon saved", v: formatGrams(savings.gco2_saved_today) },
            { l: "cost saved", v: formatUSD(savings.usd_saved_today) },
            { l: "p95 reduction", v: formatPercent(savings.p95_reduction_pct) },
          ].map((m, i) => (
            <Reveal key={m.l}>
              <div className="card p-6">
                <p className="label-eyebrow">{m.l}</p>
                <p className="num-tabular font-display text-display-md mt-3 leading-none">
                  {m.v}
                </p>
                <p className="text-xs text-ink-mute mt-3 num-tabular">
                  vs round-robin · slide #{i + 1}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </SlideShell>
    ),
  },
  {
    id: "demo",
    title: "Live region map.",
    notes: "Show the three regions, their forecast, and how the slider rebalances.",
    render: ({ regions, isLive }) => (
      <SlideShell eyebrow={isLive ? "live · 3 regions" : "demo · 3 regions"}>
        <Reveal>
          <h2 className="font-display text-display-md tracking-tightest text-balance">
            Three regions. Each with a forecast and a confidence band.
          </h2>
        </Reveal>
        <Reveal className="mt-10">
          <div className="grid md:grid-cols-3 gap-5">
            {regions.map((r) => (
              <div key={r.id} className="card p-5">
                <p className="label-eyebrow">{r.gcp_region}</p>
                <p className="font-display text-2xl mt-1">{r.name}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-sm num-tabular">
                  <div>
                    <dt className="text-ink-mute text-xs">lat</dt>
                    <dd>{r.base_latency_ms}<span className="text-ink-mute text-xs">ms</span></dd>
                  </div>
                  <div>
                    <dt className="text-ink-mute text-xs">CO₂</dt>
                    <dd>{r.carbon_g_per_kwh}<span className="text-ink-mute text-xs">g</span></dd>
                  </div>
                  <div>
                    <dt className="text-ink-mute text-xs">$/M</dt>
                    <dd>{r.price_per_million.toFixed(2)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm">
                  <span className="text-ink-mute text-xs">QPS · 5min</span>{" "}
                  <span className="num-tabular ml-1 font-medium">{formatNumber(r.predicted_qps ?? 0)}</span>{" "}
                  <span className="text-ink-mute text-xs">
                    ({formatNumber(r.ci_low ?? 0)}–{formatNumber(r.ci_high ?? 0)})
                  </span>
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </SlideShell>
    ),
  },
  {
    id: "stack",
    title: "Stack — what runs where.",
    notes: "Frontend on nginx Cloud Run, FastAPI for forecaster + scorer, PocketBase + GCS-Fuse for state.",
    render: () => (
      <SlideShell eyebrow="Implementation">
        <Reveal>
          <h2 className="font-display text-display-lg tracking-tightest text-balance">
            Stack. Boring on purpose.
          </h2>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            {
              h: "pratidhwani-web",
              s: "Vite · React · TypeScript · nginx",
              p: "Static container, /api proxy_pass, hardened headers, 256 MiB.",
            },
            {
              h: "pratidhwani-api",
              s: "Python 3.12 · FastAPI · uvicorn · statsmodels",
              p: "Forecaster, scorer, gateway, decision logger. Internal-only ingress.",
            },
            {
              h: "pratidhwani-db",
              s: "PocketBase 0.22 · SQLite · GCS Fuse",
              p: "Single binary; data on a mounted bucket. Internal-only ingress.",
            },
          ].map((s) => (
            <Reveal key={s.h} className="card p-6">
              <p className="font-mono text-sm" style={{ color: "var(--accent)" }}>{s.h}</p>
              <p className="mt-2 text-sm font-medium">{s.s}</p>
              <p className="mt-3 text-sm text-ink-soft">{s.p}</p>
            </Reveal>
          ))}
        </div>
      </SlideShell>
    ),
  },
  {
    id: "why-now",
    title: "Why now — and why this matters for India 2047.",
    notes: "Tie back to mission. Serverless adoption is rising; grid-carbon intensity varies sharply across regions.",
    background: "accent",
    render: () => (
      <div className="w-full h-full flex flex-col justify-center px-[7vw] py-[6vh] text-paper">
        <Reveal>
          <p className="label-eyebrow text-paper/70">why this matters</p>
        </Reveal>
        <Reveal>
          <h2 className="font-display text-display-xl tracking-tightest mt-4 text-balance leading-[0.95]">
            Carbon intensity ranges 5× across regions. Routers ignore it.
          </h2>
        </Reveal>
        <Reveal>
          <p className="mt-8 text-2xl text-paper/85 max-w-4xl text-pretty">
            A gateway that schedules around a region’s grid intensity, not despite it, is the kind
            of infrastructure India 2047 needs as a default — not a feature flag.
          </p>
        </Reveal>
        <Reveal>
          <p className="mt-6 font-mono text-xs text-paper/60 max-w-4xl">
            asia-south1 (Mumbai) 700 vs europe-west1 (St.Ghislain) 140 gCO₂/kWh — Electricity
            Maps daily snapshot, mid-2024. Carbon-aware FaaS scheduling shows 13–70%
            reductions depending on the policy [12], [13].
          </p>
        </Reveal>
        <Reveal>
          <p className="mt-8 font-mono text-sm text-paper/60">
            #AatmanirbharBharat · @India2047
          </p>
        </Reveal>
      </div>
    ),
  },
  {
    id: "roadmap",
    title: "Roadmap.",
    notes: "Three near-term milestones. Be specific.",
    render: () => (
      <SlideShell eyebrow="Roadmap">
        <Reveal>
          <h2 className="font-display text-display-lg tracking-tightest text-balance">
            What ships next.
          </h2>
        </Reveal>
        <ol className="mt-10 max-w-4xl space-y-5">
          {[
            {
              when: "Q3 ‘26",
              h: "Multi-tenant isolation",
              p: "Per-tenant weight histories, SLO budgets, and a bring-your-own-region adapter.",
            },
            {
              when: "Q4 ‘26",
              h: "Cross-function transfer learning",
              p: "Embed traffic shape per function; let a forecaster generalize across siblings.",
            },
            {
              when: "Q1 ‘27",
              h: "Open-source the gateway",
              p: "Apache-2.0 release, Terraform module for GCP, AWS Lambda + Knative shims.",
            },
          ].map((s, i) => (
            <Reveal key={s.h}>
              <li className="grid grid-cols-[5rem_1fr] gap-5 border-b border-ink-line pb-5">
                <p className="font-mono text-sm" style={{ color: "var(--accent)" }}>
                  {String(i + 1).padStart(2, "0")}
                  <br />
                  <span className="text-ink-mute">{s.when}</span>
                </p>
                <div>
                  <p className="font-display text-xl">{s.h}</p>
                  <p className="text-ink-soft text-sm mt-1">{s.p}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </SlideShell>
    ),
  },
  {
    id: "thanks",
    title: "Thanks. Q&A.",
    notes: "Close on credits. Project URL on screen, real not vapor.",
    background: "ink",
    render: () => (
      <div className="w-full h-full text-paper relative overflow-hidden">
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
        >
          {[120, 200, 290, 400, 540, 700, 880].map((r, i) => (
            <motion.circle
              key={r}
              cx={400}
              cy={150}
              r={r}
              fill="none"
              stroke="rgba(245,241,232,0.10)"
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: i * 0.1 }}
            />
          ))}
        </svg>
        <div className="relative z-10 h-full flex flex-col justify-between px-[7vw] py-[8vh]">
          <p className="label-eyebrow text-paper/60">/end</p>
          <div>
            <h2 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-tightest">
              Thank you.
            </h2>
            <p className="mt-6 text-2xl text-paper/80 max-w-3xl">
              Questions, scrutiny, sharper objections — all welcome.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="label-eyebrow text-paper/60">live demo</p>
              <p className="mt-1 font-mono">
                <a
                  href="https://pratidhwani.dmj.one"
                  className="underline decoration-paper/30 hover:decoration-accent"
                >
                  pratidhwani.dmj.one
                </a>
              </p>
            </div>
            <div>
              <p className="label-eyebrow text-paper/60">contact</p>
              <p className="mt-1">Lakshay Sharma · GF202216641</p>
            </div>
            <div>
              <p className="label-eyebrow text-paper/60">capstone mentor</p>
              <p className="mt-1 italic text-paper/70">Dr. Kritika Rana</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 1100 360" className="w-full max-w-5xl" aria-label="System architecture diagram">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--ink-soft)" />
        </marker>
      </defs>

      {/* User */}
      <g>
        <circle cx="60" cy="180" r="22" fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" />
        <text x="60" y="225" textAnchor="middle" className="font-mono" fill="var(--ink-soft)" fontSize="11">user</text>
      </g>

      {/* Edge -> Gateway */}
      <line x1="90" y1="180" x2="190" y2="180" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#arr)" />

      {/* Gateway */}
      <g>
        <rect x="200" y="120" width="220" height="120" rx="10" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="310" y="150" textAnchor="middle" className="font-display" fill="var(--ink)" fontSize="18" fontWeight="600">pratidhwani-api</text>
        <text x="310" y="172" textAnchor="middle" fontSize="11" fill="var(--ink-mute)" className="font-mono">forecast · pre-warm · score</text>
        <text x="310" y="200" textAnchor="middle" fontSize="11" fill="var(--ink-soft)">FastAPI · uvicorn · statsmodels</text>
        <text x="310" y="220" textAnchor="middle" fontSize="10" fill="var(--ink-mute)" className="font-mono">internal ingress</text>
      </g>

      {/* DB below gateway */}
      <line x1="310" y1="240" x2="310" y2="290" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#arr)" />
      <g>
        <rect x="200" y="290" width="220" height="60" rx="10" fill="var(--paper-raised)" stroke="var(--ink-line)" />
        <text x="310" y="316" textAnchor="middle" className="font-display" fontSize="14" fill="var(--ink)">pratidhwani-db</text>
        <text x="310" y="334" textAnchor="middle" fontSize="10" fill="var(--ink-mute)" className="font-mono">PocketBase · GCS Fuse</text>
      </g>

      {/* Three regions */}
      <line x1="420" y1="180" x2="510" y2="80" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#arr)" />
      <line x1="420" y1="180" x2="510" y2="180" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#arr)" />
      <line x1="420" y1="180" x2="510" y2="280" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#arr)" />

      {[
        { x: 520, y: 50, name: "asia-south1", note: "Mumbai · 700 gCO₂/kWh" },
        { x: 520, y: 150, name: "europe-west1", note: "St.Ghislain · 140 gCO₂/kWh" },
        { x: 520, y: 250, name: "us-central1", note: "Council Bluffs · 410 gCO₂/kWh" },
      ].map((r) => (
        <g key={r.name}>
          <rect x={r.x} y={r.y} width="240" height="60" rx="10" fill="var(--paper-raised)" stroke="var(--ink-line)" />
          <text x={r.x + 16} y={r.y + 26} fontSize="13" className="font-mono" fill="var(--ink)">{r.name}</text>
          <text x={r.x + 16} y={r.y + 46} fontSize="11" fill="var(--ink-mute)">{r.note}</text>
        </g>
      ))}

      {/* Right: web service */}
      <line x1="760" y1="80" x2="850" y2="80" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#arr)" />
      <line x1="760" y1="180" x2="850" y2="180" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#arr)" />
      <line x1="760" y1="280" x2="850" y2="280" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#arr)" />

      <g>
        <rect x="850" y="120" width="220" height="120" rx="10" fill="var(--paper-raised)" stroke="var(--ink-line)" strokeWidth="1.5" />
        <text x="960" y="150" textAnchor="middle" className="font-display" fontSize="18" fontWeight="600">pratidhwani-web</text>
        <text x="960" y="172" textAnchor="middle" fontSize="11" fill="var(--ink-mute)" className="font-mono">dashboard · /pitch · /report</text>
        <text x="960" y="200" textAnchor="middle" fontSize="11" fill="var(--ink-soft)">React · nginx · CSP/HSTS</text>
        <text x="960" y="220" textAnchor="middle" fontSize="10" fill="var(--ink-mute)" className="font-mono">public ingress</text>
      </g>
    </svg>
  );
}
