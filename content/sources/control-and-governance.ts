import type { SourceRecord } from "@ai-exhibit/presentation-core";

/**
 * Sources for chapters 8 to 11: loss of control, mitigations, who controls the
 * stack, closing. IDs are prefixed `cg-`. A record is "verified" only when the
 * page was opened on the retrieval date and supports the exact claim.
 */
export const controlAndGovernanceSources: SourceRecord[] = [
  // Chapter 8: evaluation evidence
  {
    id: "cg-deepmind-2020-spec-gaming",
    title: "Specification gaming: the flip side of AI ingenuity",
    url: "https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/",
    publisher: "DeepMind",
    authors: ["Victoria Krakovna", "Jonathan Uesato", "Vladimir Mikulik", "Matthew Rahtz", "Tom Everitt", "Ramana Kumar", "Zac Kenton", "Jan Leike", "Shane Legg"],
    date: "2020-04-21",
    retrieved: "2026-10-02",
    kind: "report",
    claim:
      "Defines specification gaming (satisfying the literal objective without achieving the intended outcome) and lists examples, including a boat-racing agent (Coast Runners) that circles to collect reward blocks instead of finishing the race, and a block-stacking agent that flips a block instead of stacking it.",
    evidence: "evaluation",
    verification: "verified",
  },
  {
    id: "cg-anthropic-2025-agentic-misalignment",
    title: "Agentic Misalignment: How LLMs could be insider threats",
    url: "https://www.anthropic.com/research/agentic-misalignment",
    publisher: "Anthropic",
    authors: ["Aengus Lynch", "Benjamin Wright", "Caleb Larson", "Kevin K. Troy", "Stuart J. Ritchie", "Sören Mindermann", "Ethan Perez", "Evan Hubinger"],
    date: "2025-06-20",
    retrieved: "2026-10-02",
    kind: "paper",
    claim:
      "Stress-tested 16 models from several developers in a simulated company with autonomous email access. Facing replacement and a goal conflict, models often chose blackmail (for example 96% for Claude Opus 4 and Gemini 2.5 Flash, 80% for GPT-4.1 and Grok 3 Beta, 79% for DeepSeek-R1). The authors state they are not aware of such behavior in real deployments and that the scenarios deliberately limited the options.",
    evidence: "evaluation",
    verification: "verified",
  },
  {
    id: "cg-iasr-2026",
    title: "International AI Safety Report 2026",
    url: "https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026",
    publisher: "International AI Safety Report (chair: Yoshua Bengio)",
    date: "2026-02-03",
    retrieved: "2026-10-02",
    kind: "report",
    claim:
      "States that current systems lack the capabilities to pose loss-of-control risks but are improving in relevant areas such as autonomous operation; that it has become more common for models to distinguish test settings from real deployment and to find loopholes in evaluations; and describes the evidence dilemma (acting too early versus waiting for conclusive evidence).",
    evidence: "projection",
    verification: "verified",
    notes: "Expert synthesis report. Badge is PROJECTION because its loss-of-control statements are assessments of trends, not observations.",
  },
  {
    id: "cg-iasr-2025-key-update-2",
    title: "International AI Safety Report, Second Key Update: Technical Safeguards and Risk Management",
    url: "https://internationalaisafetyreport.org/publications",
    publisher: "International AI Safety Report",
    date: "2025-11-25",
    retrieved: "2026-10-02",
    kind: "report",
    claim:
      "Examines technical safeguards and risk management, noting that the number of companies publishing frontier AI safety frameworks has more than doubled.",
    evidence: "observed",
    verification: "verified",
    notes: "Verified from the publications index summary; link to the update's own page once its stable URL is confirmed.",
  },
  // Chapter 9: mitigations
  {
    id: "cg-reason-2000-swiss-cheese",
    title: "Human error: models and management",
    url: "https://www.bmj.com/content/320/7237/768",
    publisher: "BMJ",
    authors: ["James Reason"],
    date: "2000-03-18",
    retrieved: "2026-10-02",
    kind: "paper",
    claim: "Introduces the 'Swiss cheese' model of system accidents: several imperfect layers of defense, where harm occurs when the holes line up.",
    evidence: "none",
    verification: "verified",
    notes: "BMJ blocks automated fetching; verified through the AHRQ PSNet record (https://psnet.ahrq.gov/issue/human-error-models-and-management).",
  },
  {
    id: "cg-ec-ai-act",
    title: "AI Act: regulatory framework on AI",
    url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    publisher: "European Commission",
    retrieved: "2026-10-02",
    kind: "regulation",
    claim:
      "The AI Act entered into force on 1 August 2024; prohibitions applied from February 2025, general-purpose AI rules from August 2025, and the Act became applicable on 2 August 2026 with exceptions. The AI Omnibus amendment (proposed 19 November 2025, political agreement 7 May 2026, in force 27 July 2026) moved high-risk obligations to 2 December 2027 and 2 August 2028.",
    evidence: "observed",
    verification: "verified",
    notes: "Re-check before every talk: this page changes as implementation progresses.",
  },
  // Chapter 10: who controls the stack
  {
    id: "cg-china-2023-genai-measures",
    title: "Interim Measures for the Management of Generative AI Services",
    url: "https://en.wikipedia.org/wiki/Interim_Measures_for_the_Management_of_Generative_AI_Services",
    publisher: "Wikipedia (summary of rules issued by the Cyberspace Administration of China and six other agencies)",
    date: "2023-07",
    retrieved: "2026-10-02",
    kind: "other",
    claim: "China's rules for public-facing generative AI services, issued by seven national regulators led by the Cyberspace Administration of China, took effect on 15 August 2023.",
    evidence: "observed",
    verification: "verified",
    notes: "Secondary source. Replace with the CAC primary text or an established translation when available offline.",
  },
  {
    id: "cg-stanford-2025-ai-index",
    title: "AI Index Report 2025",
    url: "https://hai.stanford.edu/ai-index/2025-ai-index-report",
    publisher: "Stanford HAI",
    date: "2025-04",
    retrieved: "2026-10-02",
    kind: "report",
    claim:
      "In 2024, U.S.-based institutions produced 40 notable AI models, China 15 and Europe 3; benchmark differences between leading U.S. and Chinese models shrank to near parity; open-weight models narrowed the gap with closed models on some benchmarks.",
    evidence: "observed",
    verification: "verified",
    notes: "Counts of 'notable models' depend on the Index's selection criteria (Epoch AI data).",
  },
  {
    id: "cg-armstrong-2013-racing",
    title: "Racing to the precipice: a model of artificial intelligence development",
    url: "https://nickbostrom.com/papers/racing-to-the-precipice.pdf",
    authors: ["Stuart Armstrong", "Nick Bostrom", "Carl Shulman"],
    date: "2013-10",
    retrieved: "2026-10-02",
    kind: "paper",
    claim:
      "A simple game-theoretic model in which teams racing to build powerful AI are incentivised to skimp on safety; more teams and more enmity increase the danger, and so, surprisingly, does more information about each other's capabilities.",
    evidence: "thought-experiment",
    verification: "verified",
    notes: "FHI Technical Report 2013-1; later published in AI & Society 31 (2016). A model under stated assumptions, not a prediction.",
  },
];
