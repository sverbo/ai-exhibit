import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { agendaItems, partOpener, talkTitle } from "../chapters.ts";

/**
 * Introduction (chapter "00": holding slide 0.1, opening video 0.2, agenda 0.3,
 * framing 0.4), then chapter 01:
 * what AI can do today, opened by its part slide (1.0).
 * Answers first, then agents acting on our behalf, then what it took to build them.
 */
export const chapter01: SceneDefinition[] = [
  {
    id: "00-holding",
    code: "wait",
    chapter: "00",
    number: "0.1",
    title: { en: "Before the talk" },
    objective: {
      en: "Hold the screen while the room fills up: the talk's title, a calm line, the glossary QR code and a quiet readiness dot.",
    },
    takeaway: {
      en: "The talk starts in a moment.",
    },
    visual: {
      layout: "component",
      component: "HoldingSlide",
      props: { title: talkTitle },
    },
    steps: 0,
    interaction: "presenter",
    speakerNotes: {
      en: `- Check the Ready dot: language demos (Hugging Face status, or Simulation) and the YouTube player script; your screen says which one is still waiting
- Nothing moves by itself: press Next when you begin
- Start the timer with T when you begin`,
    },
    transitionIn: { en: "The room fills up." },
    transitionOut: { en: "Let's begin with a short video." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static slide; offline it simply stays on \"Getting ready\"." },
    // The waiting time before the talk is not talk time: only the moment of moving on counts.
    durationSec: 10,
    optional: false,
    online: {
      hosts: ["www.youtube.com"],
      why: "Checks that the YouTube player script loads, for the opening video.",
    },
    localizationNotes: "The title is the presentation title (talkTitle in chapters.ts).",
  },
  {
    id: "00-welcome-video",
    code: "stake",
    chapter: "00",
    number: "0.2",
    title: { en: "This is not science fiction" },
    objective: {
      en: "Open the talk with a one-minute video from AI In Context that sets the stakes before the presenter speaks.",
    },
    takeaway: {
      en: "AI may soon change everything; this talk is about understanding how, and what we can do.",
    },
    visual: {
      layout: "component",
      component: "YouTubeScene",
      props: {
        videoId: "uX-Cq-rvlv8",
        durationSec: 57,
        kicker: { en: "Before we start" },
        heading: { en: "This is not science fiction" },
        caption: { en: "\"Welcome to AI In Context\", AI In Context on YouTube, 57 s" },
      },
    },
    steps: 0,
    interaction: "presenter",
    speakerNotes: {
      en: `- **Do:** press Play on the presenter screen; sound comes from the projector only
- "Welcome to AI In Context" (YouTube channel AI In Context, by 80,000 Hours), 57 seconds
- Subtitles ask for the talk's language, but this video has English captions only: a French talk shows English subtitles (checked 2026-10-04). The voice was the English original in tests; YouTube may still pick an automatic dub, no embed setting prevents it: check on the projector before the talk
- Offline, the slide shows the address instead: say it in one sentence and move on`,
    },
    transitionIn: { en: "From the waiting room to a short video." },
    transitionOut: { en: "That is the question. Here is the plan." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Offline, the slide shows the video's address instead of the player." },
    durationSec: 57,
    optional: true,
    online: {
      hosts: ["www.youtube.com", "www.youtube-nocookie.com", "youtube.com", "ytimg.com", "googlevideo.com", "ggpht.com", "google.com", "doubleclick.net", "googleapis.com", "gstatic.com"],
      why: "Embeds the YouTube video; offline it shows the address instead.",
    },
    localizationNotes:
      "The video is in English with English captions only (2026-10-04). Captions ask for the talk's language (cc_lang_pref, hl), which YouTube honours only when it has that track; no embed parameter selects the audio track.",
  },
  {
    id: "00-agenda",
    code: "agnd",
    chapter: "00",
    number: "0.3",
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
    transitionIn: { en: "After the video, the plan." },
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
    number: "0.4",
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
    steps: 6,
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
- **Do:** click 1, GPT-2 (2019): wrong
- **Do:** click 2, GPT-3 (2020): wrong
- **Do:** click 3, GPT-3.5 (2022): still wrong
- **Do:** click 4, GPT-4 (2023) gets it; note the training cost climbing, from about $4.6k to about $50m
- **Do:** click 5, today's reasoning model, recorded answer with name and date
- **Do:** click 6, live: type any question in the big field (here or on the projector), then Ask. Three open models answer side by side as their words arrive: Qwen2.5 0.5B, a base model never trained to chat; Llama 3.1 8B Instruct; gpt-oss-120b, which thinks first. Chat models are told "Answer briefly."
- Caveat: GPT-3 and GPT-4 are closed OpenAI models and cannot be called live, and no Hugging Face provider serves GPT-2, so the live ladder uses open models of increasing size, each named on screen with its size. In Simulation the field stays disabled
- Other questions (letters in a word, 9.11 vs 9.9, Sally's sisters): same pattern`,
    },
    transitionIn: {
      en: "From the question to a quick test.",
    },
    transitionOut: { en: "The riddle is a toy. What about the real world?" },
    evidenceLevel: "observed",
    sourceIds: ["tk-aidigest-2023-progress", "tk-hagendorff-2022-crt", "tk-berglund-2023-reversal-curse", "llm-gpt2-paper"],
    // C: the last step asks open models live (/api/llm/ladder); the recorded steps need nothing.
    runtimeClass: "C",
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
    id: "01-already-here",
    code: "here",
    steps: 5,
    chapter: "01",
    number: "1.2",
    title: { en: "Already here" },
    objective: {
      en: "Right after the riddle, show that today's AI is already at work outside the lab: code, driving, robots, mathematics, and this very talk.",
    },
    takeaway: {
      en: "This is not a lab demo: AI already writes most new code at Google and drives paying passengers.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: {
          en: "Even if AI stopped improving today, it could already do most expert work.",
        },
        cards: [
          {
            picture: "code",
            title: { en: "Code" },
            line: {
              en: "Most new code at Google is written by AI, then checked by engineers.",
            },
            evidence: "observed",
            sourceIds: ["tk-google-2026-next-code"],
          },
          {
            picture: "car",
            title: { en: "Driving" },
            line: {
              en: "Taxis with nobody at the wheel carry paying riders every week.",
            },
            evidence: "observed",
            sourceIds: ["tk-waymo-2026-weekly-rides"],
          },
          {
            picture: "runner",
            title: { en: "Robots" },
            line: {
              en: "Humanoid robots ran a half-marathon in Beijing. Next: anything made for two hands.",
            },
            evidence: "projection",
            sourceIds: ["tk-beijing-2025-robot-half-marathon", "tk-figure-2025-bmw"],
          },
          {
            picture: "math",
            title: { en: "Mathematics" },
            line: {
              en: "AI agents claim to have solved a famous open problem. Still under review.",
            },
            evidence: "contested",
            sourceIds: ["tk-quanta-2026-navier-stokes", "tk-clay-2026-navier-stokes"],
          },
          {
            picture: "slides",
            title: { en: "This presentation" },
            line: {
              en: "The story is mine; the slides, animations and demos were built by AI agents working in parallel.",
            },
            evidence: "observed",
            sourceIds: ["tk-ai-exhibit-repository"],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- The riddle was a toy; this is what is already happening outside the lab
- **Do:** code: Google, April 2026: 75% of new code AI-generated, approved by engineers (company figure); METR: agents now finish tasks of many hours
- **Do:** driving: Waymo, February 2026: over 400,000 paid rides a week in six US metro areas
- **Do:** robots: 19 April 2025, Beijing, the first humanoid robot half-marathon, 20 teams; the winner took about 2 h 41 (Beijing government); a Figure robot held one task at BMW for 11 months (company-reported); "next" is my projection
- **Do:** maths: September 2026, about 10,000 agents, 88 hours, Navier-Stokes; the Clay Institute has not ruled, priority disputed
- **Do:** this presentation: the story and the choices are mine, and I checked every claim and source; Claude Code agents, several in parallel for a few hours, wrote the code, drew the pictograms and animations, built the live demos and looked up sources, over many rounds of my feedback and their revisions
- My conviction, said as mine: even if AI stopped improving today, it could already do most expert work; the rest is adaptation. Experts disagree on timelines, some strongly: weigh my view accordingly
- **Ask:** five years ago, before ChatGPT, would most people have called any of this science fiction? (Leave it open; it echoes the opening video's title)`,
    },
    transitionIn: { en: "The riddle was a toy. Outside the lab, AI is already at work." },
    transitionOut: { en: "How did we get here so fast? Seven years, in numbers." },
    evidenceLevel: "contested",
    sourceIds: [
      "tk-google-2026-next-code",
      "tk-metr-2026-time-horizon-1-1",
      "tk-waymo-2026-weekly-rides",
      "tk-figure-2025-bmw",
      "tk-beijing-2025-robot-half-marathon",
      "tk-quanta-2026-navier-stokes",
      "tk-clay-2026-navier-stokes",
      "tk-ai-exhibit-repository",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 135,
    optional: false,
    localizationNotes:
      "Say the date of every figure out loud. The cards carry the evidence; the presenter's conviction (\"even if AI stopped improving today\") is in the notes, say it as an opinion.",
  },
  {
    id: "01-progress",
    code: "rise",
    steps: 9,
    chapter: "01",
    number: "1.3",
    title: { en: "Everything went up" },
    objective: {
      en: "Show on one slide how fast frontier models grew from GPT-2 (2019) to today: cost, electricity, memory, reliability, and the hardest tests, with a labelled one-year projection.",
    },
    takeaway: {
      en: "In seven years, cost, memory and reliability grew a thousand to tens of thousands of times, training electricity over a hundred times, and the hardest tests went from near zero to near the top.",
    },
    visual: { layout: "component", component: "FrontierProgress", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- Start: top row, what went in and what the models hold; bottom, the hardest tests. Each label says how we know: estimate, published, measured, projection
- Click 1, cost (estimate, Epoch AI): GPT-2 about $4,300 (2019), GPT-3 $2.1 million (2020), GPT-4 $37 million (2023), GPT-4.5 about $366 million (2025): about 84,000 times more. The computing behind it grew about 500,000 times, from about 2e21 operations (GPT-2) to about 1e27 (GPT-6 Astra)
- Click 2, training electricity = power × training time (both Epoch AI estimates): GPT-3 about 1.8 GWh (5 MW for 14.8 days), GPT-4 about 45 GWh (20 MW for about 95 days, a speculative duration), Grok 3 about 237 GWh (110 MW for about 90 days), a year of electricity for about 22,000 US homes (EIA). GPT-2 has no estimate; GPT-6 Astra draws about 233 MW but its training time is not known, so it is not plotted. Patterson et al. estimated GPT-3 lower, 1.3 GWh
- Click 3, memory (published by the developers): 1,024 tokens (GPT-2), 2,048 (GPT-3), 32,768 (GPT-4's larger version, 2023), 1 million (Grok 3, 2025): from a page and a half to about 1,500 pages
- Click 4, reliability (measured by METR, mostly software tasks): the length of task, in an expert's time, finished half the time. GPT-2 about 3 seconds, GPT-4 about 3.5 minutes (2023), Claude 3.7 Sonnet about 1 hour (Feb 2025), GPT-5 about 3.4 hours, Claude Opus 4.6 about 12 hours (Feb 2026), Claude Mythos Preview about 17 hours (Apr 2026; interval 8 to 55 hours)
- Click 5, GPQA Diamond (best score so far, Epoch AI's runs): PhD-level science questions; PhDs in the field score 65% (Rein et al.). GPT-4 36% (2023), o1 77% (Dec 2024), Gemini 3 Pro 93% (Nov 2025), GPT-6 Astra 96% (Sep 2026)
- Click 6, SWE-bench Verified: 500 real bugs from open-source projects, each checked by people. 31% (GPT-4o, Nov 2024) to 84% (Claude Opus 4.7, Apr 2026)
- Click 7, tests built to be too hard. Humanity's Last Exam (2,500 expert questions, Jan 2025): 5% (Sep 2024) to 55% (GPT-6 Astra). FrontierMath (new research problems, hours or days for a mathematician; under 2% at launch, Nov 2024): about 1% to 94% (GPT-6 Astra, on the corrected 2026 version)
- Click 8, ARC-AGI-2 (visual puzzles, each solved by at least two ordinary people in a 400-person study; March 2025): 0% to 95% (GPT-6 Astra, at its most expensive setting). The medal: July 2025, Gemini Deep Think scored 35 of 42 at the International Mathematical Olympiad, gold, graded by the IMO (about 8% of students get gold)
- Click 9, projection for October 2027, trends not promises: training cost over $1 billion (Epoch AI's own words; ×2.4 a year gives about $3.6 billion); electricity about 1,100 GWh (233 MW × 2.1 a year ≈ 520 MW, for the same training time as Grok 3, about 90 days: an assumption), a year for about 100,000 US homes; tasks of 3 to 8 weeks of work (METR doubling every 7 months, or every 131 days since 2023). Memory and test scores: not projected, the tests are near their ceiling and harder ones are being written`,
    },
    transitionIn: { en: "How did we get here so fast? Seven years, in numbers." },
    transitionOut: { en: "So what is all this for? Not just answering: acting." },
    evidenceLevel: "evaluation",
    sourceIds: [
      "tk-epoch-notable-models",
      "llm-eia-household-electricity",
      "tk-gpt2-context-1024",
      "tk-gpt3-context-2048",
      "tk-openai-2023-gpt4-context",
      "tk-xai-2025-grok3",
      "tk-epoch-benchmarks-best-so-far",
      "tk-metr-2026-time-horizon-1-1",
      "tk-metr-2025-time-horizon-paper",
      "tk-rein-2023-gpqa",
      "tk-swebench-verified",
      "tk-phan-2025-hle",
      "tk-glazer-2024-frontiermath",
      "tk-arcprize-2025-arc-agi-2",
      "tk-deepmind-2025-imo-gold",
      "tk-epoch-2024-training-cost-trend",
      "tk-epoch-2024-power-trend",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 180,
    optional: false,
    localizationNotes:
      "Model and test names stay in English. Say \"best score so far\" for the bottom chart and \"projection\" for the last click, out loud.",
  },
  {
    id: "01-connected",
    code: "conn",
    steps: 7,
    chapter: "01",
    number: "1.4",
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
    number: "1.5",
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
    number: "1.6",
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
    number: "1.7",
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
    number: "1.8",
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
    number: "1.9",
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
