import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { partOpener } from "../chapters.ts";
import { credits } from "../credits.ts";

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
      en: "No single protection is enough: we stack imperfect layers, and even then, sometimes something gets through.",
    },
    visual: { layout: "component", component: "DefenseInDepth", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The Swiss cheese model, from aviation and hospital safety: each slice is a protection, each slice has holes
- **Training**: we try to instil values and to avoid harm (the examples, rules and classifiers of chapter 2)
- **Evaluations**: ideally before deployment, or after, by the labs, by governments or by external organisations. To find safety problems, and to understand behaviour: does the model scheme, hide the truth?
- **Interpretability**: all talk long I said "black box", but people are trying to open it. If the same internal pattern always lights up when a model insults or deceives, we can watch it and stop the answer before it reaches the user. Anthropic found millions of such patterns ("features") inside a model, deception and sycophancy included (2024), and "persona vectors" to watch traits such as sycophancy (2025)
- **Monitoring**: other AIs watch what an AI does, a kind of checker ("AI control"); for example, a weaker but trusted model reviews the work of a stronger one (Redwood Research, 2023). It costs a lot, and is used unevenly
- **Sandboxes and permissions**: give the AI the strict minimum. But, as we saw, we are lazy and want productivity: like cookie banners, everyone clicks "accept"
- **Governance**: laws, which need technical means to be enforced, and geopolitics gets in the way: next slide
- Send problems through: most are stopped by one layer or another. Last step: sometimes the holes line up, as in the Hugging Face incident
- We don't look for a perfect layer; we stack several, and that is a choice societies can make`,
    },
    transitionIn: { en: "So what can we do? No single protection is enough." },
    transitionOut: { en: "One of those layers is the law. Where is regulation today?" },
    evidenceLevel: "none",
    sourceIds: [
      "cg-reason-2000-swiss-cheese",
      "cg-iasr-2025-key-update-2",
      "cg-anthropic-2024-scaling-monosemanticity",
      "cg-anthropic-2025-persona-vectors",
      "cg-greenblatt-2023-ai-control",
    ],
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
      en: "We are almost nowhere yet: a few laws, mostly voluntary promises, and countries that put the race first.",
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
      en: `- The main message: **we are not there yet**. Much of what governs frontier AI is voluntary, and for some countries the priority is to win the race (the US "AI Action Plan", July 2025, speaks of "winning the AI race")
- **EU AI Act**: in force since August 2024; bans and rules for big models apply; a July 2026 amendment pushed the high-risk rules to 2027 and 2028
- **Test labs**: the UK AI Security Institute and the US centre at NIST test models before release, by agreement with the companies; so do independent non-profits such as METR (GPT-5: access four weeks before launch, August 2025) and Apollo Research. Ideally before release, but access depends on each company
- **International**: the International AI Safety Report (over 100 experts, led by Yoshua Bengio) and the UN scientific panel (August 2025) assess the science and make no rules
- **Promises**: at Seoul (May 2024), 20 companies pledged safety frameworks, voluntarily; California's SB 53 (September 2025) now requires big labs to publish them; China has had rules for generative AI services since August 2023
- **Compute**: chips are physical and countable, so rules can key on them: US export controls since October 2022, Dutch licences for chipmaking machines (2023, 2024); the EU presumes "high impact capabilities" above 10^25 operations of training, California's SB 53 starts at 10^26. Counting operations on the chip itself is still research, with no working prototype
- **Campaigners**: some push for a pause: the March 2023 open letter asking for a pause of at least 6 months on systems more powerful than GPT-4 (over 31,000 signatures); PauseAI (an international pause treaty), ControlAI and the Future of Life Institute (prohibit superintelligence until shown safe), the Center for AI Safety (extinction risk a global priority). The other way: the "Leading the Future" PACs, over $100 million, against strict rules (2025)
- **Donors**: philanthropy puts more and more into AI safety, still far less than into AI itself. Coefficient Giving (formerly Open Philanthropy) directed over $650 million in grants in 2024, about $64 million of it to AI safety by an independent estimate; all major AI safety funders together about $111 million (2024), against $109 billion of private AI investment in the US alone: about a thousandth
- The last line on screen is my assessment`,
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
      "tk-us-2025-ai-action-plan",
      "cg-fli-2023-pause-letter",
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
      en: "Who should decide how these systems are built and deployed? The answer is not technical; it belongs to all of us.",
    },
    visual: {
      layout: "question",
      question: {
        en: "Who should decide how these systems are built and deployed?",
      },
    },
    interaction: "none",
    speakerNotes: {
      en: `- The last word: read the question slowly, then leave it on screen
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
    transitionOut: { en: "And to close, what this talk owes to others." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static list read from content/glossary/resources.ts." },
    durationSec: 30,
    optional: false,
    localizationNotes: "Titles stay as their publishers write them. Name the petition as a petition by PauseAI, without recommending it.",
  },
  {
    id: "05-credits",
    code: "creds",
    steps: 0,
    chapter: "05",
    number: "5.5",
    title: { en: "Credits" },
    objective: {
      en: "Say who made the talk and name the works it borrowed most from.",
    },
    takeaway: {
      en: "This talk stands on the work of many others.",
    },
    visual: {
      layout: "component",
      component: "CreditsSlide",
      props: {
        // Forks: set your own name in credits.ts and keep the original line (see localizationNotes).
        credits,
        intro: {
          en: "This talk draws on a lot of material: videos, articles, papers and courses. Some explanations and examples were borrowed from these four in particular, among others.",
        },
        items: [
          {
            title: { en: "BlueDot Impact and ML4Good courses" },
            by: { en: "Courses on AI and its risks" },
            links: [{ url: "https://bluedot.org" }, { url: "https://www.ml4good.org" }],
            sourceIds: ["tk-bluedot-impact", "tk-ml4good"],
          },
          {
            title: "AI In Context",
            by: { en: "YouTube channel by 80,000 Hours" },
            links: [{ url: "https://www.youtube.com/@AI_In_Context" }],
            sourceIds: ["tk-ai-in-context"],
          },
          {
            title: "Empire of AI",
            by: { en: "Book by Karen Hao, 2025" },
            links: [{ url: "https://www.penguinrandomhouse.com/books/743569/empire-of-ai-by-karen-hao/", label: "penguinrandomhouse.com" }],
            sourceIds: ["tk-hao-2025-empire-of-ai"],
          },
          {
            title: "The Alignment Problem",
            by: { en: "Book by Brian Christian, 2020" },
            links: [{ url: "https://wwnorton.com/books/the-alignment-problem", label: "wwnorton.com" }],
            sourceIds: ["tk-christian-2020-alignment-problem"],
          },
        ],
      },
    },
    interaction: "none",
    speakerNotes: {
      en: `- Thank you for listening
- Many sources fed this talk: videos, articles, papers, courses
- Four in particular, where some explanations and examples come from: the BlueDot Impact and ML4Good courses, the AI In Context channel, and two books, Empire of AI by Karen Hao and The Alignment Problem by Brian Christian
- Every claim in the talk has its source, listed in the handout (/handout)`,
    },
    transitionIn: { en: "What this talk owes to others." },
    transitionOut: { en: "Thank you." },
    evidenceLevel: "none",
    sourceIds: ["tk-bluedot-impact", "tk-ml4good", "tk-ai-in-context", "tk-hao-2025-empire-of-ai", "tk-christian-2020-alignment-problem"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static slide; the bylines come from credits.ts." },
    durationSec: 20,
    optional: false,
    localizationNotes:
      "Book and channel titles stay as their publishers write them. The bylines come from credits.ts: a fork may present under its own name (set credits.fork), and is asked to keep the line \"Original presentation by Samuel Verboomen\" with its link to ai-exhibit.samverbo.com, shown here and on 00-holding (CC BY 4.0 asks for attribution anyway).",
  },
];
