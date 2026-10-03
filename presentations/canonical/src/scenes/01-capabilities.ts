import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { agendaItems, partOpener } from "../chapters.ts";

/**
 * Introduction (agenda and framing, 0.1 and 0.2, chapter "00"), then chapter 01:
 * what AI can do today, opened by its part slide (1.0).
 * Answers first, then agents acting on our behalf, then what it took to build them.
 */
export const chapter01: SceneDefinition[] = [
  {
    id: "00-agenda",
    code: "agnd",
    chapter: "00",
    number: "0.1",
    title: { en: "Today" },
    objective: {
      en: "Welcome the room and show the five parts of the talk.",
    },
    takeaway: {
      en: "Five parts: what AI can do, its history and how it works, who builds it, the risks, what we can do.",
    },
    visual: {
      layout: "component",
      component: "Agenda",
      props: {
        heading: { en: "Today" },
        items: agendaItems,
      },
    },
    // One part per click, as with the list it replaced (0 shows them all at once).
    steps: 5,
    interaction: "presenter",
    speakerNotes: {
      en: `- Welcome, who I am, why this talk
- **Do:** five parts, one per click
- First what it does, then how, then who builds it
- Then the risks, and what we can do about them
- Questions at the end`,
    },
    transitionIn: { en: "The talk opens on its plan." },
    transitionOut: { en: "And two things this talk is not." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static list." },
    durationSec: 45,
    optional: false,
    localizationNotes: "Items come from the chapter titles in chapters.ts.",
  },
  {
    id: "00-not-this",
    code: "isnt",
    chapter: "00",
    number: "0.2",
    title: { en: "What this talk is not" },
    objective: {
      en: "Set expectations: no tool tutorial, no environmental assessment, and why today's focus is capabilities and risks.",
    },
    takeaway: {
      en: "Today is about what AI can do and what is at stake, not how to use a tool.",
    },
    visual: {
      layout: "cards",
      heading: { en: "What this talk is not" },
      cards: [
        {
          title: { en: "Not a tutorial on AI tools" },
          body: {
            en: "Tools change every month. Know what is possible; then ask your assistant for the rest.",
          },
        },
        {
          title: { en: "Not about the environment" },
          body: {
            en: "Of course it is a serious problem, and a talk of its own. But for many, the risks we discuss today are of another order of magnitude.",
          },
          evidence: "contested",
          sourceIds: ["tk-cais-statement-ai-risk", "sc-iea-2025-energy-ai"],
        },
        {
          title: { en: "Today's focus" },
          body: {
            en: "\"Mitigating the risk of extinction from AI should be a global priority.\" (AI researchers and lab leaders, 2023)",
          },
          evidence: "contested",
          sourceIds: ["tk-cais-statement-ai-risk", "tk-cais-2023-press-release"],
        },
      ],
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Not a tutorial: tool setup goes out of date fast, and tools keep adding layers on top
- What lasts: knowing what is possible; then ask your assistant how
- Not about the environment: a serious problem, and another talk; for many, today's risks are of another order of magnitude
- To calibrate, if asked: one query about 0.3 Wh, one hour of streaming about 77 Wh, so roughly 250 queries (long or reasoning queries cost far more)
- Data centres: about 1.5% of world electricity in 2024 (IEA)
- 2023: Hinton, Bengio and AI lab leaders signed: extinction risk from AI, a priority alongside pandemics and nuclear war
- My own view, not a consensus: for many experts, AI risk is an order of magnitude more pressing than the environment`,
    },
    transitionIn: { en: "From the plan to what is not in it." },
    transitionOut: { en: "So, what can AI do today?" },
    evidenceLevel: "contested",
    sourceIds: [
      "tk-epoch-2025-chatgpt-energy",
      "tk-iea-2020-streaming",
      "sc-iea-2025-energy-ai",
      "tk-cais-statement-ai-risk",
      "tk-cais-2023-press-release",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static cards." },
    durationSec: 90,
    optional: true,
    localizationNotes: "The French quote translates the CAIS statement; the original is in English. Say clearly that the order-of-magnitude comparison is the presenter's opinion.",
  },
  // The part opener also frames the chapter (it replaced a separate "Opening" title slide).
  partOpener("01", "pcap", {
    notes: `- Everyone has an opinion on AI, often formed a few years ago
- **Ask:** who has used a chatbot this week?
- Let's test your picture with a few trick questions`,
    transitionOut: "Let's start with a few trick questions.",
  }),
  {
    id: "01-then-and-now",
    code: "then",
    steps: 5,
    chapter: "01",
    number: "1.1",
    title: { en: "Then and now" },
    objective: {
      en: "Show that trick questions which fooled early language models are now answered correctly.",
    },
    takeaway: {
      en: "The tricks that used to fool AI mostly no longer work.",
    },
    visual: { layout: "component", component: "ThenAndNow", props: { variant: "game" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- A famous riddle: "When ten plus four is two, what is nine plus six?"
- **Ask:** the room answers first (answer: 3, on a clock)
- **Do:** click through the published answers: GPT-2 (2019), GPT-3 (2020), GPT-3.5 (2022): all wrong
- **Do:** GPT-4 (2023) gets it; note the training cost climbing, from about $4.6k to about $50m
- **Do:** last click, today's reasoning model, recorded answer with name and date
- Other questions (letters in a word, 9.11 vs 9.9, Sally's sisters): same pattern`,
    },
    transitionIn: {
      en: "From the question to a quick test.",
    },
    transitionOut: { en: "Not just this riddle: everything is going up." },
    evidenceLevel: "observed",
    sourceIds: ["tk-aidigest-2023-progress", "tk-hagendorff-2022-crt", "tk-berglund-2023-reversal-curse", "llm-gpt2-paper"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "recording", asset: "then-and-now/gpt2-answers.json" },
    durationSec: 240,
    optional: false,
    localizationNotes:
      "GPT-2 is always asked in English (it learned from English web text); the French edition shows the question in French and GPT-2's English answer as quoted output.",
    todo: [
      "Do not say a specific named model failed a given question unless content/assets/then-and-now/questions.ts marks that history note as verified.",
    ],
  },
  {
    id: "01-model-comparison",
    code: "side",
    steps: 4,
    chapter: "01",
    number: "1.2",
    title: { en: "Then and now, side by side" },
    objective: {
      en: "Compare a 2019 model, a 2020 model and a current frontier model on cost, electricity, reliability, skill and memory.",
    },
    takeaway: {
      en: "In six years, everything grew by orders of magnitude: the cost, the power, and what the models can do.",
    },
    visual: { layout: "component", component: "ModelComparison", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- One row per click: GPT-2 (2019), GPT-3 (2020), then Grok 3 (2025), the recent frontier model with the most published estimates
- Cost to train: from a few thousand dollars to about $200 million (estimates)
- Electricity: GPT-3 about 1.3 GWh; Grok 3 about 240 GWh, the yearly use of tens of thousands of homes (estimates)
- Reliability: the length of task an agent finishes half the time, from seconds to hours on today's models; skill: PhD-level science questions now above the experts' score
- Memory: from about a page and a half to about 1,500 pages
- How we know, GPT-2 electricity (1.7 MWh, labelled "calculated"): nobody published it, so we computed it: 168 hours × 32 TPU v3 chips (Strubell et al., second-hand from the authors) × 283 W per chip × 1.10 for the datacenter (Patterson et al.) ≈ 1.7 MWh, about two months of one US home. An order of magnitude only: the real figure may be a few times higher
- How we know, GPT-2 science (25%): not a GPT-2 score. GPT-2 was never tested on GPQA; with four answer choices, guessing scores 25%
- How we know, GPT-3 science (30%): measured by the test's authors on GPT-3.5, the 2023 successor (Rein et al.: 29.6%), barely above guessing; the original GPT-3 was never tested
- How we know, Grok 3 reliability (1 hour): METR never measured Grok 3; the best model METR measured from the same months is Claude 3.7 Sonnet (February 2025), about 60 minutes
- **Do:** last click, "grew by": tens of thousands of times more expensive. Training concentrates enormous power in one place; across all use, running the models now uses even more
- **Do:** last row, a projection for about a year from now, from published trends: over $1 billion to train, about 1,000 GWh, tasks of about two weeks of human work; trends, not promises`,
    },
    transitionIn: { en: "Not just one riddle: everything grew." },
    transitionOut: { en: "So what is all this for? Not just answering: acting." },
    evidenceLevel: "evaluation",
    sourceIds: [
      "tk-epoch-notable-models",
      "tk-epoch-2024-power-trend",
      "tk-epoch-2024-training-cost-trend",
      "tk-xai-2025-grok3",
      "llm-patterson-2021",
      "llm-patterson-2022",
      "tk-metr-2026-time-horizon-1-1",
      "tk-rein-2023-gpqa",
      "tk-rein-2023-gpqa-baselines",
      "tk-strubell-2019-gpt2-hardware",
      "tk-patterson-2021-tpu-v3-power",
      "tk-metr-early-2025-best",
      "tk-gpt2-context-1024",
      "tk-gpt3-context-2048",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 150,
    optional: false,
  },
  {
    id: "01-connected",
    code: "conn",
    steps: 7,
    chapter: "01",
    number: "1.3",
    title: { en: "Connected to your life" },
    objective: {
      en: "Show that today's assistants can be connected to email, calendar, files, the browser, payments and code.",
    },
    takeaway: {
      en: "An assistant is no longer a chat window: it plugs into the tools of your daily life.",
    },
    visual: { layout: "component", component: "ConnectedAssistant", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The assistant sits in the middle; connectors appear one by one
- Email and calendar: read, draft, schedule
- Files: search and summarize your documents
- Browser: it clicks and fills forms on websites
- Shopping and payments: protocols now exist for agents to pay
- Code: it writes and runs programs`,
    },
    transitionIn: { en: "From answering to acting." },
    transitionOut: {
      en: "Connected, yes. But allowed to do what?",
    },
    evidenceLevel: "observed",
    sourceIds: [
      "fnd-chatgpt-agent-system-card",
      "fnd-claude-for-chrome",
      "fnd-claude-computer-use-docs",
      "fnd-claude-code-docs",
      "fnd-google-ap2",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "01-permissions",
    code: "perm",
    steps: 5,
    chapter: "01",
    number: "1.4",
    title: { en: "Permissions" },
    objective: {
      en: "Show that what an assistant can do depends on what we allow it to touch, up to spending money.",
    },
    takeaway: {
      en: "The same model has very different power depending on what we let it touch.",
    },
    visual: { layout: "component", component: "PermissionsBoard", props: { mode: "permissions" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Same model; only its permissions change
- **Do:** flip the switches: read files, write files, terminal, browser, money
- Each switch turns advice into action
- Money is real: published tools already let agents make transfers
- **Ask:** which switch would make you hesitate on your own computer?`,
    },
    transitionIn: {
      en: "The connections exist; what matters is what we switch on.",
    },
    transitionOut: {
      en: "Here is what it looks like when I switch them on myself.",
    },
    evidenceLevel: "observed",
    sourceIds: ["fm-aisi-trends-2025-agents-finance"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "01-personal-demo",
    code: "demo",
    steps: 1,
    chapter: "01",
    number: "1.5",
    title: { en: "My own demo" },
    objective: {
      en: "Show a real task the presenter gave an AI assistant, recorded on screen.",
    },
    takeaway: {
      en: "This is not a lab demo: it is an ordinary person's ordinary use.",
    },
    visual: { layout: "component", component: "VideoScene", props: { src: "personal-demo.mp4" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- What I asked, in one sentence
- Which product and model, and when I recorded it
- **Do:** play; pause where it acts on its own
- Point at the moment it asks before acting
- What it got wrong, if anything`,
    },
    transitionIn: {
      en: "From the switches to a real run.",
    },
    transitionOut: {
      en: "Let's slow one request down and look at every step.",
    },
    evidenceLevel: "observed",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
    todo: [
      "Record the demo and put it at content/assets/media/personal-demo.mp4; note the product, model and recording date in the notes.",
      "Set durationSec to the video length plus about 30 seconds once recorded.",
    ],
  },
  {
    id: "01-tool-call",
    code: "tool",
    steps: 5,
    chapter: "01",
    number: "1.6",
    title: { en: "Chat or agent: calling a tool" },
    objective: {
      en: "Show, with real JSON, that a model only writes text and the software around it runs the tools.",
    },
    takeaway: {
      en: "The model writes a request in a precise format; the software does the action and reports back.",
    },
    visual: { layout: "component", component: "ToolCallDemo", props: { scenario: "search" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Same question on both sides: who won last night's match? (illustrative)
- **Do:** step 1, the chatbot alone: it cannot know, its knowledge stops at training
- **Do:** step 2, the agent side: the software tells the model it has a web_search tool
- **Do:** step 3, the model does not answer: it writes a tool call, in JSON
- Key point: the model only writes text; the software reads it and runs the search
- **Do:** steps 4 and 5, the results come back, then an answer that cites them
- Everything an agent does is this, repeated`,
    },
    transitionIn: {
      en: "Before a complex request, one single tool call.",
    },
    transitionOut: {
      en: "Now chain dozens of these.",
    },
    evidenceLevel: "none",
    sourceIds: ["fnd-claude-tool-use-docs"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 150,
    optional: false,
    localizationNotes: "JSON keys stay in English in every edition: they are the real format.",
  },
  {
    id: "01-one-request",
    code: "steps",
    steps: 15,
    chapter: "01",
    number: "1.7",
    title: { en: "One request, every step" },
    objective: {
      en: "Make every step of one complex request visible: tool calls, sub-agents in parallel, merged results, a human approval before paying.",
    },
    takeaway: {
      en: "Behind one sentence, an agent runs many small steps, and can stop to ask you.",
    },
    visual: { layout: "component", component: "AgentRunExplainer", props: { scenario: "weekend-trip" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Illustrative, not a recording: say so
- One sentence: plan a weekend trip
- An orchestrator splits the job into tasks
- Tool calls: weather, calendar, maps, search, email
- Sub-agents work in parallel, results are merged
- **Do:** stop at the approval gate: nothing is paid without a yes`,
    },
    transitionIn: {
      en: "From a real run to a slowed-down one.",
    },
    transitionOut: {
      en: "All these steps follow one simple pattern.",
    },
    evidenceLevel: "thought-experiment",
    sourceIds: ["fm-anthropic-building-agents-2024", "fnd-chatgpt-agent-system-card"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 195,
    optional: false,
  },
  {
    id: "01-agent-loop",
    code: "loop",
    steps: 5,
    chapter: "01",
    number: "1.8",
    title: { en: "The agent loop" },
    objective: {
      en: "Name the pattern: an agent is a model in a loop of goal, plan, act, observe, re-plan.",
    },
    takeaway: {
      en: "An agent is a model placed in a loop, with tools and memory.",
    },
    visual: { layout: "component", component: "AgentLoop", props: { variant: "intro" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Goal, plan, act, observe, plan again
- In the middle: a language model, like a chatbot
- Around it: ordinary software, tools and a memory
- It goes round until the goal is met or it asks you`,
    },
    transitionIn: {
      en: "From one example to the general pattern.",
    },
    transitionOut: { en: "So what is inside? Let us open the box." },
    evidenceLevel: "none",
    sourceIds: ["fnd-claude-tool-use-docs", "fm-anthropic-building-agents-2024"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: false,
    localizationNotes: "Loop labels come from the AgentLoop component strings; say them with the same words.",
  },
];
