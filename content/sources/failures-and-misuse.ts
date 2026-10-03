import type { SourceRecord } from "@ai-exhibit/presentation-core";

/**
 * Sources for chapters 4 to 7: how learned systems fail, tools and agents,
 * misuse, and systemic effects. IDs are prefixed `fm-`.
 *
 * Each record supports one precise claim. When one long report supports
 * several scenes, it gets one record per claim so the Presenter View shows
 * exactly what is being cited.
 */

const RETRIEVED = "2026-10-02";

const IASR_2026_URL = "https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026";
const IASR_2026_TITLE = "International AI Safety Report 2026";
const IASR_2026_AUTHORS = ["Yoshua Bengio (chair)", "and over 100 contributing experts"];
const AISI_TRENDS_URL = "https://www.aisi.gov.uk/blog/5-key-findings-from-our-first-frontier-ai-trends-report";
const AISI_TRENDS_TITLE = "Frontier AI Trends Report";
const AISI_TRENDS_PDF = "https://aisi.s3.eu-west-2.amazonaws.com/Frontier+AI+Trends+Report+-+AI+Security+Institute.pdf";

export const failuresAndMisuseSources: SourceRecord[] = [
  // Chapter 4: when learned systems fail
  {
    id: "fm-google-photos-2015-petapixel",
    title: "Google Apologizes After Photos App Autotags Black People as 'Gorillas'",
    url: "https://petapixel.com/2015/07/02/google-apologizes-after-photos-app-autotags-black-people-as-gorillas/",
    publisher: "PetaPixel",
    date: "2015-07-02",
    retrieved: RETRIEVED,
    kind: "news",
    claim:
      "In June 2015, Google Photos' automatic labelling tagged photos of a Black software developer (Jacky Alciné) and his friend as 'gorillas'; he reported it publicly and Google apologised and rolled out a fix within hours.",
    evidence: "observed",
    verification: "verified",
    notes:
      "Article quotes Google engineer Yonatan Zunger. Widely covered at the time (BBC, CNN, Guardian), but those pages blocked automated fetching; PetaPixel and the AI Incident Database record were read instead.",
  },
  {
    id: "fm-google-photos-2018-techreview",
    title: "Google Photos Still Has a Problem with Gorillas",
    url: "https://www.technologyreview.com/2018/01/11/146257/google-photos-still-has-a-problem-with-gorillas/",
    publisher: "MIT Technology Review",
    date: "2018-01-11",
    retrieved: RETRIEVED,
    kind: "news",
    claim:
      "Two years after the 2015 incident, Google's fix was to block the labels 'gorilla', 'chimp' and 'chimpanzee' in Google Photos rather than to correct the classifier (as tested by Wired and confirmed by Google).",
    evidence: "observed",
    verification: "verified",
    notes:
      "Summarises Wired's January 2018 test (Tom Simonite, 'When It Comes to Gorillas, Google Photos Remains Blind'). wired.com blocked automated fetching, so the Wired piece itself was not opened.",
  },
  {
    id: "fm-aiid-incident-16",
    title: "AI Incident Database, Incident 16: Images of Black People Labeled as Gorillas",
    url: "https://incidentdatabase.ai/cite/16/",
    publisher: "Responsible AI Collaborative",
    retrieved: RETRIEVED,
    kind: "dataset",
    claim:
      "Incident record dated 2015-06-29 that compiles press reports of the Google Photos labelling failure and later follow-ups (2018, and a 2023 New York Times report that the primate labels were still blocked).",
    evidence: "observed",
    verification: "verified",
    notes: "The 2023 New York Times article listed in the record was not opened directly; do not quote it on stage.",
  },

  // Chapter 5: tools and agents
  {
    id: "fm-anthropic-building-agents-2024",
    title: "Building effective agents",
    url: "https://www.anthropic.com/engineering/building-effective-agents",
    publisher: "Anthropic",
    authors: ["Erik Schluntz", "Barry Zhang"],
    date: "2024-12-19",
    retrieved: RETRIEVED,
    kind: "documentation",
    claim:
      "Agents are language models that dynamically direct their own processes and tool use, acting in a loop on feedback from the environment (tool results, code execution); because errors can compound, builders are advised to test in sandboxes, add guardrails, human checkpoints and stopping conditions.",
    evidence: "none",
    verification: "verified",
  },
  {
    id: "fm-aisi-trends-2025-agents-finance",
    title: `${AISI_TRENDS_TITLE}, section 6.3 Critical infrastructure`,
    url: AISI_TRENDS_PDF,
    publisher: "UK AI Security Institute",
    date: "2025-12-18",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "Between December 2024 and July 2025, newly published finance-focused tool servers (MCP) increasingly granted AI systems higher levels of autonomy, including executing transfers of cryptocurrency and other assets, not only reading data.",
    evidence: "observed",
    verification: "verified",
    notes: "Figure 23: over 1,000 finance-focused public servers classified into five autonomy levels, from listings in the Smithery registry, Anthropic's list and GitHub.",
  },

  // Chapter 6: misuse
  {
    id: "fm-iasr-2026-malicious-use",
    title: `${IASR_2026_TITLE}, executive summary: malicious use`,
    url: IASR_2026_URL,
    publisher: "International AI Safety Report (UK DSIT secretariat)",
    authors: IASR_2026_AUTHORS,
    date: "2026-02-03",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "AI systems are being misused to generate content for scams, fraud, blackmail and non-consensual intimate imagery; the harms are well documented but systematic data on prevalence and severity remain limited. In experimental settings, AI-generated content can be as effective as human-written content at changing beliefs.",
    evidence: "observed",
    verification: "verified",
    notes: "Read in the executive summary (arXiv:2602.21012 PDF and the report website). The persuasion finding is an experimental result (EVALUATION), not a deployment observation.",
  },
  {
    id: "fm-iasr-2026-cyber",
    title: `${IASR_2026_TITLE}, executive summary: cyberattacks`,
    url: IASR_2026_URL,
    publisher: "International AI Safety Report (UK DSIT secretariat)",
    authors: IASR_2026_AUTHORS,
    date: "2026-02-03",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "AI systems can discover software vulnerabilities and write malicious code; criminal groups and state-associated attackers are actively using general-purpose AI in their operations; whether attackers or defenders will benefit more remains uncertain.",
    evidence: "observed",
    verification: "verified",
    notes: "The report also cites a competition in which an AI agent identified 77% of the vulnerabilities present in real software; we do not show that number on screen.",
  },
  {
    id: "fm-aisi-trends-2025-cyber",
    title: `${AISI_TRENDS_TITLE}, section 3.2 Cyber`,
    url: AISI_TRENDS_URL,
    publisher: "UK AI Security Institute",
    date: "2025-12-18",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "In the institute's own evaluations, the best models went from rarely completing apprentice-level cyber tasks in late 2023 (under 9%) to about 50% on average in 2025, and in 2025 the institute tested the first model to complete expert-level tasks (tasks meant for people with over ten years of experience). The institute describes cyber capabilities as inherently dual-use.",
    evidence: "evaluation",
    verification: "verified",
    notes:
      "Blog and PDF read. Caveat stated by the authors: the report is not a forecast, and the evaluations do not capture all factors that determine real-world impact. Based on more than 30 frontier systems tested since 2023.",
  },
  {
    id: "fm-big-sleep-2024",
    title: "From Naptime to Big Sleep: Using Large Language Models To Catch Vulnerabilities In Real-World Code",
    url: "https://projectzero.google/2024/10/from-naptime-to-big-sleep.html",
    publisher: "Google Project Zero and Google DeepMind",
    date: "2024-11-01",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "An AI agent found a previously unknown exploitable memory-safety bug in SQLite, a widely used open-source database; it was reported and fixed the same day, before reaching an official release, so no users were affected.",
    evidence: "observed",
    verification: "verified",
    notes: "The authors call the results 'highly experimental' and say a target-specific fuzzer would likely be at least as effective at present. Used as a defender-side example only.",
  },
  {
    id: "fm-iasr-2026-bio",
    title: `${IASR_2026_TITLE}, executive summary: biological and chemical risks`,
    url: IASR_2026_URL,
    publisher: "International AI Safety Report (UK DSIT secretariat)",
    authors: IASR_2026_AUTHORS,
    date: "2026-02-03",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "In 2025, multiple developers released new models with additional safeguards after they could not exclude that the models could help novices develop biological or chemical weapons; it remains difficult to assess how much material barriers still constrain such actors.",
    evidence: "contested",
    verification: "verified",
    notes: "Stay at this level of generality on stage. Do not name pathogens, tasks or protocols.",
  },
  {
    id: "fm-aisi-trends-2025-chem-bio",
    title: `${AISI_TRENDS_TITLE}, chemistry and biology findings`,
    url: AISI_TRENDS_URL,
    publisher: "UK AI Security Institute",
    date: "2025-12-18",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "On the institute's question-answering evaluations, frontier models have surpassed PhD-level expert baselines in biology, with chemistry catching up; the institute adds that knowledge alone is far from sufficient to match the lab support of PhD researchers.",
    evidence: "evaluation",
    verification: "verified",
  },
  {
    id: "fm-anthropic-asl3-2025",
    title: "Activating AI Safety Level 3 Protections",
    url: "https://www.anthropic.com/news/activating-asl3-protections",
    publisher: "Anthropic",
    date: "2025-05-22",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "Anthropic launched Claude Opus 4 under stricter deployment and security measures as a precaution, stating it had not yet determined whether the model had definitively crossed the capability threshold requiring them. Measures included classifiers screening for weapons-related content, jailbreak detection, and over 100 security controls on model weights (two-party access, egress bandwidth limits).",
    evidence: "observed",
    verification: "verified",
    notes: "A company's own description of its policy decision. Present it as a documented decision, not as independent evidence of capability.",
  },

  // Chapter 7: systemic effects
  {
    id: "fm-iasr-2026-market-dynamics",
    title: `${IASR_2026_TITLE}, chapter 3: challenges for risk management`,
    url: IASR_2026_URL,
    publisher: "International AI Safety Report (UK DSIT secretariat)",
    authors: IASR_2026_AUTHORS,
    date: "2026-02-03",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "Due to competitive pressures, AI companies may face trade-offs between faster product releases and investment in risk reduction; many AI-related harms are externalised and liability remains unclear. The report defines systemic risks as risks from widespread deployment across society and the economy.",
    evidence: "projection",
    verification: "verified",
  },
  {
    id: "fm-cma-foundation-models-2023",
    title: "AI Foundation Models: Initial Report",
    url: "https://www.gov.uk/government/publications/ai-foundation-models-initial-report",
    publisher: "UK Competition and Markets Authority",
    date: "2023-09-18",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "The competition regulator describes the foundation-model value chain (development, deployment in applications, consumer use) and warns of harm if a handful of firms gain or entrench positions of market power; the full report discusses access to compute and data, economies of scale and vertical integration.",
    evidence: "projection",
    verification: "verified",
    notes: "Summary PDF read in full; full report searched for compute, economies of scale and vertical integration. It is a 2023 snapshot: re-check the CMA's later updates before each talk.",
  },
  {
    id: "fm-brynjolfsson-2025",
    title: "Generative AI at Work",
    url: "https://www.nber.org/papers/w31161",
    publisher: "Quarterly Journal of Economics 140(2), 2025 (NBER Working Paper 31161)",
    authors: ["Erik Brynjolfsson", "Danielle Li", "Lindsey R. Raymond"],
    date: "2025-05",
    retrieved: RETRIEVED,
    kind: "paper",
    claim:
      "In one company's customer support (5,179 agents), access to an AI assistant raised issues resolved per hour by 14% on average, by 34% for novice and low-skilled workers, with minimal impact on the most experienced and skilled.",
    evidence: "observed",
    verification: "verified",
    notes: "NBER abstract read. One firm, one task, one tool: say so on stage.",
  },
  {
    id: "fm-iasr-2026-labour",
    title: `${IASR_2026_TITLE}, executive summary and section 2.3: labour market impacts`,
    url: IASR_2026_URL,
    publisher: "International AI Safety Report (UK DSIT secretariat)",
    authors: IASR_2026_AUTHORS,
    date: "2026-02-03",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "Economists disagree on the magnitude of future labour impacts (job creation offsetting losses, or significant reductions in employment and wages). Early evidence shows no effect on overall employment, with some signs of declining demand for early-career workers in some AI-exposed occupations such as writing.",
    evidence: "contested",
    verification: "verified",
  },
  {
    id: "fm-iasr-2026-autonomy",
    title: `${IASR_2026_TITLE}, executive summary: risks to human autonomy`,
    url: IASR_2026_URL,
    publisher: "International AI Safety Report (UK DSIT secretariat)",
    authors: IASR_2026_AUTHORS,
    date: "2026-02-03",
    retrieved: RETRIEVED,
    kind: "report",
    claim:
      "Early evidence suggests that reliance on AI tools can weaken critical thinking skills and encourage automation bias (trusting AI outputs without sufficient scrutiny).",
    evidence: "evaluation",
    verification: "verified",
  },
];
