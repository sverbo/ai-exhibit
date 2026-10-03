import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { partOpener } from "../chapters.ts";

/** Chapter 05: what we can do, and the closing question. */
export const chapter05: SceneDefinition[] = [
  partOpener("05", "pact"),
  {
    id: "05-defense-in-depth",
    code: "swiss",
    steps: 7,
    chapter: "05",
    number: "5.1",
    title: { en: "Defense in depth" },
    objective: {
      en: "Present safety as a stack of imperfect layers rather than one solution.",
    },
    takeaway: {
      en: "No single layer is enough; protection comes from stacking imperfect ones.",
    },
    visual: { layout: "component", component: "DefenseInDepth", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The Swiss cheese model from aviation and hospital safety: each slice is a protection, each slice has holes
- **Do:** bring in the layers: training (the rules and classifiers we saw), evaluations, interpretability, monitoring, sandboxes and permissions, laws and governance
- **Do:** send problems through: most are stopped by one layer or another
- Last step: sometimes the holes line up, as in the Hugging Face incident
- We don't look for a perfect layer; we stack several, and that is a choice societies can make`,
    },
    transitionIn: { en: "So what can we do? No single protection is enough." },
    transitionOut: { en: "One of those layers is the law. Where is regulation today?" },
    evidenceLevel: "none",
    sourceIds: ["cg-reason-2000-swiss-cheese", "cg-iasr-2025-key-update-2"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "05-governance",
    code: "laws",
    steps: 7,
    chapter: "05",
    number: "5.2",
    title: { en: "Where is regulation today?" },
    objective: {
      en: "Show where regulation stands today (a law, test labs, international science, company promises, rules keyed on compute), who outside governments pushes and pays for more safety, and how little it is next to the pace of the technology.",
    },
    takeaway: {
      en: "Some rules exist, but most of what governs frontier AI today is voluntary.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "Where is regulation today?" },
        cards: [
          {
            picture: "law",
            title: { en: "European Union" },
            line: {
              en: "A first broad AI law. Some parts apply, others were pushed back.",
            },
            evidence: "observed",
            sourceIds: ["cg-ec-ai-act", "sc-ec-2026-omnibus-in-force"],
          },
          {
            picture: "test-lab",
            flags: ["gb", "us"],
            title: { en: "Test labs" },
            line: {
              en: "Government institutes and non-profits test top models, ideally before release, when companies give access.",
            },
            evidence: "observed",
            sourceIds: ["tk-uk-aisi-about", "tk-nist-caissi", "tk-metr-about", "tk-metr-2025-gpt5-predeployment", "tk-apollo-home"],
          },
          {
            picture: "summit",
            title: { en: "International" },
            line: {
              en: "Summits, a shared science report, a UN scientific panel. Advice, not rules.",
            },
            evidence: "observed",
            sourceIds: ["tk-iasr-about", "tk-un-panel-about"],
          },
          {
            picture: "promise",
            title: { en: "Promises" },
            line: {
              en: "Companies publish their own safety plans, mostly on a voluntary basis.",
            },
            evidence: "observed",
            sourceIds: ["tk-seoul-2024-frontier-commitments", "tk-california-2025-sb53"],
          },
          {
            picture: "chips",
            title: { en: "Govern the compute" },
            line: {
              en: "Chips can be counted; research aims to count their operations too.",
            },
            evidence: "observed",
            sourceIds: [
              "tk-bis-2022-export-controls",
              "tk-nl-2024-export-expansion",
              "tk-eu-ai-act-art51",
              "tk-fpf-2025-sb53-thresholds",
              "tk-chip-security-act-2025",
              "tk-ansari-2026-hardware-governance",
              "tk-petrie-2025-flexheg",
            ],
          },
        ],
        orgs: {
          label: { en: "Outside governments: campaigners and donors" },
          names: [
            "PauseAI",
            "ControlAI",
            "Future of Life Institute",
            "Center for AI Safety",
            "Coefficient Giving",
            "Survival and Flourishing Fund",
          ],
        },
        takeaway: {
          line: {
            en: "Some rules, a few test labs, many promises. Far less than the pace of the technology.",
          },
          attribution: { en: "My assessment" },
        },
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- **Do:** EU AI Act: in force since August 2024; bans and rules for big models apply; a July 2026 amendment pushed the high-risk rules to 2027 and 2028
- **Do:** test labs and science: the UK AI Security Institute and the US centre at NIST test models before release, by agreement with the companies; so do independent non-profits such as METR (GPT-5: access four weeks before launch, August 2025) and Apollo Research; ideally before release, but access depends on each company; the International AI Safety Report (over 100 experts, led by Yoshua Bengio) and the UN scientific panel (August 2025) assess the science and make no rules
- **Do:** promises: at Seoul (May 2024), 20 companies pledged safety frameworks, voluntarily; California's SB 53 (September 2025) now requires big labs to publish them; China has had rules for generative AI services since August 2023
- **Do:** compute: chips are physical and countable, so rules can key on them: US export controls since October 2022, Dutch licences for chipmaking machines (2023, 2024); the EU presumes "high impact capabilities" above 10^25 operations of training (AI Act, art. 51), California's SB 53 starts at 10^26
- Research and proposals, not yet real: H100 chips already count operations and power for performance tools, and a RAND analysis (2024) says these counters could be adapted; a 2025 proposal puts a tamper-proof "guarantee processor" next to each chip to enforce compute limits; a US bill (May 2025) would add location verification; reviews rate on-chip mechanisms low readiness, with no working prototype
- **Do:** campaigners: PauseAI (an international pause treaty), ControlAI and the Future of Life Institute (prohibit superintelligence until shown safe), the Center for AI Safety (extinction risk a global priority); the other way: the "Leading the Future" PACs, over $100 million, against strict rules (2025)
- Donors: Coefficient Giving (formerly Open Philanthropy) directed over $650 million in grants in 2024, of which about $64 million went to AI safety by an independent estimate: roughly a tenth (rough, our arithmetic on an estimate); all major AI safety funders together about $111 million (2024), against $109 billion of private AI investment in the US alone: about a thousandth. The last line is my assessment`,
    },
    transitionIn: { en: "Laws and governance are one of those layers. Where is regulation today?" },
    transitionOut: { en: "Which leaves the real question." },
    evidenceLevel: "observed",
    sourceIds: [
      "cg-ec-ai-act",
      "sc-ec-2026-omnibus-in-force",
      "tk-uk-aisi-about",
      "tk-nist-caissi",
      "tk-metr-about",
      "tk-metr-2025-gpt5-predeployment",
      "tk-apollo-home",
      "tk-iasr-about",
      "tk-un-panel-about",
      "tk-seoul-2024-frontier-commitments",
      "tk-california-2025-sb53",
      "tk-bis-2022-export-controls",
      "tk-nl-2024-export-expansion",
      "tk-chip-security-act-2025",
      "tk-eu-ai-act-art51",
      "tk-fpf-2025-sb53-thresholds",
      "tk-ansari-2026-hardware-governance",
      "tk-petrie-2025-flexheg",
      "tk-ogara-2025-hardware-mechanisms",
      "cg-china-2023-genai-measures",
      "tk-pauseai-proposal",
      "tk-controlai-home",
      "tk-fli-superintelligence-statement",
      "tk-cais-statement-ai-risk",
      "tk-techcrunch-2025-leading-the-future",
      "tk-mcaleese-2025-ai-safety-funding",
      "tk-coefficient-giving-wiki",
      "tk-stanford-2025-ai-index",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 120,
    optional: false,
    localizationNotes: "Name the organisations neutrally, as examples of campaigners and donors outside governments, never as endorsements; mention the groups pushing the other way. Funding totals are estimates: say so. Say every date out loud from the notes.",
  },
  {
    id: "05-closing-question",
    code: "close",
    chapter: "05",
    number: "5.3",
    title: { en: "Closing question" },
    objective: {
      en: "Open the discussion on who should decide how these systems are built and deployed, without prescribing an answer.",
    },
    takeaway: {
      en: "The answer is not technical; it belongs to all of us.",
    },
    visual: {
      layout: "question",
      question: {
        en: "Who should decide how these systems are built and deployed?",
      },
    },
    interaction: "none",
    speakerNotes: {
      en: `- Read the question slowly, then leave it on screen
- Companies? Governments? International bodies? Experts? Citizens?
- Each answer has strengths and weaknesses; I won't pick one
- My job today: give you something to think with
- Thank you; over to your questions`,
    },
    transitionIn: { en: "From the story told to the question left open." },
    transitionOut: { en: "Before your questions, where to go further." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static question." },
    durationSec: 90,
    optional: false,
    localizationNotes: "List the candidate deciders neutrally and in a locally meaningful order; never add a recommended answer.",
  },
  {
    id: "05-resources",
    code: "more",
    steps: 0,
    chapter: "05",
    number: "5.4",
    title: { en: "Resources" },
    objective: {
      en: "Leave the room with a few places to keep learning, the same list as on the audience glossary page.",
    },
    takeaway: {
      en: "The talk ends here; the learning does not have to.",
    },
    visual: { layout: "component", component: "ResourceList", props: {} },
    interaction: "none",
    speakerNotes: {
      en: `- Leave this up during questions
- Pointers, not endorsements: a video channel, a free course, and a petition by PauseAI for those who want to act
- The QR code opens the glossary on their phones, with the same links under Resources`,
    },
    transitionIn: { en: "For those who want to go further." },
    transitionOut: { en: "Thank you." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static list read from content/glossary/resources.ts." },
    durationSec: 30,
    optional: false,
    localizationNotes: "Titles stay as their publishers write them. Name the petition as a petition by PauseAI, without recommending it.",
  },
];
