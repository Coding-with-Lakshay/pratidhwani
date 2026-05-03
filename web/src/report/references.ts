/**
 * IEEE-formatted references rendered for the /report bibliography.
 * Numbering matches the citation order in /docs/literature.md.
 *
 * Keep this file in sync with /docs/literature.md when the researcher
 * updates citations.
 */
export interface Reference {
  id: string; // citation key, e.g. shahrad2020
  citation: string;
}

export const references: Reference[] = [
  {
    id: "shahrad2020",
    citation:
      'M. Shahrad, R. Fonseca, I. Goiri, G. Chaudhry, P. Batum, J. Cooke, E. Laureano, C. Tresness, M. Russinovich, and R. Bianchini, "Serverless in the Wild: Characterizing and Optimizing the Serverless Workload at a Large Cloud Provider," in Proc. USENIX Annu. Tech. Conf. (USENIX ATC), Boston, MA, USA, 2020, pp. 205–218.',
  },
  {
    id: "du2020catalyzer",
    citation:
      'D. Du, T. Yu, Y. Xia, B. Zang, G. Yan, C. Qin, Q. Wu, and H. Chen, "Catalyzer: Sub-millisecond Startup for Serverless Computing with Initialization-less Booting," in Proc. 25th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS), Lausanne, Switzerland, 2020, pp. 467–481, doi: 10.1145/3373376.3378512.',
  },
  {
    id: "ao2022faasnap",
    citation:
      'L. Ao, G. Porter, and G. M. Voelker, "FaaSnap: FaaS Made Fast Using Snapshot-Based VMs," in Proc. 17th Eur. Conf. Comput. Syst. (EuroSys), Rennes, France, 2022, pp. 730–746, doi: 10.1145/3492321.3524270.',
  },
  {
    id: "roy2022icebreaker",
    citation:
      'R. B. Roy, T. Patel, and D. Tiwari, "IceBreaker: Warming Serverless Functions Better with Heterogeneity," in Proc. 27th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS), Lausanne, Switzerland, 2022, pp. 753–767, doi: 10.1145/3503222.3507750.',
  },
  {
    id: "yang2022infless",
    citation:
      'Y. Yang, L. Zhao, Y. Li, H. Zhang, J. Li, M. Zhao, X. Chen, and K. Li, "INFless: A Native Serverless System for Low-Latency, High-Throughput Inference," in Proc. 27th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS), Lausanne, Switzerland, 2022, pp. 768–781, doi: 10.1145/3503222.3507709.',
  },
  {
    id: "kaffes2022hermod",
    citation:
      'K. Kaffes, N. J. Yadwadkar, and C. Kozyrakis, "Hermod: Principled and Practical Scheduling for Serverless Functions," in Proc. 13th ACM Symp. Cloud Comput. (SoCC), San Francisco, CA, USA, 2022, pp. 289–305, doi: 10.1145/3542929.3563468.',
  },
  {
    id: "zhou2023aquatope",
    citation:
      'Z. Zhou, Y. Zhang, and C. Delimitrou, "AQUATOPE: QoS-and-Uncertainty-Aware Resource Management for Multi-stage Serverless Workflows," in Proc. 28th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS), Vancouver, BC, Canada, 2023, pp. 1–14, doi: 10.1145/3567955.3567960.',
  },
  {
    id: "yu2024rainbowcake",
    citation:
      'H. Yu, R. B. Roy, C. Fontenot, D. Tiwari, J. Li, H. Zhang, H. Wang, and S.-J. Park, "RainbowCake: Mitigating Cold-starts in Serverless with Layer-wise Container Caching and Sharing," in Proc. 29th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS), La Jolla, CA, USA, 2024, pp. 335–350, doi: 10.1145/3617232.3624871.',
  },
  {
    id: "zhou2024multilevel",
    citation:
      'A. C. Zhou, R. Huang, Z. Ke, Y. Li, Y. Wang, and R. Mao, "Tackling Cold Start in Serverless Computing with Multi-Level Container Reuse," in Proc. IEEE Int. Parallel Distrib. Process. Symp. (IPDPS), San Francisco, CA, USA, 2024, pp. 89–99, doi: 10.1109/IPDPS57955.2024.00017.',
  },
  {
    id: "wiesner2021waitawhile",
    citation:
      'P. Wiesner, I. Behnke, D. Scheinert, K. Gontarska, and L. Thamsen, "Let’s Wait Awhile: How Temporal Workload Shifting Can Reduce Carbon Emissions in the Cloud," in Proc. 22nd ACM/IFIP Int. Middleware Conf. (Middleware), Québec City, QC, Canada, 2021, pp. 260–272, doi: 10.1145/3464298.3493399.',
  },
  {
    id: "acun2023carbonexplorer",
    citation:
      'B. Acun, B. Lee, F. Kazhamiaka, K. Maeng, M. Chakkaravarthy, U. Gupta, D. Brooks, and C.-J. Wu, "Carbon Explorer: A Holistic Approach for Designing Carbon Aware Datacenters," in Proc. 28th ACM Int. Conf. Archit. Support Program. Lang. Oper. Syst. (ASPLOS), Vancouver, BC, Canada, 2023, doi: 10.1145/3575693.3575754.',
  },
  {
    id: "souza2023casper",
    citation:
      'A. Souza, S. Jasoria, B. Chakrabarty, A. Bridgwater, A. Lundberg, F. Skogh, A. Ali-Eldin, D. Irwin, and P. Shenoy, "CASPER: Carbon-Aware Scheduling and Provisioning for Distributed Web Services," in Proc. 14th Int. Green Sustain. Comput. Conf. (IGSC), Toronto, ON, Canada, 2023, doi: 10.1145/3634769.3634812.',
  },
  {
    id: "chadha2023greencourier",
    citation:
      'M. Chadha, T. Subramanian, E. Arima, M. Gerndt, M. Schulz, and O. Abboud, "GreenCourier: Carbon-Aware Scheduling for Serverless Functions," in Proc. 9th Int. Workshop Serverless Comput. (WOSC) at Middleware, Bologna, Italy, 2023, pp. 18–23, doi: 10.1145/3631295.3631396.',
  },
  {
    id: "qi2024casa",
    citation:
      'S. Qi, H. Moore, N. Hogade, D. S. Milojicic, C. E. Bash, and S. Pasricha, "CASA: A Framework for SLO- and Carbon-Aware Autoscaling and Scheduling in Serverless Cloud Computing," in Proc. 15th Int. Green Sustain. Comput. Conf. (IGSC), Austin, TX, USA, 2024, pp. 1–6, doi: 10.1109/IGSC64514.2024.00010.',
  },
  {
    id: "jiang2024ecolife",
    citation:
      'Y. Jiang, R. B. Roy, B. Li, and D. Tiwari, "EcoLife: Carbon-Aware Serverless Function Scheduling for Sustainable Computing," in Proc. Int. Conf. High Perform. Comput., Netw., Storage Anal. (SC), Atlanta, GA, USA, 2024, doi: 10.1109/SC41406.2024.00018.',
  },
  {
    id: "roy2026lowcarb",
    citation:
      'R. B. Roy and D. Tiwari, "LowCarb: Carbon-Aware Scheduling of Serverless Functions," in Proc. IEEE Int. Symp. High-Perform. Comput. Archit. (HPCA), Las Vegas, NV, USA, 2026, pp. 1–16, doi: 10.1109/HPCA68181.2026.11408586.',
  },
];
