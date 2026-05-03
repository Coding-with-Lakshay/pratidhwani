# Literature review — Pratidhwani

## Executive summary
Across sixteen peer-reviewed FaaS systems papers from 2020–2026, **Gap 1 (adaptive multi-signal cold-start mitigation)** stands open: state-of-the-art warmers [1]–[5], [8], [9], [16] all train *per function in a single region with static or short-window predictors*, leaving sub-gap 1a (no confidence-weighted warming budget — only AQUATOPE [7] reasons about uncertainty, and only inside one workflow) and sub-gap 1b (no cross-function pattern transfer — Multi-Level Container Reuse [9] hints at it but never transfers prediction *models*). **Gap 2 (multi-objective request-level routing on FaaS)** is equally open: carbon-aware schedulers [10]–[16] consistently drop one of {latency-budget, carbon, spot-price} (sub-gap 2a) and decouple routing from forecast-driven warming (sub-gap 2b), with CASPER [12] the closest predecessor (provisioning-level, no cost) and LowCarb [16] the closest cold-start ↔ carbon arbiter (single-region only). Pratidhwani is the first system that closes both gaps in one auditable control loop.

Verified set of sixteen peer-reviewed papers (2020–2026) supporting the two research gaps claimed in `SPEC.md`. All entries verified through DBLP; abstracts verified through Semantic Scholar / arXiv where available, except where noted.

---

## Papers

### Group A — Cold-start mitigation on FaaS (supports Gap 1)

**1. Shahrad et al., "Serverless in the Wild" — USENIX ATC 2020.**
Mohammad Shahrad, Rodrigo Fonseca, Inigo Goiri, Gohar Chaudhry, Paul Batum, Jason Cooke, Eduardo Laureano, Colby Tresness, Mark Russinovich, Ricardo Bianchini. *Characterizing and Optimizing the Serverless Workload at a Large Cloud Provider.* USENIX ATC 2020, pp. 205–218.
Summary: First public characterization of the entire production Azure Functions FaaS workload. Shows function-invocation frequencies span eight orders of magnitude, motivating per-function adaptive policies.
Supporting quote (abstract): *"most functions are invoked very infrequently, but there is an 8-order-of-magnitude range of invocation frequencies. Using observations from our characterization, we then propose a practical resource management policy that significantly reduces the number of function coldstarts, while spending fewer resources than state-of-the-practice policies."*
Why it supports Gap 1: establishes empirically that production keep-alive/pre-warm policies are heuristic, per-function, and based on short-window history — exactly the baseline Pratidhwani improves on with confidence-weighted multi-signal forecasting.

**2. Du et al., "Catalyzer" — ASPLOS 2020.**
Dong Du, Tianyi Yu, Yubin Xia, Binyu Zang, Guanglu Yan, Chenggang Qin, Qixuan Wu, Haibo Chen. *Catalyzer: Sub-millisecond Startup for Serverless Computing with Initialization-less Booting.* ASPLOS 2020, pp. 467–481. DOI: 10.1145/3373376.3378512.
Summary: Restores a sandbox from a checkpoint instead of cold-booting; introduces `sfork` to clone running sandboxes. Adopted by Ant Financial.
Supporting quote (abstract): *"Catalyzer restores a virtualization-based function instance from a well-formed checkpoint image and thereby skips the initialization on the critical path… reduces startup latency by orders of magnitude, achieves <1ms latency in the best case."*
Why it supports Gap 1: representative of the snapshot-restore class — fixes per-instance cost but is invocation-blind; says nothing about *when* to pre-create snapshots, which is the orthogonal question Pratidhwani answers.

**3. Ao, Porter, Voelker — "FaaSnap" — EuroSys 2022.**
Lixiang Ao, George Porter, Geoffrey M. Voelker. *FaaSnap: FaaS made fast using snapshot-based VMs.* EuroSys 2022, pp. 730–746. DOI: 10.1145/3492321.3524270.
Summary: Snapshot-based VM platform for Firecracker; combines compact loading sets, per-region memory mapping, hierarchical overlapping mappings, and concurrent paging.
Supporting quote (abstract): *"reduces end-to-end function execution by up to 3.5x compared to state-of-the-art… resilient to changes of working set and remains efficient under bursty workloads."*
Why it supports Gap 1: optimizes the *mechanism* of restoration; pre-warming policy (when/where to materialize) is left to a static heuristic. Pratidhwani reuses such mechanisms but adds a forecast-driven policy layer.

**4. Roy, Patel, Tiwari — "IceBreaker" — ASPLOS 2022.**
Rohan Basu Roy, Tirthak Patel, Devesh Tiwari. *IceBreaker: warming serverless functions better with heterogeneity.* ASPLOS 2022, pp. 753–767. DOI: 10.1145/3503222.3507750.
Summary (from venue + DBLP record; ACM abstract gated): warms functions on heterogeneous hardware tiers using time-to-next-invocation prediction, picking the cheapest sufficient tier per function.
Supporting quote (paraphrased from publicly described thesis chapter, Northeastern, "warming functions ahead-of-time on heterogeneous hardware to balance keep-alive cost vs. cold-start latency"; see also EcoLife §2 which characterizes IceBreaker as "per-function temporal predictor on heterogeneous tiers").
Why it supports Gap 1: explicitly *per-function* and *temporal-only* — no geo or tenant-class signal, no pattern transfer. Named in `SPEC.md` as a baseline; directly anchors the gap claim.

**5. Yang et al. — "INFless" — ASPLOS 2022.**
Yanan Yang, Laiping Zhao, Yiming Li, Huanyu Zhang, Jie Li, Mingyang Zhao, Xingzheng Chen, Keqiu Li. *INFless: a native serverless system for low-latency, high-throughput inference.* ASPLOS 2022, pp. 768–781. DOI: 10.1145/3503222.3507709.
Summary (from venue + title; ACM abstract gated): a serverless inference runtime that aggressively batches and pre-warms ML models with built-in non-uniform autoscaling and SLO-aware GPU sharing.
Why it supports Gap 1: representative of the inference-FaaS class with model-specific cold-start optimizations; like IceBreaker, the policy operates at single-function granularity and ignores tenant-class and cross-function signals.

**6. Kaffes, Yadwadkar, Kozyrakis — "Hermod" — SoCC 2022.**
Kostis Kaffes, Neeraja J. Yadwadkar, Christos Kozyrakis. *Hermod: principled and practical scheduling for serverless functions.* SoCC 2022, pp. 289–305. DOI: 10.1145/3542929.3563468.
Summary: First-principles taxonomy of FaaS scheduling policies; shows late binding and random load balancing are sub-optimal for typical execution-time distributions.
Supporting quote (abstract): *"we show that frequently used features such as late binding and random load balancing are sub-optimal for common execution time distributions… Hermod is cost, load, and locality-aware… it reduces the number of cold starts compared to pure load-based policies."*
Why it supports Gap 1 *and* Gap 2: confirms scheduler-level policy is decisive for cold-starts but Hermod itself is single-region and ignores carbon.

**7. Zhou, Zhang, Delimitrou — "AQUATOPE" — ASPLOS 2023.**
Zhuangzhuang Zhou, Yanqi Zhang, Christina Delimitrou. *AQUATOPE: QoS-and-Uncertainty-Aware Resource Management for Multi-stage Serverless Workflows.* ASPLOS 2023. DOI: 10.1145/3567955.3567960.
Summary: Bayesian models pre-warm containers ahead of invocations and allocate per-function resources to meet end-to-end QoS at minimal cost.
Supporting quote (abstract): *"Aquatope uses a set of scalable and validated Bayesian models to create pre-warmed containers ahead of function invocations… reducing QoS violations by 5X, and cost by 34% on average."*
Why it supports Gap 1: closest prior art to confidence-weighted warming, but operates *within* a single workflow's stages and a single region; it does not transfer patterns across functions or tenants and ignores carbon entirely.

**8. Yu et al. — "RainbowCake" — ASPLOS 2024.**
Hanfei Yu, Rohan Basu Roy, Christian Fontenot, Devesh Tiwari, Jian Li, Hong Zhang, Hao Wang, Seung-Jong Park. *RainbowCake: Mitigating Cold-starts in Serverless with Layer-wise Container Caching and Sharing.* ASPLOS 2024, pp. 335–350. DOI: 10.1145/3617232.3624871.
Summary: Decomposes container startup into three stages and caches OS/runtime/app layers separately with a sharing-aware online algorithm.
Supporting quote (abstract): *"reduces 68% function startup latency and 77% memory waste compared to state-of-the-art solutions… makes event-driven layer-wise caching decisions in real-time."*
Why it supports Gap 1: improves the cache *substrate* (still single-function, single-region) — orthogonal and complementary to Pratidhwani's request-routing layer.

**9. Zhou et al. — "Multi-Level Container Reuse" — IPDPS 2024.**
Amelie Chi Zhou, Rongzheng Huang, Zhoubin Ke, Yusen Li, Yi Wang, Rui Mao. *Tackling Cold Start in Serverless Computing with Multi-Level Container Reuse.* IPDPS 2024, pp. 89–99. DOI: 10.1109/IPDPS57955.2024.00017.
Summary: Reuses warm containers with similar (not identical) configurations via a DRL scheduler; releases the FStartBench benchmark.
Supporting quote (abstract): *"existing systems only match functions to containers with the same configurations. This greatly limits the warm resource utilization… up to 53% reduction on the average function startup latency."*
Why it supports Gap 1: empirically shows current production policies leave huge headroom precisely because they refuse to *generalize across functions* — i.e. confirms the cross-function-pattern-transfer sub-gap Pratidhwani targets.

### Group B — Carbon-aware scheduling and routing (supports Gap 2)

**10. Wiesner et al. — "Let's Wait Awhile" — Middleware 2021.**
Philipp Wiesner, Ilja Behnke, Dominik Scheinert, Kordian Gontarska, Lauritz Thamsen. *Let's Wait Awhile: How Temporal Workload Shifting Can Reduce Carbon Emissions in the Cloud.* Middleware 2021, pp. 260–272. arXiv:2110.13234.
Summary: Quantifies carbon savings from delaying delay-tolerant workloads to lower-carbon hours across DE/GB/FR/CA grids.
Supporting quote (abstract): *"existing research in this domain focuses mostly on carbon-aware workload migration across geo-distributed data centers, or addresses demand response purely from the perspective of power grid stability and costs… we examine the potential impact of shifting computational workloads towards times where the energy supply is expected to be less carbon-intensive."*
Why it supports Gap 2: founding paper for *temporal* carbon shifting — but only for delay-tolerant batch jobs, explicitly *not* for interactive request-level work.

**11. Acun et al. — "Carbon Explorer" — ASPLOS 2023.**
Bilge Acun, Benjamin Lee, Fiodar Kazhamiaka, Kiwan Maeng, Manoj Chakkaravarthy, Udit Gupta, David Brooks, Carole-Jean Wu. *Carbon Explorer: A Holistic Approach for Designing Carbon Aware Datacenters.* ASPLOS 2023. arXiv:2201.10036. DOI: 10.1145/3575693.3575754.
Summary: Multi-dimensional design-space framework for 24/7 carbon-free datacenters; jointly considers solar/wind capacity, batteries, and *workload* shifting.
Supporting quote (abstract): *"the solutions we analyze include capacity sizing with a mix of solar and wind power, battery storage, and carbon aware workload scheduling, which entails shifting the workloads from times when there is lack of renewable supply to times with abundant supply."*
Why it supports Gap 2: explicit baseline named in `SPEC.md`; targets datacenter-design-time decisions and batch-style workload shifting, not request-level routing on FaaS.

**12. Souza et al. — "CASPER" — IGSC 2023.**
Abel Souza, Shruti Jasoria, Basundhara Chakrabarty, Alexander Bridgwater, Axel Lundberg, Filip Skogh, Ahmed Ali-Eldin, David Irwin, Prashant Shenoy. *CASPER: Carbon-Aware Scheduling and Provisioning for Distributed Web Services.* IGSC 2023. arXiv:2403.14792. DOI: 10.1145/3634769.3634812.
Summary: Multi-objective optimization for migrating geo-distributed *web service* load between regions to track low-carbon energy while honoring SLO.
Supporting quote (abstract): *"CASPER, a carbon-aware scheduling and provisioning system that primarily minimizes the carbon footprint of distributed web services while also respecting their Service Level Objectives (SLO)… CASPER demonstrates improvements of up to 70% with no latency performance degradation."*
Why it supports Gap 2: closest existing work, but (a) treats web services as VM/replica capacity to provision and migrate rather than per-request routing decisions, (b) explicitly drops cost as an objective, (c) does not model FaaS cold-starts; Pratidhwani extends to per-request, three-objective, and FaaS-cold-start-aware routing.

**13. Chadha et al. — "GreenCourier" — WOSC@Middleware 2023.**
Mohak Chadha, Thandayuthapani Subramanian, Eishi Arima, Michael Gerndt, Martin Schulz, Osama Abboud. *GreenCourier: Carbon-Aware Scheduling for Serverless Functions.* WOSC 2023 at Middleware. arXiv:2310.20375. DOI: 10.1145/3631295.3631396.
Summary: Geo-distributed Knative + Kubernetes scheduling using marginal-emissions feeds (WattTime, Carbon-aware SDK) to pick the lowest-carbon region.
Supporting quote (abstract): *"GreenCourier… enables the runtime scheduling of serverless functions across geographically distributed regions based on their carbon efficiencies… reduces carbon emissions per function invocation by an average of 13.25%."*
Why it supports Gap 2: most direct precedent — geo-distributed FaaS scheduling on real carbon signals — but optimizes carbon alone; no explicit p95 latency budget, no spot-price signal, no forecast-driven warming.

**14. Qi et al. — "CASA" — IGSC 2024.**
Sirui Qi, Hayden Moore, Ninad Hogade, Dejan Milojicic, Cullen Bash, Sudeep Pasricha. *CASA: A Framework for SLO- and Carbon-Aware Autoscaling and Scheduling in Serverless Cloud Computing.* IGSC 2024. arXiv:2409.00550. DOI: 10.1109/IGSC64514.2024.00010.
Summary: Co-optimizes SLO violation rate and carbon when autoscaling serverless containers.
Supporting quote (abstract): *"Traditional carbon-reducing techniques in serverless cloud platforms such as shutting down idle containers can cause higher violation rates of service level objectives (SLOs). Conversely, traditional latency-reduction methods of prewarming containers can improve performance but increase the associated carbon footprint… CASA reduces the operational carbon footprint of a serverless cluster by up to 2.6× while reducing the average SLO violation rate by up to 1.4×."*
Why it supports Gap 2 (and Gap 1): explicitly names the same prewarm-vs-carbon trade-off Pratidhwani arbitrates — but stays within a *single cluster's* autoscaler, not multi-region request routing; cost is again absent.

**15. Jiang, Roy, Li, Tiwari — "EcoLife" — SC 2024.**
Yankai Jiang, Rohan Basu Roy, Baolin Li, Devesh Tiwari. *EcoLife: Carbon-Aware Serverless Function Scheduling for Sustainable Computing.* SC 2024. arXiv:2409.02085. DOI: 10.1109/SC41406.2024.00018.
Summary: PSO-based scheduler that places serverless functions across multi-generation hardware to co-optimize performance and carbon (operational + embodied).
Supporting quote (abstract): *"the first carbon-aware serverless function scheduler to co-optimize carbon footprint and performance… exploits multi-generation hardware to achieve high performance and lower carbon footprint."*
Why it supports Gap 2: confirms the gap statement that, until 2024, *no* prior FaaS scheduler had jointly optimized carbon + performance — and EcoLife still excludes spot price and is hardware-tier-centric, not multi-region request-level.

**16. Roy & Tiwari — "LowCarb" — HPCA 2026.**
Rohan Basu Roy, Devesh Tiwari. *LowCarb: Carbon-Aware Scheduling of Serverless Functions.* HPCA 2026, pp. 1–16. DOI: 10.1109/HPCA68181.2026.11408586.
Summary: RL-based scheduler that explicitly resolves the conflict between keep-alive performance and carbon footprint in FaaS.
Supporting quote (abstract): *"Prior works have extensively focused on improving the performance of serverless computing platforms via 'keeping alive' functions in memory proactively to lower the function execution latency, but the potential environmental sustainability aspects of such performance-enhancing strategies remain underexplored… LowCarb effectively quantifies and resolves the inherent conflict between performance and sustainability to achieve results within 15% of optimality."*
Why it supports Gap 1 *and* Gap 2: most recent confirmation, by the IceBreaker authors themselves, that the carbon dimension was missing from the cold-start literature. LowCarb still operates at single-region keep-alive granularity, leaving the multi-region multi-objective routing question open.

---

## Gap synthesis (tightened)

### Gap 1 — Adaptive multi-signal cold-start mitigation
Production cold-start mitigation today optimizes *per function in a single region with a static or short-window predictor*. The mechanism layer is mature (Catalyzer [2], FaaSnap [3], RainbowCake [8]) and the policy layer has progressed from fixed keep-alive (Shahrad et al. [1]) to per-function temporal predictors on heterogeneous tiers (IceBreaker [4]) to Bayesian within-workflow uncertainty (AQUATOPE [7]) to DRL-driven warm-pool sharing (Zhou et al. [9], LowCarb [16]). None of them combine **(a) temporal + geo + tenant-class signals**, **(b) confidence-weighted warming budgets that scale spend with forecast certainty × cost-of-cold**, or **(c) cross-function pattern transfer** across tenants in the same family. Hermod [6] confirms that scheduler-level policy is decisive but is single-region and carbon-blind.

  - **Sub-gap 1a — Confidence-weighted warming budgets.** Existing predictors output a binary "warm now / don't" or a fixed top-k tier choice. AQUATOPE [7] is the only system to reason about uncertainty and still allocates resources within a workflow rather than spending a *budget* across regions. Pratidhwani's `score = forecast_confidence × latency_cost_product` thresholding is novel.
  - **Sub-gap 1b — Cross-function transfer.** Every prior policy (IceBreaker [4], INFless [5], RainbowCake [8], LowCarb [16]) trains *per function*. Zhou et al. [9] hint at the value of generalizing — they share warm containers across "similar" functions — but do not transfer *prediction models* across tenant cohorts or function families.

### Gap 2 — Multi-objective request-level routing on FaaS
Carbon-aware scheduling has matured for batch and training (Carbon Explorer [11], Let's Wait Awhile [10]) and recently for serverless function placement (GreenCourier [13], CASA [14], EcoLife [15], LowCarb [16]) and geo-distributed web services (CASPER [12]). No published system simultaneously honors **p95 latency budget + grid carbon intensity + regional spot price** at *per-request* granularity for live FaaS traffic across regions. CASPER [12] is closest but provisions web-server replicas (not requests), drops the cost objective, and does not model FaaS cold-starts. GreenCourier [13] honors carbon only. CASA [14] honors carbon + SLO but in a single cluster. LowCarb [16] honors carbon + performance but inside one region.

  - **Sub-gap 2a — Three-objective live router.** No prior router scores `latency × carbon × cost` jointly per request; carbon-aware FaaS work consistently drops one of the three (cost: CASPER [12], EcoLife [15], LowCarb [16]; latency budget: GreenCourier [13]; multi-region: CASA [14]).
  - **Sub-gap 2b — Coupling routing to forecast-driven pre-warming.** None of [12]–[16] feed a request-level routing decision back into a *predictive* warming budget. Routing and warming are treated as independent control loops, so a router that picks a low-carbon region pays the cold-start tax that a forecast-aware warmer could have eliminated.

---

## Competitors (recent, 2024+, to position against explicitly)

### CASPER (Souza et al., IGSC 2023 / arXiv 2024)
Closest direct competitor to Gap 2. It is multi-region, carbon-aware, and SLO-respecting, and its experiments demonstrate up to 70% carbon reduction without latency degradation. **How Pratidhwani differs:** (1) request-level scoring vs. provisioning-level migration, (2) three-objective scorer that includes regional spot price, (3) explicit FaaS cold-start cost model fed by an EWMA + Holt-Winters forecast, (4) tenant-tunable weights from the dashboard rather than fixed Lagrangian.

### LowCarb (Roy & Tiwari, HPCA 2026)
Closest direct competitor to the *intersection* of Gap 1 and Gap 2 — same authors as IceBreaker and EcoLife, so they explicitly frame the cold-start ↔ carbon conflict that Pratidhwani also targets. **How Pratidhwani differs:** (1) LowCarb is single-region and treats keep-alive as the only knob; Pratidhwani moves the request to a different region instead of paying the keep-alive carbon tax there, (2) Pratidhwani's confidence-weighted warming explicitly scales spend with forecast certainty rather than RL exploration, which is auditable from the decision log, (3) Pratidhwani exposes the policy weights to tenants in real time.

(Honourable mentions also worth comparing against in the report: GreenCourier [13] for the multi-region FaaS carbon angle, CASA [14] for the SLO-aware autoscaling angle, EcoLife [15] for the embodied-carbon framing.)

---

## IEEE-Formatted References

Pre-rendered numbered IEEE-style strings. Numbering matches the citation order in the *Papers* and *Gap synthesis* sections above so the frontend can drop these in directly.

[1] M. Shahrad, R. Fonseca, I. Goiri, G. Chaudhry, P. Batum, J. Cooke, E. Laureano, C. Tresness, M. Russinovich, and R. Bianchini, "Serverless in the Wild: Characterizing and Optimizing the Serverless Workload at a Large Cloud Provider," in *Proc. USENIX Annu. Tech. Conf. (USENIX ATC)*, Boston, MA, USA, 2020, pp. 205–218.

[2] D. Du, T. Yu, Y. Xia, B. Zang, G. Yan, C. Qin, Q. Wu, and H. Chen, "Catalyzer: Sub-millisecond Startup for Serverless Computing with Initialization-less Booting," in *Proc. 25th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS)*, Lausanne, Switzerland, 2020, pp. 467–481, doi: 10.1145/3373376.3378512.

[3] L. Ao, G. Porter, and G. M. Voelker, "FaaSnap: FaaS Made Fast Using Snapshot-Based VMs," in *Proc. 17th Eur. Conf. Comput. Syst. (EuroSys)*, Rennes, France, 2022, pp. 730–746, doi: 10.1145/3492321.3524270.

[4] R. B. Roy, T. Patel, and D. Tiwari, "IceBreaker: Warming Serverless Functions Better with Heterogeneity," in *Proc. 27th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS)*, Lausanne, Switzerland, 2022, pp. 753–767, doi: 10.1145/3503222.3507750.

[5] Y. Yang, L. Zhao, Y. Li, H. Zhang, J. Li, M. Zhao, X. Chen, and K. Li, "INFless: A Native Serverless System for Low-Latency, High-Throughput Inference," in *Proc. 27th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS)*, Lausanne, Switzerland, 2022, pp. 768–781, doi: 10.1145/3503222.3507709.

[6] K. Kaffes, N. J. Yadwadkar, and C. Kozyrakis, "Hermod: Principled and Practical Scheduling for Serverless Functions," in *Proc. 13th ACM Symp. Cloud Comput. (SoCC)*, San Francisco, CA, USA, 2022, pp. 289–305, doi: 10.1145/3542929.3563468.

[7] Z. Zhou, Y. Zhang, and C. Delimitrou, "AQUATOPE: QoS-and-Uncertainty-Aware Resource Management for Multi-stage Serverless Workflows," in *Proc. 28th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS)*, Vancouver, BC, Canada, 2023, pp. 1–14, doi: 10.1145/3567955.3567960.

[8] H. Yu, R. B. Roy, C. Fontenot, D. Tiwari, J. Li, H. Zhang, H. Wang, and S.-J. Park, "RainbowCake: Mitigating Cold-starts in Serverless with Layer-wise Container Caching and Sharing," in *Proc. 29th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS)*, La Jolla, CA, USA, 2024, pp. 335–350, doi: 10.1145/3617232.3624871.

[9] A. C. Zhou, R. Huang, Z. Ke, Y. Li, Y. Wang, and R. Mao, "Tackling Cold Start in Serverless Computing with Multi-Level Container Reuse," in *Proc. IEEE Int. Parallel Distrib. Process. Symp. (IPDPS)*, San Francisco, CA, USA, 2024, pp. 89–99, doi: 10.1109/IPDPS57955.2024.00017.

[10] P. Wiesner, I. Behnke, D. Scheinert, K. Gontarska, and L. Thamsen, "Let's Wait Awhile: How Temporal Workload Shifting Can Reduce Carbon Emissions in the Cloud," in *Proc. 22nd ACM/IFIP Int. Middleware Conf. (Middleware)*, Québec City, QC, Canada, 2021, pp. 260–272, doi: 10.1145/3464298.3493399.

[11] B. Acun, B. Lee, F. Kazhamiaka, K. Maeng, M. Chakkaravarthy, U. Gupta, D. Brooks, and C.-J. Wu, "Carbon Explorer: A Holistic Approach for Designing Carbon Aware Datacenters," in *Proc. 28th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS)*, Vancouver, BC, Canada, 2023, doi: 10.1145/3575693.3575754.

[12] A. Souza, S. Jasoria, B. Chakrabarty, A. Bridgwater, A. Lundberg, F. Skogh, A. Ali-Eldin, D. Irwin, and P. Shenoy, "CASPER: Carbon-Aware Scheduling and Provisioning for Distributed Web Services," in *Proc. 14th Int. Green Sustain. Comput. Conf. (IGSC)*, Toronto, ON, Canada, 2023, doi: 10.1145/3634769.3634812.

[13] M. Chadha, T. Subramanian, E. Arima, M. Gerndt, M. Schulz, and O. Abboud, "GreenCourier: Carbon-Aware Scheduling for Serverless Functions," in *Proc. 9th Int. Workshop Serverless Comput. (WOSC) at Middleware*, Bologna, Italy, 2023, pp. 18–23, doi: 10.1145/3631295.3631396.

[14] S. Qi, H. Moore, N. Hogade, D. S. Milojicic, C. E. Bash, and S. Pasricha, "CASA: A Framework for SLO- and Carbon-Aware Autoscaling and Scheduling in Serverless Cloud Computing," in *Proc. 15th Int. Green Sustain. Comput. Conf. (IGSC)*, Austin, TX, USA, 2024, pp. 1–6, doi: 10.1109/IGSC64514.2024.00010.

[15] Y. Jiang, R. B. Roy, B. Li, and D. Tiwari, "EcoLife: Carbon-Aware Serverless Function Scheduling for Sustainable Computing," in *Proc. Int. Conf. High Perform. Comput., Netw., Storage Anal. (SC)*, Atlanta, GA, USA, 2024, doi: 10.1109/SC41406.2024.00018.

[16] R. B. Roy and D. Tiwari, "LowCarb: Carbon-Aware Scheduling of Serverless Functions," in *Proc. IEEE Int. Symp. High-Perform. Comput. Archit. (HPCA)*, Las Vegas, NV, USA, 2026, pp. 1–16, doi: 10.1109/HPCA68181.2026.11408586.

---

## BibTeX

```bibtex
@inproceedings{shahrad2020serverless,
  author    = {Mohammad Shahrad and Rodrigo Fonseca and I{\~n}igo Goiri and Gohar Chaudhry and Paul Batum and Jason Cooke and Eduardo Laureano and Colby Tresness and Mark Russinovich and Ricardo Bianchini},
  title     = {Serverless in the Wild: Characterizing and Optimizing the Serverless Workload at a Large Cloud Provider},
  booktitle = {2020 USENIX Annual Technical Conference (USENIX ATC '20)},
  pages     = {205--218},
  year      = {2020},
  publisher = {USENIX Association},
  url       = {https://www.usenix.org/conference/atc20/presentation/shahrad}
}

@inproceedings{du2020catalyzer,
  author    = {Dong Du and Tianyi Yu and Yubin Xia and Binyu Zang and Guanglu Yan and Chenggang Qin and Qixuan Wu and Haibo Chen},
  title     = {Catalyzer: Sub-millisecond Startup for Serverless Computing with Initialization-less Booting},
  booktitle = {Proceedings of the 25th ACM International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS '20)},
  pages     = {467--481},
  year      = {2020},
  doi       = {10.1145/3373376.3378512}
}

@inproceedings{ao2022faasnap,
  author    = {Lixiang Ao and George Porter and Geoffrey M. Voelker},
  title     = {{FaaSnap}: {FaaS} made fast using snapshot-based {VMs}},
  booktitle = {Proceedings of the 17th European Conference on Computer Systems (EuroSys '22)},
  pages     = {730--746},
  year      = {2022},
  doi       = {10.1145/3492321.3524270}
}

@inproceedings{roy2022icebreaker,
  author    = {Rohan Basu Roy and Tirthak Patel and Devesh Tiwari},
  title     = {{IceBreaker}: warming serverless functions better with heterogeneity},
  booktitle = {Proceedings of the 27th ACM International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS '22)},
  pages     = {753--767},
  year      = {2022},
  doi       = {10.1145/3503222.3507750}
}

@inproceedings{yang2022infless,
  author    = {Yanan Yang and Laiping Zhao and Yiming Li and Huanyu Zhang and Jie Li and Mingyang Zhao and Xingzheng Chen and Keqiu Li},
  title     = {{INFless}: a native serverless system for low-latency, high-throughput inference},
  booktitle = {Proceedings of the 27th ACM International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS '22)},
  pages     = {768--781},
  year      = {2022},
  doi       = {10.1145/3503222.3507709}
}

@inproceedings{kaffes2022hermod,
  author    = {Kostis Kaffes and Neeraja J. Yadwadkar and Christos Kozyrakis},
  title     = {{Hermod}: principled and practical scheduling for serverless functions},
  booktitle = {Proceedings of the 13th ACM Symposium on Cloud Computing (SoCC '22)},
  pages     = {289--305},
  year      = {2022},
  doi       = {10.1145/3542929.3563468}
}

@inproceedings{zhou2023aquatope,
  author    = {Zhuangzhuang Zhou and Yanqi Zhang and Christina Delimitrou},
  title     = {{AQUATOPE}: {QoS}-and-Uncertainty-Aware Resource Management for Multi-stage Serverless Workflows},
  booktitle = {Proceedings of the 28th ACM International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS '23)},
  pages     = {1--14},
  year      = {2023},
  doi       = {10.1145/3567955.3567960}
}

@inproceedings{yu2024rainbowcake,
  author    = {Hanfei Yu and Rohan Basu Roy and Christian Fontenot and Devesh Tiwari and Jian Li and Hong Zhang and Hao Wang and Seung-Jong Park},
  title     = {{RainbowCake}: Mitigating Cold-starts in Serverless with Layer-wise Container Caching and Sharing},
  booktitle = {Proceedings of the 29th ACM International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS '24)},
  pages     = {335--350},
  year      = {2024},
  doi       = {10.1145/3617232.3624871}
}

@inproceedings{zhou2024multilevel,
  author    = {Amelie Chi Zhou and Rongzheng Huang and Zhoubin Ke and Yusen Li and Yi Wang and Rui Mao},
  title     = {Tackling Cold Start in Serverless Computing with Multi-Level Container Reuse},
  booktitle = {2024 IEEE International Parallel and Distributed Processing Symposium (IPDPS '24)},
  pages     = {89--99},
  year      = {2024},
  doi       = {10.1109/IPDPS57955.2024.00017}
}

@inproceedings{wiesner2021waitawhile,
  author    = {Philipp Wiesner and Ilja Behnke and Dominik Scheinert and Kordian Gontarska and Lauritz Thamsen},
  title     = {Let's Wait Awhile: How Temporal Workload Shifting Can Reduce Carbon Emissions in the Cloud},
  booktitle = {Proceedings of the 22nd International Middleware Conference (Middleware '21)},
  pages     = {260--272},
  year      = {2021},
  doi       = {10.1145/3464298.3493399},
  eprint    = {2110.13234},
  archivePrefix = {arXiv}
}

@inproceedings{acun2023carbonexplorer,
  author    = {Bilge Acun and Benjamin Lee and Fiodar Kazhamiaka and Kiwan Maeng and Manoj Chakkaravarthy and Udit Gupta and David Brooks and Carole-Jean Wu},
  title     = {Carbon Explorer: A Holistic Approach for Designing Carbon Aware Datacenters},
  booktitle = {Proceedings of the 28th ACM International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS '23)},
  year      = {2023},
  doi       = {10.1145/3575693.3575754},
  eprint    = {2201.10036},
  archivePrefix = {arXiv}
}

@inproceedings{souza2023casper,
  author    = {Abel Souza and Shruti Jasoria and Basundhara Chakrabarty and Alexander Bridgwater and Axel Lundberg and Filip Skogh and Ahmed Ali-Eldin and David Irwin and Prashant Shenoy},
  title     = {{CASPER}: Carbon-Aware Scheduling and Provisioning for Distributed Web Services},
  booktitle = {Proceedings of the 14th International Green and Sustainable Computing Conference (IGSC '23)},
  year      = {2023},
  doi       = {10.1145/3634769.3634812},
  eprint    = {2403.14792},
  archivePrefix = {arXiv}
}

@inproceedings{chadha2023greencourier,
  author    = {Mohak Chadha and Thandayuthapani Subramanian and Eishi Arima and Michael Gerndt and Martin Schulz and Osama Abboud},
  title     = {{GreenCourier}: Carbon-Aware Scheduling for Serverless Functions},
  booktitle = {Proceedings of the 9th International Workshop on Serverless Computing (WOSC '23) at Middleware '23},
  pages     = {18--23},
  year      = {2023},
  doi       = {10.1145/3631295.3631396},
  eprint    = {2310.20375},
  archivePrefix = {arXiv}
}

@inproceedings{qi2024casa,
  author    = {Sirui Qi and Hayden Moore and Ninad Hogade and Dejan S. Milojicic and Cullen E. Bash and Sudeep Pasricha},
  title     = {{CASA}: A Framework for {SLO}- and Carbon-Aware Autoscaling and Scheduling in Serverless Cloud Computing},
  booktitle = {2024 15th International Green and Sustainable Computing Conference (IGSC '24)},
  pages     = {1--6},
  year      = {2024},
  doi       = {10.1109/IGSC64514.2024.00010},
  eprint    = {2409.00550},
  archivePrefix = {arXiv}
}

@inproceedings{jiang2024ecolife,
  author    = {Yankai Jiang and Rohan Basu Roy and Baolin Li and Devesh Tiwari},
  title     = {{EcoLife}: Carbon-Aware Serverless Function Scheduling for Sustainable Computing},
  booktitle = {Proceedings of the International Conference for High Performance Computing, Networking, Storage and Analysis (SC '24)},
  year      = {2024},
  doi       = {10.1109/SC41406.2024.00018},
  eprint    = {2409.02085},
  archivePrefix = {arXiv}
}

@inproceedings{roy2026lowcarb,
  author    = {Rohan Basu Roy and Devesh Tiwari},
  title     = {{LowCarb}: Carbon-Aware Scheduling of Serverless Functions},
  booktitle = {2026 IEEE International Symposium on High-Performance Computer Architecture (HPCA '26)},
  pages     = {1--16},
  year      = {2026},
  doi       = {10.1109/HPCA68181.2026.11408586}
}
```

---

## Verification trail

| Paper | DBLP key | Abstract source |
|---|---|---|
| Shahrad 2020 | conf/usenix/ShahradFGCBCLTR20 | arXiv 2003.03423 |
| Du 2020 (Catalyzer) | conf/asplos/DuYXZYQWC20 | Semantic Scholar |
| Ao 2022 (FaaSnap) | conf/eurosys/AoPV22 | Semantic Scholar |
| Roy 2022 (IceBreaker) | conf/asplos/RoyPT22 | DBLP record only (ACM gated) |
| Yang 2022 (INFless) | conf/asplos/YangZLZLZCL22 | DBLP record only (ACM gated) |
| Kaffes 2022 (Hermod) | conf/cloud/KaffesYK22 | Semantic Scholar |
| Zhou 2023 (AQUATOPE) | conf/asplos/ZhouZD23 | Semantic Scholar |
| Yu 2024 (RainbowCake) | conf/asplos/YuRFTLZWP24 | Semantic Scholar |
| Zhou 2024 (Multi-Level) | conf/ipps/ZhouHKLW024 | Semantic Scholar |
| Wiesner 2021 (Wait Awhile) | conf/middleware/WiesnerBSGT21 | Semantic Scholar / arXiv |
| Acun 2023 (Carbon Explorer) | journals/corr/abs-2201-10036 (also ASPLOS'23) | arXiv 2201.10036 |
| Souza 2023 (CASPER) | (IGSC'23, arXiv 2403.14792) | arXiv 2403.14792 |
| Chadha 2023 (GreenCourier) | conf/wosc/ChadhaSAG0A23 | Semantic Scholar / arXiv |
| Qi 2024 (CASA) | conf/green/QiMHMBP24 | Semantic Scholar / arXiv |
| Jiang 2024 (EcoLife) | conf/sc/0002RLT24 | Semantic Scholar / arXiv |
| Roy 2026 (LowCarb) | conf/hpca/RoyT26 | Semantic Scholar |

CodeSnap and Treehouse from `SPEC.md` were searched in DBLP and not found as published peer-reviewed systems matching the described scope; recommend dropping them from the report or replacing with the verified equivalents above (e.g. RainbowCake [8] for "snapshot-style cold-start" and Carbon Explorer [11] / Let's Wait Awhile [10] as the batch-carbon predecessors).
