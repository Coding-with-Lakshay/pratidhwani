import { useEffect, useMemo, useRef, useState } from "react";
import { abbreviations } from "../report/abbreviations";
import { references } from "../report/references";

const TODAY = new Date().toLocaleDateString("en-IN", {
  year: "numeric",
  month: "long",
});

interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

const cite = (n: number) => (
  <a href={`#ref-${n}`} className="text-ink-soft hover:text-ink no-underline">
    [{n}]
  </a>
);

export function Report() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!bodyRef.current) return;
    const headings = bodyRef.current.querySelectorAll<HTMLHeadingElement>(
      "h2[id], h3[id]",
    );
    setToc(
      Array.from(headings).map((h) => ({
        id: h.id,
        text: h.textContent ?? "",
        level: h.tagName === "H2" ? 2 : 3,
      })),
    );
  }, []);

  useEffect(() => {
    if (!bodyRef.current) return;
    const headings = bodyRef.current.querySelectorAll<HTMLHeadingElement>(
      "h2[id], h3[id]",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  const figures = useMemo(
    () => [
      { id: "fig-arch", n: 1, t: "Three-service Cloud Run topology of Pratidhwani in asia-south1." },
      { id: "fig-flow", n: 2, t: "End-to-end request flow through forecaster, scorer, and gateway." },
      { id: "fig-scorer", n: 3, t: "Per-tick min-max normalization across active candidate regions." },
      { id: "fig-replay", n: 4, t: "24-hour replay: p95 latency of Pratidhwani vs round-robin baseline." },
    ],
    [],
  );

  const tables = useMemo(
    () => [
      { id: "tab-fr", n: 1, t: "Functional requirements (FR-1 to FR-9)." },
      { id: "tab-nfr", n: 2, t: "Non-functional requirements." },
      { id: "tab-stack", n: 3, t: "Service-by-service implementation stack." },
      { id: "tab-savings", n: 4, t: "Aggregate replay deltas across the 24-hour window." },
      { id: "tab-collections", n: 5, t: "PocketBase collections and primary fields." },
    ],
    [],
  );

  return (
    <div className="container-wide py-6 md:py-10">
      <div className="grid lg:grid-cols-[16rem_1fr] gap-8">
        <aside aria-label="Report navigation" className="no-print lg:sticky lg:top-20 self-start">
          <div className="card p-4">
            <p className="label-eyebrow mb-3">Contents</p>
            <ol className="space-y-1.5 text-sm max-h-[70vh] overflow-y-auto scrollbar-quiet">
              {toc.map((e) => (
                <li key={e.id} className={e.level === 3 ? "pl-4" : ""}>
                  <a
                    href={`#${e.id}`}
                    className={`block py-1 transition-colors ${
                      activeId === e.id
                        ? "text-accent font-medium"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {e.text}
                  </a>
                </li>
              ))}
            </ol>
            <a
              href="/Pratidhwani-Capstone-Report.docx"
              download="Pratidhwani-Capstone-Report.docx"
              className="btn w-full justify-center mt-4"
              aria-label="Download capstone report in Microsoft Word format, exact Shoolini template layout"
            >
              <span aria-hidden="true">↓</span> Download .docx
            </a>
            <button
              type="button"
              className="btn w-full justify-center mt-2"
              onClick={() => window.print()}
            >
              <span aria-hidden="true">⎙</span> Print to PDF
            </button>
            <p className="text-xs text-ink-mute mt-3 leading-relaxed">
              The .docx is the exact Shoolini template with this report's content
              substituted in place; open in Word to print or to amend before
              binding. Use Print to PDF for an A4 print-ready copy of this page.
            </p>
          </div>
        </aside>

        <article ref={bodyRef} className="report-body max-w-3xl mx-auto">
          {/* TITLE PAGE — Shoolini-mandated layout */}
          <section
            className="title-page text-center pb-12 mb-12 border-b border-ink-line"
            aria-label="Title page"
          >
            <p className="label-eyebrow mt-4">Capstone Project Report</p>
            <h1 className="font-display text-display-lg tracking-tightest mt-8 text-balance">
              Pratidhwani — Predictive Carbon-Aware Serverless Gateway
            </h1>
            <p className="font-deva text-xl text-ink-mute mt-3">
              प्रतिध्वनि — आपके ट्रैफ़िक की पूर्व-प्रतिध्वनि
            </p>
            <p className="mt-12 text-base italic">
              Synopsis submitted for the partial fulfilment of the degree of
            </p>
            <p className="font-display text-2xl mt-3">Bachelor of Technology (CSE)</p>

            <div className="mt-16 grid sm:grid-cols-2 gap-8 text-left">
              <div>
                <p className="label-eyebrow">Name of Student</p>
                <p className="mt-2 font-medium">Anshuman Mohanty</p>
              </div>
              <div>
                <p className="label-eyebrow">Registration Number</p>
                <p className="mt-2 font-mono">GF202217744</p>
              </div>
              <div>
                <p className="label-eyebrow">Course with Specialization</p>
                <p className="mt-2">B.Tech CSE — Cloud Computing</p>
              </div>
              <div>
                <p className="label-eyebrow">Semester</p>
                <p className="mt-2 italic text-ink-mute">[Semester]</p>
              </div>
              <div className="sm:col-span-2">
                <p className="label-eyebrow">Capstone Mentor</p>
                <p className="mt-2 font-medium">Mr. Ashish</p>
              </div>
            </div>

            <div className="mt-20 space-y-1">
              <p className="font-display text-base font-semibold tracking-wide">
                YOGANANDA SCHOOL OF AI, COMPUTERS AND DATA SCIENCES
              </p>
              <p className="font-display text-base font-semibold tracking-wide">
                SHOOLINI UNIVERSITY OF BIOTECHNOLOGY AND MANAGEMENT SCIENCES
              </p>
              <p className="font-display text-base font-semibold tracking-wide">
                SOLAN, H.P., INDIA
              </p>
              <p className="text-sm text-ink-mute mt-4">{TODAY}</p>
            </div>
          </section>

          {/* FRONT MATTER */}
          <div className="front-matter">
            <section
              id="acknowledgement"
              className="chapter mb-10"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-2xl tracking-tight mb-4 chapter">
                Acknowledgement
              </h2>
              <p>
                I am grateful to my Capstone Mentor, Mr. Ashish, for steady guidance and rigorous
                criticism across the design, implementation, and evaluation of this project. I
                thank the Yogananda School of AI, Computers and Data Sciences at Shoolini
                University of Biotechnology and Management Sciences for the academic environment
                and the cloud compute access that made it feasible to deploy a multi-region
                serverless system as a student project.
              </p>
              <p className="mt-4">
                I acknowledge the open data published by Electricity Maps for grid carbon
                intensity, the Google Cloud Run team’s technical documentation for service-level
                primitives, and the open-source maintainers of FastAPI, PocketBase, React, Vite,
                and statsmodels — all load-bearing components of Pratidhwani. Finally, I thank my
                family for steady support through the long nights of debugging the cold-start
                tail.
              </p>
              <p className="mt-12 text-sm">— Anshuman Mohanty</p>
            </section>

            <section
              id="abstract"
              className="chapter mb-10"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-2xl tracking-tight mb-4 chapter">Abstract</h2>
              <p>
                Across sixteen peer-reviewed FaaS systems papers from 2020–2026, two complementary
                gaps stand open. <em>Gap 1 — adaptive multi-signal cold-start mitigation</em>:
                state-of-the-art warmers all train per function in a single region with static or
                short-window predictors, leaving sub-gap 1a (no confidence-weighted warming
                budget — only AQUATOPE {cite(7)} reasons about uncertainty, and only inside one
                workflow) and sub-gap 1b (no cross-function pattern transfer — Multi-Level
                Container Reuse {cite(9)} hints at it but never transfers prediction <em>models</em>).
                <em> Gap 2 — multi-objective request-level routing on FaaS</em> is equally open:
                carbon-aware schedulers consistently drop one of latency-budget, carbon, or
                spot-price (sub-gap 2a) and decouple routing from forecast-driven warming
                (sub-gap 2b), with CASPER {cite(12)} the closest predecessor (provisioning-level,
                no cost) and LowCarb {cite(16)} the closest cold-start ↔ carbon arbiter
                (single-region only). Pratidhwani is the first system that closes both gaps in one
                auditable control loop.
              </p>
              <p className="mt-3">
                Serverless platforms hide infrastructure but not its consequences. Cold-start
                latency tails frustrate interactive users; idle pre-warming wastes spend and
                embodied carbon; and request-level scheduling rarely accounts for grid carbon
                intensity. This report presents <em>Pratidhwani</em>, a predictive carbon-aware
                HTTP gateway that fronts multi-region Cloud Run services. Pratidhwani forecasts
                per-region request load with a Holt-Winters and EWMA blend, fires a
                confidence-weighted pre-warm budget, and routes each live request through a
                multi-objective scorer over latency, grid carbon, and regional spot price.
              </p>
              <p className="mt-3">
                A 24-hour replay across three Google Cloud regions —{" "}
                <code>asia-south1</code>, <code>europe-west1</code>, and{" "}
                <code>us-central1</code> — shows a 41.3% p95 latency reduction, a 23.8% reduction
                in grid carbon emitted, and a 31.4% compute cost reduction relative to a naive
                round-robin baseline on identical workloads. The system is implemented as three
                Cloud Run services in <code>asia-south1</code>: a React + nginx frontend, a
                FastAPI gateway, and a PocketBase database backed by a GCS-Fuse mounted volume.
                Two research gaps from the literature are closed in one auditable control loop:
                adaptive multi-signal cold-start mitigation with confidence-weighted budgets, and
                multi-objective request-level routing on FaaS that simultaneously honours latency
                budget, grid carbon, and spot price.
              </p>
              <p className="mt-3">
                <em>Index terms:</em> serverless, FaaS, cold-start, carbon-aware scheduling,
                multi-objective routing, Cloud Run, Holt-Winters, EWMA.
              </p>
            </section>

            <section
              id="toc"
              className="chapter mb-10"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-2xl tracking-tight mb-4 chapter">
                Table of Contents
              </h2>
              <ol className="space-y-1 text-sm">
                {toc
                  .filter((e) => e.id !== "toc")
                  .map((e) => (
                    <li
                      key={e.id}
                      className={
                        e.level === 3
                          ? "pl-6 grid grid-cols-[1fr_auto] gap-2"
                          : "grid grid-cols-[1fr_auto] gap-2 mt-2 font-medium"
                      }
                    >
                      <a href={`#${e.id}`} className="text-ink hover:text-accent">
                        {e.text}
                      </a>
                      <span className="text-ink-mute font-mono no-print">→</span>
                    </li>
                  ))}
              </ol>
              <p className="text-xs text-ink-mute mt-6 no-print">
                Auto-generated from the H2 / H3 headings in this document. Page numbers are
                resolved by the browser at print time using the running header.
              </p>
            </section>

            <section
              id="lof"
              className="chapter mb-10"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-2xl tracking-tight mb-4 chapter">
                List of Figures
              </h2>
              <ol className="space-y-1.5 text-sm">
                {figures.map((f) => (
                  <li key={f.id} className="grid grid-cols-[5rem_1fr] gap-2">
                    <span className="font-mono">Fig. {f.n}.</span>
                    <a href={`#${f.id}`} className="text-ink-soft hover:text-ink">
                      {f.t}
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <section
              id="lot"
              className="chapter mb-10"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-2xl tracking-tight mb-4 chapter">
                List of Tables
              </h2>
              <ol className="space-y-1.5 text-sm">
                {tables.map((t) => (
                  <li key={t.id} className="grid grid-cols-[5rem_1fr] gap-2">
                    <span className="font-mono">Table {t.n}.</span>
                    <a href={`#${t.id}`} className="text-ink-soft hover:text-ink">
                      {t.t}
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <section
              id="abbr"
              className="chapter mb-10"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-2xl tracking-tight mb-4 chapter">
                List of Abbreviations
              </h2>
              <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1.5 text-sm">
                {abbreviations.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="font-mono">{k}</dt>
                    <dd className="text-ink-soft">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* BODY MATTER — 11 chapters per Shoolini template */}
          <div className="body-matter">
            {/* Chapter 1 */}
            <section
              id="ch1"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 1 · Introduction and Problem Definition
              </h2>

              <h3 id="ch1-1" className="font-display text-xl mt-8 mb-3">1.1 Background</h3>
              <p>
                Function-as-a-Service (FaaS) platforms decouple the deployment artefact from the
                running compute. Operators provision capacity reactively, scaling instances in
                response to incoming requests. The convenience comes with a sharp cost: when a
                region has no warm instance for a given function, the first request pays for
                image fetch, runtime initialization, and user-code initialization — the
                well-known <em>cold-start tail</em>. In parallel, datacenter operators
                increasingly publish hourly grid carbon intensity for their regions, opening the
                door to placement policies that account for the operational carbon footprint of
                compute.
              </p>

              <h3 id="ch1-2" className="font-display text-xl mt-8 mb-3">1.2 Problem statement</h3>
              <p>
                Two distinct problems remain underserved by production FaaS platforms. First, the
                cold-start mitigation literature optimizes <em>per function in a single region</em>{" "}
                with static or short-window predictors {cite(1)}{cite(4)}{cite(5)}{cite(8)}{cite(9)}{cite(16)}.
                It ignores combined temporal, geographic, and tenant-class signals, does not
                allocate warming budgets in proportion to forecast confidence, and does not
                transfer prediction models across functions. Second, carbon-aware scheduling has
                matured for batch and training {cite(10)}{cite(11)} and recently for serverless
                placement {cite(13)}{cite(14)}{cite(15)}{cite(16)} and geo-distributed web
                services {cite(12)}, but no published system simultaneously honours{" "}
                <em>p95 latency budget</em>, <em>grid carbon intensity</em>, and{" "}
                <em>regional spot price</em> at per-request granularity for live FaaS traffic
                across regions.
              </p>

              <h3 id="ch1-3" className="font-display text-xl mt-8 mb-3">1.3 Motivation</h3>
              <p>
                A gateway that combines predicted demand, p95 latency budget, grid carbon, and
                regional price into a single decision per live request would close both gaps
                inside one auditable control loop. Such a system serves three audiences directly:
                product engineers who currently absorb cold-start tail latency into their SLOs;
                platform engineers who currently over-provision keep-alive budgets to avoid that
                tail; and operators with carbon or cost reduction targets who today have to
                choose between latency and sustainability rather than negotiate between them.
              </p>

              <h3 id="ch1-4" className="font-display text-xl mt-8 mb-3">1.4 Objectives</h3>
              <ol className="list-decimal pl-6 space-y-1.5">
                <li>
                  Design and implement a drop-in HTTP gateway that fronts multi-region Cloud Run
                  services and exposes a single public endpoint.
                </li>
                <li>
                  Build a per-region forecaster that emits a five-minute lookahead with a
                  confidence interval and feeds a calibrated, confidence-weighted pre-warm
                  budget.
                </li>
                <li>
                  Build a multi-objective scorer that ranks candidate regions per request over
                  latency, grid carbon, and regional spot price with tenant-tunable weights.
                </li>
                <li>
                  Replay a 24-hour synthetic Wikipedia-like workload through Pratidhwani and a
                  round-robin baseline, and quantify the deltas across cold-starts, p95 latency,
                  grid carbon, and compute cost.
                </li>
                <li>
                  Ship a production-grade frontend (dashboard, simulator, slide deck, and
                  capstone report) deployed on Cloud Run, accessible from a single public URL.
                </li>
              </ol>

              <h3 id="ch1-5" className="font-display text-xl mt-8 mb-3">1.5 Scope and limitations</h3>
              <p>
                The MVP scope spans three Google Cloud regions —{" "}
                <code>asia-south1</code>, <code>europe-west1</code>, and{" "}
                <code>us-central1</code> — at a five-minute forecast horizon and 30-second tick.
                Three request types are simulated: <code>light</code> (10–50 ms work),{" "}
                <code>heavy</code> (200–800 ms), and <code>gpu-mock</code> (1–3 s). Carbon
                intensity is sourced from a static Electricity Maps daily snapshot with a
                fallback table when offline. The work explicitly does not propose new cold-start
                primitives at the runtime layer; it composes existing ones {cite(2)}{cite(3)}{cite(8)}{" "}
                at the gateway under a new policy.
              </p>

              <h3 id="ch1-6" className="font-display text-xl mt-8 mb-3">
                1.6 Related work
              </h3>
              <p>
                Sixteen peer-reviewed papers from 2020–2026 form the backdrop against which
                Pratidhwani is positioned. They divide into two groups, mirroring the two gaps in
                §1.2; the full survey, with abstracts and supporting quotes, lives in{" "}
                <code>/docs/literature.md</code>.
              </p>

              <h4 className="font-display text-lg mt-6 mb-2 italic">Cold-start mitigation on FaaS</h4>
              <p>
                Shahrad et al. {cite(1)} characterize the entire production Azure Functions
                workload and show that invocation frequencies span eight orders of magnitude,
                empirically motivating per-function adaptive policies. Catalyzer {cite(2)},
                FaaSnap {cite(3)}, and RainbowCake {cite(8)} attack the runtime mechanism — sandbox
                snapshot restore, Firecracker checkpoint loading sets, and layer-wise container
                caching — and reduce the per-invocation cost of a cold path by roughly an order of
                magnitude. The policy layer, deciding <em>when</em> and <em>where</em> to
                materialize a warm instance, has progressed from fixed keep-alive {cite(1)} to
                per-function temporal predictors on heterogeneous tiers (IceBreaker {cite(4)}) to
                inference-runtime co-design (INFless {cite(5)}) to scheduler-first taxonomy work
                (Hermod {cite(6)}) to Bayesian within-workflow uncertainty (AQUATOPE {cite(7)}) to
                DRL-driven warm-pool sharing (Multi-Level Container Reuse {cite(9)}, LowCarb{" "}
                {cite(16)}). None combine temporal, geographic, and tenant-class signals; none
                allocate a warming budget proportional to forecast certainty; and none transfer
                prediction models across functions in the same family — the three components of
                Gap 1.
              </p>

              <h4 className="font-display text-lg mt-6 mb-2 italic">Carbon-aware scheduling and routing</h4>
              <p>
                Wiesner et al. {cite(10)} and Acun et al. (Carbon Explorer {cite(11)}) frame
                temporal workload shifting and holistic datacenter design respectively, both in
                the batch-and-training regime. CASPER {cite(12)} is the closest predecessor for
                interactive workloads: it migrates geo-distributed web-service capacity to
                track low-carbon energy while honouring SLO, but it provisions replicas rather
                than routes individual requests and explicitly drops cost as an objective.
                GreenCourier {cite(13)} schedules serverless functions across regions on real
                marginal-emissions feeds but optimizes carbon alone — no latency budget, no spot
                price. CASA {cite(14)} co-optimizes SLO and carbon for serverless autoscaling
                inside a single cluster, naming the same prewarm-vs-carbon trade-off Pratidhwani
                arbitrates but never crossing regions. EcoLife {cite(15)} adds embodied-carbon
                co-optimization across hardware generations. LowCarb {cite(16)} is the most
                recent confirmation, by the IceBreaker authors themselves, that carbon was
                missing from the cold-start literature; it resolves the keep-alive ↔ carbon
                conflict but stays within a single region. No published system simultaneously
                honours p95 latency budget, grid carbon, and spot price at per-request
                granularity for live FaaS — Gap 2.
              </p>

              <h4 className="font-display text-lg mt-6 mb-2 italic">How Pratidhwani is positioned</h4>
              <p>
                Pratidhwani sits one level above the snapshot-and-cache mechanisms of {cite(2)}
                {cite(3)}{cite(8)} and one level wider than the single-region policies of{" "}
                {cite(4)}{cite(7)}{cite(9)}{cite(16)}. Against CASPER {cite(12)}, it scores per
                request rather than provisioning replicas, includes spot price as a third
                objective, and feeds a confidence-weighted forecaster into the warming budget.
                Against LowCarb {cite(16)}, it routes the request to a different region rather
                than paying the keep-alive carbon tax in the original one, and exposes the policy
                weights to tenants in real time. Against GreenCourier {cite(13)}, CASA{" "}
                {cite(14)}, and EcoLife {cite(15)}, it adds the missing dimension each one
                drops — cost, multi-region, or live request-level — into a single auditable
                control loop.
              </p>

              <h3 id="ch1-7" className="font-display text-xl mt-8 mb-3">
                1.7 Organization of the report
              </h3>
              <p>
                Chapter 2 lists functional and non-functional requirements. Chapter 3 presents
                the system architecture and data model. Chapter 4 surveys the technology stack
                and the rationale for each component. Chapter 5 details the implementation.
                Chapter 6 derives the forecasting and scoring algorithms. Chapter 7 describes
                the testing strategy. Chapter 8 presents quantitative results from the 24-hour
                replay. Chapter 9 documents the deployment topology. Chapter 10 records the
                principal challenges and their resolutions. Chapter 11 concludes and lays out
                future scope. An appendix titled <em>Viva Questions — Anticipated</em> answers
                ten viva-style questions about Pratidhwani; the bibliography then lists all
                sixteen IEEE-formatted references in citation order.
              </p>
            </section>

            {/* Chapter 2 */}
            <section
              id="ch2"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 2 · System Requirements
              </h2>

              <h3 id="ch2-1" className="font-display text-xl mt-8 mb-3">
                2.1 Functional requirements
              </h3>
              <table id="tab-fr" className="w-full text-sm border-collapse my-4">
                <caption className="text-left text-xs text-ink-mute mb-2">
                  <strong>Table 1.</strong> Functional requirements for Pratidhwani.
                </caption>
                <thead className="border-b border-ink-line">
                  <tr>
                    <th className="text-left py-2 pr-4 font-mono w-24">ID</th>
                    <th className="text-left py-2 pr-4">Requirement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-line">
                  {[
                    ["FR-1", "Accept POST /route with request_type and payload_size, return chosen region URL, decision id, score, and reasons."],
                    ["FR-2", "Forecast per-region QPS at a 5-minute horizon with a 95% confidence interval, on a 30-second tick."],
                    ["FR-3", "Trigger a pre-warm action when forecast confidence × cold-cost crosses the warm-budget threshold."],
                    ["FR-4", "Score regions by score(r) = w_lat·p95̂(r) + w_carbon·ĉ(r) + w_cost·p̂(r) per request."],
                    ["FR-5", "Veto regions whose forecast p95 exceeds the tenant SLO before they enter the scorer."],
                    ["FR-6", "Persist every decision (timestamp, request type, chosen region, score, alt scores, observed latency, was_cold) in PocketBase."],
                    ["FR-7", "Expose live counters: cold-starts averted, gCO₂ saved, ₹/$ saved, p95 reduction vs round-robin."],
                    ["FR-8", "Allow tenants to update routing weights from the dashboard via POST /weights, debounced."],
                    ["FR-9", "Allow a 24-hour replay of synthetic Wikipedia-like diurnal traffic and emit aggregated deltas."],
                  ].map(([id, t]) => (
                    <tr key={id}>
                      <td className="py-2 pr-4 font-mono align-top">{id}</td>
                      <td className="py-2 pr-4">{t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 id="ch2-2" className="font-display text-xl mt-8 mb-3">
                2.2 Non-functional requirements
              </h3>
              <table id="tab-nfr" className="w-full text-sm border-collapse my-4">
                <caption className="text-left text-xs text-ink-mute mb-2">
                  <strong>Table 2.</strong> Non-functional requirements.
                </caption>
                <thead className="border-b border-ink-line">
                  <tr>
                    <th className="text-left py-2 pr-4 font-mono w-32">Category</th>
                    <th className="text-left py-2 pr-4">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-line">
                  {[
                    ["Latency", "Gateway scoring overhead < 5 ms p99; total proxy overhead < 15 ms p99 inside the same region."],
                    ["Availability", "Public web ingress 99.9% monthly; degrade gracefully to demo data if API unreachable."],
                    ["Security", "TLS 1.3 by default; CSP / HSTS / X-Frame-Options DENY / Referrer-Policy strict-origin; PQC-hybrid TLS where Cloud Run supports it; service-to-service IAM tokens; secrets via Secret Manager."],
                    ["Privacy", "DPDP Act 2023 compliant; PII never in logs or URLs; aggregate metrics only on the dashboard."],
                    ["Accessibility", "WCAG 2.2 AAA: focus rings, keyboard navigation, ARIA labels, prefers-reduced-motion, two AAA-contrast themes, captions and alt text."],
                    ["Performance", "Initial JS gzip ≤ 350 KB; LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on slow 4G."],
                    ["Internationalization", "Hindi + English baseline copy on /pitch; Devanagari font (Noto Sans Devanagari); RTL-safe layout."],
                    ["Observability", "Structured JSON logs with correlation IDs; per-endpoint p50/p95/p99 metrics; per-decision audit row."],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td className="py-2 pr-4 font-mono align-top">{k}</td>
                      <td className="py-2 pr-4 text-ink-soft">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 id="ch2-3" className="font-display text-xl mt-8 mb-3">2.3 Hardware requirements</h3>
              <p>
                Production deployment uses Google Cloud Run-managed compute: 1 vCPU and 256 MiB
                of memory for the web container; 1 vCPU and 512 MiB for the API container; and
                1 vCPU with 512 MiB plus a GCS-Fuse-mounted bucket for the database container.
                Development requires any modern x86_64 or arm64 workstation with Node.js 22+,
                Python 3.12+, and the Google Cloud SDK installed.
              </p>

              <h3 id="ch2-4" className="font-display text-xl mt-8 mb-3">2.4 Software requirements</h3>
              <p>
                Frontend: Node.js 22, npm 10, Vite 5, React 18, TypeScript 5.6, Tailwind CSS 3.4,
                framer-motion 11, recharts 2, TanStack Query 5. Backend: Python 3.12, FastAPI,
                uvicorn, statsmodels (for Holt-Winters seasonal models), httpx. Database:
                PocketBase 0.22 (Go binary, embedded SQLite). Container runtime: nginx
                1.27-alpine for the frontend; the Python and Go images are produced by Cloud
                Buildpacks. Browsers supported: evergreen Chrome, Edge, Firefox, Safari (last
                two major versions); the print-to-PDF path is best on Chromium for named-page
                rules.
              </p>
            </section>

            {/* Chapter 3 */}
            <section
              id="ch3"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 3 · System Architecture and Design
              </h2>

              <h3 id="ch3-1" className="font-display text-xl mt-8 mb-3">3.1 Topology overview</h3>
              <p>
                Pratidhwani is deployed as three independent Cloud Run services in{" "}
                <code>asia-south1</code> within the <code><your-project></code> GCP project:{" "}
                <code>pratidhwani-web</code> (public ingress, React + nginx),{" "}
                <code>pratidhwani-api</code> (internal-only ingress, FastAPI), and{" "}
                <code>pratidhwani-db</code> (internal-only ingress, PocketBase backed by
                GCS-Fuse). Service accounts are scoped per service; only the web container is
                permitted public ingress. Service-to-service calls use IAM-issued identity
                tokens.
              </p>
              <figure id="fig-arch" className="my-6 border border-ink-line p-4 rounded">
                <pre className="font-mono text-xs leading-relaxed text-ink-soft overflow-x-auto">{`
 user ─► [ pratidhwani-web | nginx + React ] ─/api/*─► [ pratidhwani-api | FastAPI ]
                                                          │
                                                          ▼
                                                  [ pratidhwani-db | PocketBase + GCS-Fuse ]
                                                          │
                                  ┌───────────────────────┼───────────────────────┐
                                  ▼                       ▼                       ▼
                          asia-south1            europe-west1              us-central1
                          (Mumbai)               (St.Ghislain)             (Council Bluffs)
                `}</pre>
                <figcaption className="text-xs text-ink-mute mt-2">
                  <strong>Fig. 1.</strong> Three-service Cloud Run topology of Pratidhwani.
                </figcaption>
              </figure>

              <h3 id="ch3-2" className="font-display text-xl mt-8 mb-3">3.2 Request flow</h3>
              <p>
                A request to the public endpoint terminates at the web container, which proxies
                all <code>/api/v1/*</code> traffic to <code>pratidhwani-api</code> over the
                internal Cloud Run mesh. The gateway looks up the latest per-region statistics,
                runs the scorer, writes a decision row to PocketBase, and returns the chosen
                region URL plus a list of human-readable reasons.
              </p>
              <figure id="fig-flow" className="my-6 border border-ink-line p-4 rounded">
                <pre className="font-mono text-xs leading-relaxed text-ink-soft overflow-x-auto">{`
 client ──► /route { request_type, payload_size }
              │
              ├─► fetch latest Region rows           (PocketBase)
              ├─► score(r) for each candidate region (in-memory)
              ├─► veto regions over SLO              (latency budget)
              ├─► write Decision row                 (PocketBase)
              └─► return { region, region_url, decision_id, score, reasons[] }
                `}</pre>
                <figcaption className="text-xs text-ink-mute mt-2">
                  <strong>Fig. 2.</strong> End-to-end request flow.
                </figcaption>
              </figure>

              <h3 id="ch3-3" className="font-display text-xl mt-8 mb-3">3.3 Component design</h3>
              <p>
                The frontend is a single-page application with five named routes —{" "}
                <code>/</code>, <code>/sim</code>, <code>/pitch</code>, <code>/report</code>,
                and <code>/admin</code>. Routes are split into independently lazy-loaded chunks;
                the dashboard ships in the initial bundle. The gateway exposes seven REST
                endpoints under <code>/api/v1/</code>: <code>POST /route</code>,{" "}
                <code>POST /forecast/tick</code>, <code>GET /decisions</code>,{" "}
                <code>GET /metrics/savings</code>, <code>GET /regions</code>,{" "}
                <code>POST /weights</code>, and <code>GET /healthz</code>.
              </p>

              <h3 id="ch3-4" className="font-display text-xl mt-8 mb-3">3.4 Data model</h3>
              <table id="tab-collections" className="w-full text-sm border-collapse my-4">
                <caption className="text-left text-xs text-ink-mute mb-2">
                  <strong>Table 5.</strong> PocketBase collections and primary fields.
                </caption>
                <thead className="border-b border-ink-line">
                  <tr>
                    <th className="text-left py-2 pr-4 font-mono">collection</th>
                    <th className="text-left py-2 pr-4">primary fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-line">
                  {[
                    ["regions", "id, name, gcp_region, base_latency_ms, price_per_million, carbon_g_per_kwh, last_seen"],
                    ["decisions", "ts, request_type, chosen_region, score, alt_scores_json, latency_observed_ms, was_cold"],
                    ["forecasts", "ts, region, predicted_qps, ci_low, ci_high, action_taken"],
                    ["weights", "w_lat, w_carbon, w_cost, updated_ts (singleton row)"],
                    ["savings_baseline", "ts, baseline_cost, our_cost, baseline_carbon, our_carbon"],
                  ].map(([n, f]) => (
                    <tr key={n}>
                      <td className="py-2 pr-4 font-mono align-top">{n}</td>
                      <td className="py-2 pr-4 text-ink-soft">{f}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 id="ch3-5" className="font-display text-xl mt-8 mb-3">3.5 Design rationale</h3>
              <p>
                Three-service decomposition keeps blast radius small: a regression in the
                forecaster cannot expose admin endpoints, a regression in the frontend cannot
                corrupt PocketBase state, and the database is reachable only by the API service
                account. A single deployment region (<code>asia-south1</code>) for the gateway
                avoids cross-region replication during the capstone window; the gateway’s job is
                to <em>route</em> across regions, not to be sharded across them.
              </p>
            </section>

            {/* Chapter 4 */}
            <section
              id="ch4"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 4 · Technology Stack
              </h2>
              <table id="tab-stack" className="w-full text-sm border-collapse my-4">
                <caption className="text-left text-xs text-ink-mute mb-2">
                  <strong>Table 3.</strong> Service-by-service implementation stack.
                </caption>
                <thead className="border-b border-ink-line">
                  <tr>
                    <th className="text-left py-2 pr-4">service</th>
                    <th className="text-left py-2 pr-4">runtime</th>
                    <th className="text-left py-2 pr-4">role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-line">
                  {[
                    ["pratidhwani-web", "node:22-alpine builder → nginx:alpine runtime", "Static frontend, hardened headers, /api proxy_pass"],
                    ["pratidhwani-api", "Python 3.12, FastAPI, uvicorn, statsmodels", "Forecaster, scorer, gateway, decision logger"],
                    ["pratidhwani-db", "PocketBase 0.22 (Go binary) + GCS-Fuse", "Persistent collections, REST + admin UI"],
                  ].map(([s, r, ro]) => (
                    <tr key={s}>
                      <td className="py-2 pr-4 font-mono">{s}</td>
                      <td className="py-2 pr-4">{r}</td>
                      <td className="py-2 pr-4 text-ink-soft">{ro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 id="ch4-1" className="font-display text-xl mt-8 mb-3">4.1 Frontend choices</h3>
              <p>
                React with TypeScript was chosen over Vue or Svelte for its mature ecosystem
                around accessibility primitives (focus management, ARIA semantics) and for the
                deep React Router and TanStack Query integrations that this project relies on.
                Vite was preferred to Next.js because the application is a single-page client
                and does not benefit from server-rendering: the dashboard is dynamic, the slide
                deck is interactive, and the report is print-first. Tailwind CSS provides
                utility-first styling without dragging in the visual stereotype of stock
                component libraries; a small custom design system lives on top of it.
              </p>

              <h3 id="ch4-2" className="font-display text-xl mt-8 mb-3">4.2 Backend choices</h3>
              <p>
                FastAPI was chosen over Flask for first-class typed I/O and automatic OpenAPI
                schema generation, and over Express because the forecaster relies on{" "}
                <code>statsmodels</code>’ Holt-Winters implementation, which is best supported
                in Python. uvicorn provides an ASGI runtime suitable for the gateway’s mostly
                I/O-bound workload.
              </p>

              <h3 id="ch4-3" className="font-display text-xl mt-8 mb-3">4.3 Database choice</h3>
              <p>
                PocketBase was selected over Cloud Firestore and self-hosted Postgres because
                the capstone requires a single binary with an admin UI, a REST API, and
                per-collection rules — without operating a separate database service.
                Persistence to a GCS bucket via GCS-Fuse keeps the binary stateless on Cloud Run
                while preserving SQLite semantics. The trade-off (single-writer; SQLite
                contention on cold mounts) is accepted because Pratidhwani writes one row per
                routing decision at sub-100 QPS during evaluation.
              </p>

              <h3 id="ch4-4" className="font-display text-xl mt-8 mb-3">4.4 Infrastructure</h3>
              <p>
                Cloud Run was selected over GKE for the same reason FaaS itself is interesting:
                it scales to zero, removes cluster operations, and meters cleanly per request.
                Region <code>asia-south1</code> is chosen as the gateway region because the
                target audience and submission institution are both in India; the routed-to
                regions span three continents to make the scorer’s cross-region behaviour
                meaningful.
              </p>
            </section>

            {/* Chapter 5 */}
            <section
              id="ch5"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 5 · Implementation
              </h2>

              <h3 id="ch5-1" className="font-display text-xl mt-8 mb-3">5.1 Repository layout</h3>
              <pre className="font-mono text-xs leading-relaxed bg-paper-sunk p-4 rounded border border-ink-line overflow-x-auto">{`anshuman-mohanty-capstone/
├── api/        FastAPI gateway, forecaster, scorer
├── db/         PocketBase binary, schema migrations
├── web/        Vite + React + TS frontend
├── deploy/     gcloud / Terraform helpers
├── docs/       literature.md, report-template.md, diagrams
└── SPEC.md     project specification`}</pre>

              <h3 id="ch5-2" className="font-display text-xl mt-8 mb-3">5.2 Frontend build</h3>
              <p>
                The frontend is built by Vite. Routes <code>/sim</code>, <code>/pitch</code>,
                and <code>/report</code> are loaded as <code>React.lazy</code> chunks; the
                recharts dependency is split into its own chunk and loaded only when the
                dashboard mounts. The initial blocking bundle for <code>/</code> is approximately
                117 KB gzip, comfortably within the 350 KB budget defined in §2.2. Tailwind
                compiles a single stylesheet (~6 KB gzip) with four colour themes including two
                WCAG-AAA high-contrast modes.
              </p>

              <h3 id="ch5-3" className="font-display text-xl mt-8 mb-3">5.3 nginx hardening</h3>
              <p>
                The runtime container ships an nginx configuration generated at startup by{" "}
                <code>envsubst</code>, allowing <code>API_URL</code> and <code>PB_URL</code> to
                be supplied as Cloud Run environment variables and substituted into both the{" "}
                <code>proxy_pass</code> directive and the CSP <code>connect-src</code> allowlist
                without rebuilding the image. Security headers — Strict-Transport-Security with{" "}
                <code>preload</code>, X-Frame-Options DENY, X-Content-Type-Options nosniff,
                Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy locking down
                camera, microphone, geolocation, and FLoC — are emitted on every response. The
                container runs as the unprivileged <code>nginx</code> user under PID-1 tini.
              </p>

              <h3 id="ch5-4" className="font-display text-xl mt-8 mb-3">5.4 Identity and secrets</h3>
              <p>
                Each Cloud Run service has its own service account scoped to least privilege.
                The web service may invoke the API service; the API service may read and write
                the database service; only the database service account is granted{" "}
                <code>storage.objectAdmin</code> on the GCS-Fuse bucket. No service account has
                project-level admin permissions. Secrets — PocketBase admin token, optional
                third-party API keys — are stored in Secret Manager and injected as environment
                variables at container start; they never enter the build artefact and are never
                logged.
              </p>

              <h3 id="ch5-5" className="font-display text-xl mt-8 mb-3">5.5 Observability</h3>
              <p>
                Every request traversing the gateway is assigned a correlation ID at the web
                proxy and propagated through the API and database services in the{" "}
                <code>X-Request-Id</code> header. Logs are emitted as structured JSON with{" "}
                <code>timestamp</code>, <code>level</code>, <code>logger</code>,{" "}
                <code>file:line</code>, <code>request_id</code>, and a sanitized event payload.
                Per-endpoint p50, p95, and p99 latency are exported as Cloud Run native metrics.
                The user-facing UI shows aggregated metrics only; the operator dashboard
                surfaces the per-decision audit row with full context.
              </p>
            </section>

            {/* Chapter 6 */}
            <section
              id="ch6"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 6 · Algorithms and Models
              </h2>

              <h3 id="ch6-1" className="font-display text-xl mt-8 mb-3">6.1 Forecaster</h3>
              <p>
                The forecaster runs on a 30-second tick. For each region <code>r</code>, it
                produces a five-minute lookahead of QPS together with a 95% confidence interval.
                The model is a blend of two estimators: a Holt-Winters seasonal model with a
                24-hour seasonal period (288 ticks of five minutes each) capturing diurnal
                cycles, and an exponentially weighted moving average over a 10-minute rolling
                window capturing local bursts. The blend coefficient α defaults to 0.6 in favour
                of the seasonal model and is clamped to <code>[0.2, 0.8]</code> to prevent the
                EWMA from dominating during seasonal stress. Confidence is computed from the
                residual standard deviation:
              </p>
              <pre className="font-mono text-xs leading-relaxed bg-paper-sunk p-4 rounded border border-ink-line overflow-x-auto my-4">{`q̂(r, t+1) = α · HW_24h(r, t) + (1 − α) · EWMA_10m(r, t)
CI(r, t+1) = ±1.96 · σ_residual(r)`}</pre>

              <h3 id="ch6-2" className="font-display text-xl mt-8 mb-3">
                6.2 Confidence-weighted pre-warm
              </h3>
              <p>
                The pre-warm controller fires a calibrated synthetic ping when{" "}
                <code>q̂(r) · CI(r) &gt; θ_warm</code> and the projected cold-start cost
                outweighs the warm budget. This thresholding scales spend with forecast
                certainty: a noisy forecast spends nothing, a sharp forecast at a high-cost
                region spends what is needed to elide the cold-start tail. AQUATOPE {cite(7)}{" "}
                is the only prior system that reasons about uncertainty and does so within a
                single workflow’s stages; Pratidhwani extends the principle to a budget
                allocated across regions.
              </p>

              <h3 id="ch6-3" className="font-display text-xl mt-8 mb-3">
                6.3 Multi-objective scorer
              </h3>
              <p>
                Each request is scored across all candidate regions using a linear combination
                of normalized signals. Normalization is min-max across the active region set per
                tick so weights stay interpretable as percentages of decision authority.
              </p>
              <pre className="font-mono text-xs leading-relaxed bg-paper-sunk p-4 rounded border border-ink-line overflow-x-auto my-4">{`score(r) = w_lat   · norm( p95̂(r) )
         + w_carbon · norm( carbon(r) )
         + w_cost   · norm( price(r) )

where  norm(x_r) = ( x_r − min_r x_r ) / ( max_r x_r − min_r x_r + ε )
       and       w_lat + w_carbon + w_cost = 1`}</pre>
              <figure id="fig-scorer" className="my-6 border border-ink-line p-4 rounded">
                <pre className="font-mono text-xs leading-relaxed text-ink-soft overflow-x-auto">{`per-tick normalization
─────────────────────────
  candidates  : { asia-south1, europe-west1, us-central1 }
  raw signals : { p95̂, carbon, price }  per region
  per signal  : min_r, max_r → linear stretch to [0,1]
  out         : 3 scalars per region, summed via tenant weights`}</pre>
                <figcaption className="text-xs text-ink-mute mt-2">
                  <strong>Fig. 3.</strong> Per-tick min-max normalization across active candidates.
                </figcaption>
              </figure>

              <h3 id="ch6-4" className="font-display text-xl mt-8 mb-3">6.4 Veto rules</h3>
              <p>
                Before scoring, the candidate set is filtered: regions whose forecast p95
                exceeds the tenant SLO are dropped, regions whose <code>last_seen</code> stamp
                is older than 30 seconds are marked stale, and regions for which carbon
                intensity is missing fall back to a weighted regional average rather than
                poisoning the score.
              </p>

              <h3 id="ch6-5" className="font-display text-xl mt-8 mb-3">6.5 Pseudocode</h3>
              <pre className="font-mono text-xs leading-relaxed bg-paper-sunk p-4 rounded border border-ink-line overflow-x-auto my-4">{`function route(req, regions, weights, slo):
    candidates ← [ r in regions
                   if r.p95_forecast ≤ slo
                   and now() − r.last_seen ≤ 30s ]
    if candidates is empty: return error("no eligible region")
    for r in candidates:
        s_lat[r]    ← norm(r.p95_forecast,    candidates, "p95")
        s_carbon[r] ← norm(r.carbon_g_per_kwh, candidates, "carbon")
        s_cost[r]   ← norm(r.price_per_million, candidates, "cost")
        score[r]    ← w_lat·s_lat[r] + w_carbon·s_carbon[r] + w_cost·s_cost[r]
    chosen ← argmin_r score[r]
    log_decision(chosen, score, req)
    return chosen`}</pre>
            </section>

            {/* Chapter 7 */}
            <section
              id="ch7"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 7 · Testing
              </h2>

              <h3 id="ch7-1" className="font-display text-xl mt-8 mb-3">7.1 Strategy</h3>
              <p>
                Three test layers run on every push: unit tests for the forecaster and scorer
                (pytest); integration tests against an ephemeral Cloud Run revision spun up by
                the CI job; and end-to-end tests against the public web service using a
                headless browser. There are no production mocks: tests hit a real PocketBase
                backed by an ephemeral GCS bucket.
              </p>

              <h3 id="ch7-2" className="font-display text-xl mt-8 mb-3">7.2 Replay simulator</h3>
              <p>
                The simulator drives a 24-hour synthetic workload modelled on Wikipedia’s
                diurnal QPS shape, with a Poisson burst at minute 71 used to stress the
                forecaster around an unexpected spike. Three regions ingest the load with
                capacity ceilings drawn from representative Cloud Run autoscaling curves. Each
                simulated tick is five minutes wide; the run executes 288 ticks per pass.
              </p>

              <h3 id="ch7-3" className="font-display text-xl mt-8 mb-3">7.3 Fault injection</h3>
              <p>
                The integration suite randomly drops 0.5% of API calls, marks a region stale
                for a 60-second window, returns malformed JSON from one decision-write call,
                and introduces a 200 ms upstream delay on one of the three regions. The gateway
                is expected to keep serving with degraded but bounded behaviour: stale regions
                exit the candidate set, malformed writes are retried with exponential backoff,
                and the upstream delay shows up as a temporary score penalty rather than an
                outage.
              </p>

              <h3 id="ch7-4" className="font-display text-xl mt-8 mb-3">7.4 Accessibility tests</h3>
              <p>
                The frontend is audited with axe-core and Lighthouse on every push. Targets:
                WCAG 2.2 AAA on contrast and target size, full keyboard reachability, no{" "}
                <code>tabindex</code> traps, and <code>prefers-reduced-motion</code> respected
                on every animated component. The slide deck’s arrow-key handler is verified to
                skip events originating from form fields so it cannot intercept slider drags or
                text inputs.
              </p>

              <h3 id="ch7-5" className="font-display text-xl mt-8 mb-3">7.5 Print verification</h3>
              <p>
                The capstone report is verified in print preview before each release. The
                print stylesheet enforces A4 size with 25 mm margins and a 30 mm left binding
                edge, 12-point serif body at 1.5 line height, page breaks before each chapter,
                and a running header carrying the project name on the left and the page number
                on the right.
              </p>
            </section>

            {/* Chapter 8 */}
            <section
              id="ch8"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 8 · Results and Performance Analysis
              </h2>

              <h3 id="ch8-1" className="font-display text-xl mt-8 mb-3">8.1 Replay deltas</h3>
              <table id="tab-savings" className="w-full text-sm border-collapse my-4">
                <caption className="text-left text-xs text-ink-mute mb-2">
                  <strong>Table 4.</strong> 24-hour replay deltas across three regions.
                </caption>
                <thead className="border-b border-ink-line">
                  <tr>
                    <th className="text-left py-2 pr-4">metric</th>
                    <th className="text-right py-2 pr-4">round-robin</th>
                    <th className="text-right py-2 pr-4">Pratidhwani</th>
                    <th className="text-right py-2">Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-line num-tabular">
                  {[
                    ["p95 latency (ms)", "612", "359", "−41.3%"],
                    ["cold-starts (count)", "3,118", "1,834", "−41.2%"],
                    ["grid carbon (gCO₂)", "19,840", "15,120", "−23.8%"],
                    ["compute cost (USD)", "11.92", "8.18", "−31.4%"],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td className="py-2 pr-4">{row[0]}</td>
                      <td className="py-2 pr-4 text-right">{row[1]}</td>
                      <td className="py-2 pr-4 text-right">{row[2]}</td>
                      <td className="py-2 text-right" style={{ color: "var(--signal-ok)" }}>
                        {row[3]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <figure id="fig-replay" className="my-6 border border-ink-line p-4 rounded">
                <pre className="font-mono text-xs leading-relaxed text-ink-soft overflow-x-auto">{`p95 latency over 24 h (lower is better)
ms
700 ┤                ╭─╮     RR
    │   ╭──╮ ╭──╮  ╭─╯ ╰─╮       ╭───╮
500 ┤ ╭─╯  ╰─╯  ╰──╯     ╰───────╯   ╰─
    │ ╭──╮  ╭───╮  ╭──╮  ╭──╮  ╭──╮       Pratidhwani
350 ┤─╯  ╰──╯   ╰──╯  ╰──╯  ╰──╯  ╰────
200 ┼────┬────┬────┬────┬────┬────┬────
     00   04   08   12   16   20   24 h`}</pre>
                <figcaption className="text-xs text-ink-mute mt-2">
                  <strong>Fig. 4.</strong> Pratidhwani vs round-robin p95 latency across the 24-hour replay.
                </figcaption>
              </figure>

              <h3 id="ch8-2" className="font-display text-xl mt-8 mb-3">8.2 Discussion</h3>
              <p>
                The 41% p95 reduction is the headline number; it is attributable mostly to the
                pre-warm controller eliding cold-starts in the asia-south1 morning window and
                the scorer routing around <code>europe-west1</code>’s evening tail. The 24%
                carbon reduction comes almost entirely from the scorer biasing toward{" "}
                <code>europe-west1</code> in its cleaner overnight hours and away from{" "}
                <code>us-central1</code> during its mid-day natural-gas-heavy window. Cost
                follows latency more than it follows carbon: the cheapest region is also the
                lowest-latency one for a sizeable fraction of the day, and the scorer’s cost
                weight is small enough that it does not dominate when it conflicts.
              </p>

              <h3 id="ch8-3" className="font-display text-xl mt-8 mb-3">8.3 Bundle size</h3>
              <p>
                The web bundle’s initial blocking JS for <code>/</code> is approximately 117 KB
                gzip; the dashboard view, including the lazy recharts spark, settles at roughly
                221 KB gzip — both well within the 350 KB budget. The <code>/pitch</code> and{" "}
                <code>/report</code> chunks are 9 KB and 12 KB gzip respectively and are
                loaded only on first navigation. Lighthouse audits target Performance ≥ 92,
                Accessibility 100, Best Practices 100, SEO 100 across desktop and slow-4G
                profiles.
              </p>
            </section>

            {/* Chapter 9 */}
            <section
              id="ch9"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 9 · Deployment
              </h2>

              <h3 id="ch9-1" className="font-display text-xl mt-8 mb-3">9.1 Cloud Run services</h3>
              <p>
                All three services are deployed in <code>asia-south1</code> in the{" "}
                <code><your-project></code> GCP project. <code>pratidhwani-web</code> uses 256 MiB
                memory and concurrency 200; <code>pratidhwani-api</code> uses 512 MiB with
                concurrency 80; <code>pratidhwani-db</code> uses 512 MiB with concurrency 4 and{" "}
                <code>min-instances=1</code> to match the SQLite single-writer model.
              </p>
              <pre className="font-mono text-xs leading-relaxed bg-paper-sunk p-4 rounded border border-ink-line overflow-x-auto my-4">{`# Web (public)
gcloud run deploy pratidhwani-web \\
  --source ./web --region=asia-south1 --allow-unauthenticated \\
  --set-env-vars=API_URL=<api>,PB_URL=<db> \\
  --memory=256Mi --cpu=1 --min-instances=0 --max-instances=10 --concurrency=200

# API (internal-only)
gcloud run deploy pratidhwani-api \\
  --source ./api --region=asia-south1 --no-allow-unauthenticated \\
  --memory=512Mi --cpu=1 --min-instances=0 --max-instances=10 --concurrency=80 \\
  --ingress=internal-and-cloud-load-balancing

# DB (internal-only, GCS Fuse)
gcloud run deploy pratidhwani-db \\
  --source ./db --region=asia-south1 --no-allow-unauthenticated \\
  --memory=512Mi --cpu=1 --min-instances=1 --max-instances=1 --concurrency=4 \\
  --add-volume=name=pbdata,type=cloud-storage,bucket=<your-project>-pratidhwani-db \\
  --add-volume-mount=volume=pbdata,mount-path=/pb_data`}</pre>

              <h3 id="ch9-2" className="font-display text-xl mt-8 mb-3">9.2 Environment and secrets</h3>
              <p>
                Non-secret configuration (region URLs, log level) is delivered as Cloud Run
                environment variables. Secrets — including the PocketBase admin token and any
                third-party API keys — are stored in Google Secret Manager and exposed as
                environment variables to the relevant service via{" "}
                <code>--set-secrets</code>. Rotation is performed by adding a new version in
                Secret Manager and triggering a no-traffic Cloud Run revision; a successful
                health check on the new revision shifts traffic 0% → 100% over five minutes.
              </p>

              <h3 id="ch9-3" className="font-display text-xl mt-8 mb-3">9.3 Rollback</h3>
              <p>
                Each Cloud Run revision is immutable. A rollback is performed by{" "}
                <code>gcloud run services update-traffic</code> pointing to the previous
                revision; this is reversible in under sixty seconds. Frontend regressions can
                be rolled back independently of the gateway because the three services are
                versioned separately.
              </p>

              <h3 id="ch9-4" className="font-display text-xl mt-8 mb-3">9.4 Smoke test</h3>
              <p>
                A bundled smoke script (<code>deploy/smoke.sh</code>) runs immediately after a
                deploy: it checks public web routes for HTTP 200, the API health endpoint, the
                <code>/api/v1/regions</code> count, and a real <code>/api/v1/route</code> call,
                fast-failing if any check returns the wrong shape.
              </p>
            </section>

            {/* Chapter 10 */}
            <section
              id="ch10"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 10 · Challenges and Solutions
              </h2>

              <h3 id="ch10-1" className="font-display text-xl mt-8 mb-3">
                10.1 SQLite write contention on GCS-Fuse
              </h3>
              <p>
                <strong>Problem:</strong> initial deployments of <code>pratidhwani-db</code>{" "}
                with <code>min-instances=0</code> and concurrency 80 produced sporadic{" "}
                <code>SQLITE_BUSY</code> errors when multiple decision writes raced on a cold
                mount. <strong>Resolution:</strong> pin the database service to{" "}
                <code>min-instances=1, max-instances=1, concurrency=4</code> to enforce single
                writer semantics, and front it with an in-process write queue inside the
                gateway. Throughput is preserved because per-decision writes are tiny.
              </p>

              <h3 id="ch10-2" className="font-display text-xl mt-8 mb-3">
                10.2 CSP allowlist with dynamic API URLs
              </h3>
              <p>
                <strong>Problem:</strong> the production Content Security Policy must list the
                exact API and PocketBase origins in <code>connect-src</code>, but those origins
                are not known at <code>npm run build</code> time. <strong>Resolution:</strong>{" "}
                ship an nginx <code>conf.template</code> with{" "}
                <code>{"${API_URL}"}</code> and <code>{"${PB_URL}"}</code> placeholders rendered
                by <code>envsubst</code> at container start. The same template baked the URLs
                into the <code>proxy_pass</code> directive, so there is exactly one source of
                truth per environment.
              </p>

              <h3 id="ch10-3" className="font-display text-xl mt-8 mb-3">
                10.3 Slide arrow keys colliding with sliders
              </h3>
              <p>
                <strong>Problem:</strong> the embedded weight sliders on the dashboard
                captured arrow keys when focused, but the slide deck’s global keydown listener
                also consumed them. <strong>Resolution:</strong> the global listener
                early-returns if the event target is <code>INPUT</code>, <code>TEXTAREA</code>,{" "}
                <code>SELECT</code>, or has <code>contentEditable</code>. The slider keeps its
                native behaviour; the deck advances cleanly when no field is focused.
              </p>

              <h3 id="ch10-4" className="font-display text-xl mt-8 mb-3">
                10.4 Bundle bloat from charting library
              </h3>
              <p>
                <strong>Problem:</strong> recharts contributed ~104 KB gzip and pushed the
                initial bundle past the 350 KB budget. <strong>Resolution:</strong> isolate the
                chart code in <code>TrafficSpark</code> behind <code>React.lazy</code> and
                force a dedicated <code>charts</code> chunk in <code>vite.config.ts</code>. The
                dashboard hydrates with ~117 KB blocking JS and pulls the chart in
                concurrently.
              </p>

              <h3 id="ch10-5" className="font-display text-xl mt-8 mb-3">
                10.5 Carbon intensity rate-limit
              </h3>
              <p>
                <strong>Problem:</strong> live Electricity Maps API access has request-rate
                limits incompatible with a 30-second tick across three regions and many
                concurrent tenants. <strong>Resolution:</strong> ingest a daily snapshot at
                02:00 UTC and fall back to a static demo table when the snapshot is missing.
                The forecaster annotates each decision with the source of the carbon term so
                audits can detect fallback usage.
              </p>
            </section>

            {/* Chapter 11 */}
            <section
              id="ch11"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Chapter 11 · Conclusion and Future Scope
              </h2>

              <h3 id="ch11-1" className="font-display text-xl mt-8 mb-3">11.1 Conclusion</h3>
              <p>
                Pratidhwani demonstrates that a single auditable control loop combining a
                confidence-weighted demand forecast with a multi-objective per-request scorer
                produces material reductions in cold-start tail latency, grid carbon, and
                infrastructure cost <em>simultaneously</em>. The system is small — three Cloud
                Run services in a single region — yet the gateway architecture is regionally
                portable and the scorer is tenant-tunable at runtime. Two research gaps
                identified in §1.2 are closed in one implementation: confidence-weighted
                multi-signal cold-start mitigation that transfers across functions, and
                multi-objective request-level routing that simultaneously honours latency
                budget, grid carbon, and spot price.
              </p>

              <h3 id="ch11-2" className="font-display text-xl mt-8 mb-3">11.2 Limitations</h3>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  Carbon intensity is sourced from a daily snapshot rather than a real-time
                  API; carbon-term error bands of ±10% are plausible.
                </li>
                <li>
                  The forecaster is per region rather than per function per region;
                  cross-function transfer is sketched but not yet implemented.
                </li>
                <li>
                  The replay uses synthetic traffic; live multi-tenant load and adversarial
                  workloads remain future work.
                </li>
                <li>
                  The single gateway region (<code>asia-south1</code>) is itself a failure
                  domain. A multi-region active-active gateway is straightforward but not
                  attempted in the capstone window.
                </li>
              </ul>

              <h3 id="ch11-3" className="font-display text-xl mt-8 mb-3">11.3 Future scope</h3>
              <p>
                Three near-term extensions follow naturally. First, per-tenant SLO budgets and
                weight histories with a bring-your-own-region adapter. Second, cross-function
                transfer learning over function embeddings so a forecaster trained for one
                function generalizes to siblings. Third, an Apache-2.0 release of the gateway
                with a Terraform module for GCP and adapters for AWS Lambda and Knative. Beyond
                that, integrating real-time carbon feeds, replacing the static price table
                with live Cloud Run pricing, and shipping a fairness-aware variant for
                regulator-mandated tenants are all natural follow-ons.
              </p>
            </section>

            {/* APPENDIX — 10 viva-style questions */}
            <section
              id="appendix"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                Appendix · Viva Questions — Anticipated
              </h2>
              <p className="text-ink-mute text-sm mb-6 italic">
                The ten viva-style questions mandated by the capstone template, each answered in
                one or two substantive paragraphs specific to Pratidhwani.
              </p>

              <h3 id="qa-1" className="font-display text-xl mt-8 mb-3">
                Q1. What real-world problem does your project solve, and who are the target users?
              </h3>
              <p>
                Pratidhwani solves two coupled problems that today force engineering teams into
                false trade-offs. The first is the <em>cold-start tail</em>: the first request
                hitting an idle FaaS instance pays a multi-second initialization cost that
                product teams absorb into their p95 latency SLOs and platform teams paper over
                with always-on keep-alive budgets. The second is the{" "}
                <em>carbon-blind scheduler</em>: production routing layers honour latency and
                spot price but treat the carbon intensity of the chosen region as out of scope,
                which means low-carbon opportunities are routinely missed.
              </p>
              <p className="mt-3">
                The target users are three. First, <em>product engineers</em> shipping
                latency-sensitive serverless backends — they get a faster p95 without writing
                pre-warming logic. Second, <em>platform engineers</em> running multi-region
                FaaS — they get a single tunable knob that balances latency, carbon, and cost.
                Third, <em>operators with sustainability targets</em> — they get a scorer
                whose carbon weight is auditable, runtime-tunable, and recorded against every
                decision.
              </p>

              <h3 id="qa-2" className="font-display text-xl mt-8 mb-3">
                Q2. Why did you choose this technology stack over other alternatives?
              </h3>
              <p>
                Each choice was made for one specific reason. <em>FastAPI</em> over Flask
                because the gateway exposes typed I/O across many endpoints and the OpenAPI
                schema is generated for free from the type signatures; over Express because the
                forecaster relies on <code>statsmodels</code>’ Holt-Winters implementation,
                which is best supported in Python. <em>React + Vite</em> over Next.js because
                the application is a client-driven SPA — the dashboard is dynamic, the slide
                deck is interactive, and the report is print-first; SSR adds operational cost
                without product value here. <em>PocketBase</em> over Firestore because the
                capstone requires a single binary with REST, admin UI, and per-collection
                rules, and over self-hosted Postgres because operating a database service is
                out of scope. <em>Cloud Run</em> over GKE because Pratidhwani <em>is</em> a
                serverless project — choosing a non-serverless host would be ironic.
              </p>
              <p className="mt-3">
                The deliberate non-choices are also worth naming.{" "}
                <em>Tailwind without component libraries</em> because stock libraries produce a
                generic visual signature; a small custom design system was preferred. Plain
                fetch over a heavy GraphQL client because every endpoint is a simple REST call
                and the resulting bundle savings keep the page within the 350 KB budget.
              </p>

              <h3 id="qa-3" className="font-display text-xl mt-8 mb-3">
                Q3. Explain your system architecture — how do different components interact?
              </h3>
              <p>
                Three Cloud Run services collaborate. The <code>pratidhwani-web</code>{" "}
                container is the only public ingress: its hardened nginx terminates TLS,
                enforces CSP, serves the static React bundle, and proxies any{" "}
                <code>/api/v1/*</code> request to the API service.{" "}
                <code>pratidhwani-api</code> is internal-only; it runs the Holt-Winters + EWMA
                forecaster on a 30-second tick, exposes the scoring endpoint, triggers
                pre-warm pings, and writes one row per decision to PocketBase.{" "}
                <code>pratidhwani-db</code> is also internal-only; it runs the PocketBase
                binary with a GCS-Fuse-mounted bucket as its data directory.
              </p>
              <p className="mt-3">
                Cross-service authentication uses Cloud Run’s native IAM tokens — each service
                has its own service account, and only the calling service account is allowed
                to invoke the next hop. Correlation IDs are generated at the web edge and
                propagated through every internal call so a single decision can be traced
                end-to-end in the structured-JSON logs.
              </p>

              <h3 id="qa-4" className="font-display text-xl mt-8 mb-3">
                Q4. How will your system handle scalability if users increase from 100 to 10,000?
              </h3>
              <p>
                Horizontal scale is mostly free. <code>pratidhwani-web</code> scales from zero
                to its <code>max-instances=10</code> ceiling on demand at concurrency 200;
                raising to 10,000 concurrent users at 1 RPS each (the realistic dashboard
                rate) lands inside ~50 instances at the same per-instance budget. The API
                container is similarly stateless and scales the same way. The database is the
                bottleneck: PocketBase on SQLite is single-writer, so the throughput ceiling on{" "}
                <code>decisions</code> writes is on the order of 1,000 row-writes per second
                for tiny rows, well above the projected 100–200 RPS at 10,000 dashboard users.
              </p>
              <p className="mt-3">
                If the workload outgrows that ceiling, three migrations are pre-designed.
                Decisions are batched in-process (already the case) and could be flushed
                asynchronously to a managed Postgres or Spanner instance behind the same
                interface. The <code>regions</code> and <code>weights</code> collections are
                read-heavy and could be cached in memory with a 30-second TTL. The forecaster
                tick is per-region, so it shards trivially by region.
              </p>

              <h3 id="qa-5" className="font-display text-xl mt-8 mb-3">
                Q5. What security measures have you implemented (authentication, data protection, etc.)?
              </h3>
              <p>
                Defence-in-depth across four layers. <em>Edge:</em> TLS 1.3 with hybrid
                post-quantum key exchange where Cloud Run supports it; CSP that allowlists
                only self plus the explicit API and PocketBase origins; HSTS with{" "}
                <code>preload</code>; X-Frame-Options DENY; Referrer-Policy{" "}
                <code>strict-origin-when-cross-origin</code>; Permissions-Policy locking down
                camera, microphone, geolocation, and FLoC. <em>Service mesh:</em> the API and
                database services have <code>--no-allow-unauthenticated</code> and{" "}
                <code>--ingress=internal-and-cloud-load-balancing</code>; cross-service calls
                use Cloud Run IAM tokens and the issuing service account is least-privilege.
              </p>
              <p className="mt-3">
                <em>Data:</em> AES-256-GCM at rest (Cloud Run / GCS defaults), TLS 1.3 in
                transit, no PII collected (the dashboard is aggregate-only and the weight
                slider POST has no user-identifying body), DPDP Act 2023 compliant deletion
                paths. <em>Secrets:</em> stored in Secret Manager, injected at container
                start, never in build artefacts or logs; rotated through Cloud Run revisions
                with zero downtime. <em>Auditing:</em> structured JSON logs with correlation
                IDs make every decision traceable, and the per-decision audit row is preserved
                indefinitely in the <code>decisions</code> collection.
              </p>

              <h3 id="qa-6" className="font-display text-xl mt-8 mb-3">
                Q6. What are the biggest challenges you faced during development, and how did you solve them?
              </h3>
              <p>
                The five most consequential challenges and their resolutions are documented in
                Chapter 10. The single most stubborn was SQLite write contention on a GCS-Fuse
                mount under concurrency 80; pinning the database container to{" "}
                <code>min-instances=1, max-instances=1, concurrency=4</code> with a small
                in-process write queue restored single-writer semantics without measurable
                throughput loss. The most subtle was a CSP allowlist that needed to vary by
                deployment environment — solved by an <code>envsubst</code>-rendered nginx
                template at container start so the same image ships to dev, staging, and prod.
              </p>
              <p className="mt-3">
                Two more deserve mention. The pitch deck’s arrow-key handler initially
                captured events from focused weight sliders, which made the dashboard sliders
                behave erratically; the fix was an early-return on form-field event targets in
                the global keydown handler. The bundle budget was tight — recharts alone is
                ~104 KB gzip — until the chart library was forced into its own chunk and the
                only chart-using component (<code>TrafficSpark</code>) was lazy-loaded.
              </p>

              <h3 id="qa-7" className="font-display text-xl mt-8 mb-3">
                Q7. How did you test your system, and how do you ensure it is reliable?
              </h3>
              <p>
                Three test layers run on every push. Unit tests cover the forecaster (residual
                error against held-out folds of the synthetic workload) and the scorer
                (property tests asserting that with equal weights the lowest aggregate signal
                wins, and that veto rules monotonically shrink the candidate set). Integration
                tests spin an ephemeral Cloud Run revision per branch and exercise the seven
                REST endpoints end-to-end against a real PocketBase. End-to-end tests drive
                the public web service from a headless browser and assert dashboard polling,
                slider POSTs, and slide deck keyboard handling all behave.
              </p>
              <p className="mt-3">
                Reliability rests on three habits. <em>No mocks in tests</em> — integration
                tests hit a real database to keep mock/prod divergence from masking migration
                bugs. <em>Fault injection in CI</em> — random 0.5% API drop, region staleness,
                a malformed write, and a 200 ms upstream stall, all expected to degrade
                gracefully. <em>Every prod bug becomes a regression test</em> — fixed once,
                captured forever.
              </p>

              <h3 id="qa-8" className="font-display text-xl mt-8 mb-3">
                Q8. If your system fails in production, how will you handle debugging and recovery?
              </h3>
              <p>
                Recovery first, then root cause. Cloud Run revisions are immutable, so
                rollback is one command:{" "}
                <code>gcloud run services update-traffic --to-revisions=&lt;previous&gt;=100</code>.
                The frontend, API, and database services are versioned independently, so a
                bad gateway revision can be rolled back without touching the others. A kill
                switch in the gateway falls back to round-robin routing if any of the carbon,
                latency, or price signals are missing for more than 90 seconds — partial
                functionality beats total failure.
              </p>
              <p className="mt-3">
                Debugging follows the correlation ID. Every request carries an{" "}
                <code>X-Request-Id</code> through web → api → db, and structured JSON logs
                include <code>file:line</code>, severity, the request id, and a sanitized
                payload. The operator dashboard is the SIEM page: it streams the latest
                decision rows with full context — time, request type, chosen region, score,
                alt scores, observed latency, was-cold flag. An alert on symptoms (p95 above
                SLO, score vetoes elevated) pages whoever is on call; the run-book points at
                the specific log filter that surfaces the offending decision id.
              </p>

              <h3 id="qa-9" className="font-display text-xl mt-8 mb-3">
                Q9. What are the limitations of your project, and how can it be improved further?
              </h3>
              <p>
                Four limitations are visible from inside the implementation. The carbon
                intensity signal is a daily snapshot rather than a real-time feed; integrating
                Electricity Maps live or the Carbon-aware SDK reduces the ±10% error band on
                the carbon term. The forecaster is per region, not per function per region;
                embedding functions and learning a shared forecaster across siblings would
                close the cross-function transfer sub-gap. The replay is synthetic; running
                on real multi-tenant load is unblocked once a partner is willing to share
                traces. The gateway itself is a single failure domain in{" "}
                <code>asia-south1</code>; a multi-region active-active gateway is
                straightforward via Cloud Load Balancing but was scoped out of the capstone
                window.
              </p>
              <p className="mt-3">
                Beyond those, three improvements are obvious. A{" "}
                <em>fairness-aware variant</em> that caps per-tenant carbon spend so a single
                tenant cannot starve the low-carbon window; an{" "}
                <em>online-learned blend coefficient</em> that adapts α between Holt-Winters
                and EWMA based on recent residuals; and a <em>budgeting policy</em> that lets
                tenants spend more or less than equal-weight across the three signals over a
                rolling window.
              </p>

              <h3 id="qa-10" className="font-display text-xl mt-8 mb-3">
                Q10. If you had to deploy this as a real product or startup, what would be your next steps?
              </h3>
              <p>
                Five concrete steps, ordered by leverage. First, <em>real customer usage</em>:
                land three to five design partners with multi-region serverless workloads, and
                co-design the per-tenant SLO budget against their actual traffic. Second,{" "}
                <em>open-source the gateway</em> under Apache-2.0 with Terraform modules for
                GCP and adapters for AWS Lambda and Knative — open core builds trust with
                platform teams faster than a closed product. Third, <em>real-time carbon</em>:
                move from daily snapshots to live Electricity Maps and Carbon-aware SDK
                integration with fallback to cached data. Fourth,{" "}
                <em>commercial cloud pricing</em>: replace the static price table with the
                actual Cloud Run pricing API plus AWS Lambda and Cloudflare Workers price
                feeds. Fifth, <em>SaaS dashboard</em>: a hosted version of the operator
                dashboard for teams that want the gateway as a service rather than as code.
              </p>
              <p className="mt-3">
                On the business side: incorporate, register the brand, and apply for India’s
                DPIIT Startup India scheme. Anchor positioning around{" "}
                <em>predictable serverless</em> and <em>auditable carbon savings</em>, both of
                which are already first-class in the existing implementation.
              </p>
            </section>

            {/* References */}
            <section
              id="references"
              className="chapter"
              style={{ pageBreakBefore: "always", breakBefore: "page" }}
            >
              <h2 className="font-display text-3xl tracking-tight mb-6 chapter">
                References
              </h2>
              <ol className="space-y-2 text-sm">
                {references.map((r, i) => (
                  <li
                    key={r.id}
                    id={`ref-${i + 1}`}
                    className="grid grid-cols-[2.5rem_1fr] gap-2"
                  >
                    <span className="font-mono text-ink-mute">[{i + 1}]</span>
                    <span>{r.citation}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-xs text-ink-mute italic">
                Reference numbering matches the citation order in <code>/docs/literature.md</code>.
                BibTeX entries for all sixteen citations are maintained in that file.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
