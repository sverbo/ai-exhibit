import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { agendaItems, partOpener, talkTitle } from "../chapters.ts";
import { credits } from "../credits.ts";

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
      en: "Hold the screen while the room fills up: the talk's title and byline, a calm line, the glossary QR code and a quiet readiness dot.",
    },
    takeaway: {
      en: "The talk starts in a moment.",
    },
    visual: {
      layout: "component",
      component: "HoldingSlide",
      // Forks: set your own name in credits.ts and keep the original line (see localizationNotes).
      props: { title: talkTitle, credits },
    },
    steps: 0,
    interaction: "presenter",
    speakerNotes: {
      en: `- Just the intro screen while the room fills up; the QR code opens the glossary
- Check the **Ready** dot: Hugging Face status (or Simulation) and the YouTube player; your screen says what is still waiting
- Nothing moves by itself: press **Next** to begin, and **T** to start the timer`,
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
    localizationNotes:
      "The title is the presentation title (talkTitle in chapters.ts). The byline comes from credits.ts: a fork may present under its own name (set credits.fork), and is asked to keep the line \"Original presentation by Samuel Verboomen\" with its link to ai-exhibit.samverbo.com and its LinkedIn mark, shown here and on 05-credits.",
  },
  {
    id: "00-welcome-video",
    code: "stake",
    chapter: "00",
    number: "0.2",
    title: { en: "This concerns all of us" },
    objective: {
      en: "Open the talk with a one-minute video from AI In Context that sets the stakes before the presenter speaks.",
    },
    takeaway: {
      en: "Before any explanation, one minute to feel that this concerns all of us.",
    },
    visual: {
      layout: "component",
      component: "YouTubeScene",
      props: {
        videoId: "uX-Cq-rvlv8",
        durationSec: 57,
        kicker: { en: "Before we start" },
        heading: { en: "This concerns all of us" },
        caption: { en: "\"Welcome to AI In Context\", AI In Context on YouTube, 57 s" },
      },
    },
    steps: 0,
    interaction: "presenter",
    speakerNotes: {
      en: `- **Optional**: a mood-setter: the agenda carries on without it. Hide it in Config if time is short
- Just to set the mood: press **Play**, on the presenter screen or on the projector itself; the sound comes from the projector only
- "Welcome to AI In Context", 57 seconds, by the YouTube channel **AI In Context** (from 80,000 Hours)
- Say the channel's name out loud: it is in the resources at the end, and it has a few other very good videos
- On the projector, YouTube's own controls work too: subtitles on or off, their language (English only for this video, or YouTube's automatic translation), and the audio track when YouTube offers dubs. The presenter view follows what you do there
- YouTube may pick an automatic dub by itself: check the audio on the projector before the talk
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
      en: "Five parts: what AI can do, how it works, who builds it, the risks, and what we can do.",
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
- **Scan the QR code**: the glossary on your phone. The talk uses a lot of English terms, even in French: the **terms stay in English**, the definitions are in your language
- The glossary also has a **Try it** tab: the talk's demos, to play with yourself
- One part per click:
  - what **AI can do** today
  - a bit of **history**, then **how it works** in detail: how a machine manages to write
  - **who builds it**: a little drama and geopolitics
  - the **risks**: I will lead you there gently, and you will see it is less science fiction than it sounds
  - **what we can do** about it
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
      en: "Today is about what AI can do and what is at stake, not about using a tool or about the environment.",
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
            en: "Of course it is a serious problem, and a talk of its own.",
          },
          sourceIds: ["sc-iea-2025-energy-ai"],
        },
        {
          title: { en: "Today's focus" },
          body: {
            en: "Understanding the risks, and why they deserve to be taken seriously.",
          },
        },
      ],
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- **Optional**: framing only: nothing later depends on it. Hide it in Config if time is short
- **Not a tutorial** on AI tools: they change every month. Know what is possible, then ask your assistant how
- **Not about the environment**: of course a serious problem, but another talk; for many, today's risks are of another order of magnitude (my view: say it as such)
- To calibrate: one short chatbot question is about **0.3 Wh** (Epoch AI; Google: 0.24 Wh for a median Gemini prompt), one hour of video streaming about **77 Wh** (IEA): **about 250 questions, one hour of streaming**
- Honest caveat: long questions, reasoning models and agents cost far more (about 2.5 Wh for a 10,000-token input, nearly 40 Wh for 100,000): an agent working two hours can equal several hours of streaming
- At world scale: data centres used about **1.5%** of the world's electricity in 2024, and the IEA expects that to more than double by 2030
- Ideally we would cut both; but if it is for your work, do not feel too guilty about boosting your productivity, or you will fall behind (my opinion)
- **Today's focus**: understanding the risks, and why they deserve to be taken seriously. Not to alarm, but to understand what is at stake
- If asked how seriously experts take it: in 2023, Hinton, Bengio and AI lab leaders signed this sentence: "Mitigating the risk of **extinction** from AI should be a global priority **alongside other societal-scale risks such as pandemics and nuclear war**"`,
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
      "tk-google-2025-gemini-prompt-energy",
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
- Question to the room: who has used a chatbot this week?
- Let's test that picture with a trick question`,
    transitionOut: "Let's start with a trick question.",
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
      en: "In a few years, models went from failing simple riddles to answering them easily: if your picture of AI is two years old, it is out of date.",
    },
    visual: { layout: "component", component: "ThenAndNow", props: { variant: "game" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- The idea: show how much models improved in a few years. If your picture of AI stopped somewhere, it is out of date
- The riddle: "When ten plus four is two, what is nine plus six?" Let the **room answer first** (3, on a clock)
- Clicks 1 to 4: GPT-2 (2019) wrong, GPT-3 (2020) wrong, GPT-3.5 (2022) still wrong, GPT-4 (2023) gets it
- The costs on screen are the **last training run** only (Epoch AI's estimates, the same as the next slides): GPT-2 about $4,300, GPT-3 about $2.1 million, GPT-4 about $37 million. With every trial, experiment and failed run, a model's development takes about 1.2 to 4 times that compute (2.2 times typically), salaries not included. Rented on the cloud, the bills were higher still: GPT-2 about $43,000, GPT-3 about $4.6 million, and Altman said GPT-4 cost "more than" $100 million
- Click 5: today's reasoning model, a recorded answer with its name and date
- Click 6, live: type any question; three open models of increasing size answer side by side, each with its year and size: Qwen2.5 0.5B (2024, a base model never trained to chat), Llama 3.1 8B Instruct (2024), GLM-5.3 (Z.ai, 2026, 753 billion parameters, thinks before answering)
- Try other tricks, for example with letters: "How many r's are in the word strawberry?" (prefilled). Models never see letters, only pieces of words: we will see why in **Tokens**
- Simulation (no Hugging Face): the field is locked on the strawberry question and shows the answers recorded on 4 October 2026: 1, then 2, then 3 (correct)
- GPT-2 to GPT-4 cannot be called live (closed, or not served), hence open models on the live step`,
    },
    transitionIn: {
      en: "From the question to a quick test.",
    },
    transitionOut: { en: "The riddle is a toy. What about the real world?" },
    evidenceLevel: "observed",
    sourceIds: ["tk-aidigest-2023-progress", "tk-epoch-notable-models", "tk-cottier-2024-dev-compute-ratio", "tk-hagendorff-2022-crt", "tk-berglund-2023-reversal-curse", "llm-gpt2-paper"],
    // C: the last step asks open models live (/api/llm/ladder); the recorded steps need nothing.
    runtimeClass: "C",
    artifacts: [],
    fallback: { kind: "recording", asset: "recordings/live-ladder.json" },
    durationSec: 240,
    optional: false,
    localizationNotes:
      "The published answers were asked in English: the French edition shows them verbatim with a labelled translation. The live ladder is asked in the edition's language; Simulation shows the recorded run of that language.",
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
      en: "AI is already at work outside the lab; what holds it back now is mostly software, permissions and habits, not intelligence.",
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
              en: "Beyond the story, AI agents built the tool, animations and live demos in a few hours, in parallel.",
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
- My conviction, said as mine: even if AI stopped improving today, it would already be close to **expert level** on most intellectual work. What is missing is adaptation: the inertia of big companies, permissions, connectors, software still to build
- If challenged: on targeted tests, yes (GPQA: PhDs in the field 65%, best model 96%); on long real tasks, not yet reliable (METR: a top model succeeds **half the time** on tasks that take an expert about 17 hours)
- **Code**: at Google, **75%** of new code is generated by AI, then approved by engineers (April 2026, company figure). Say "three new lines out of four at Google", not "nobody codes by hand any more"
- **Driving**: Waymo, February 2026: over **400,000 paid rides a week** with nobody at the wheel, in six US metro areas
- In Belgium: since **June 2026**, Tesla's FSD (Supervised) is allowed. It steers, brakes and changes lanes, but it is level 2: **the driver must watch and remains responsible**. Not a driverless car
- **Robots**: April 2025, Beijing, the first humanoid robot half-marathon (the winner took about 2 h 41); a Figure robot held one task at BMW for 11 months (company-reported). "Next: anything made for two hands" is my projection. If you show a robot video (flips, kung fu), say where it comes from
- **Mathematics**: September 2026, OpenAI announced that about 10,000 agents working 88 hours produced a proof on **Navier-Stokes**, one of the $1 million Millennium Prize problems. The Clay Institute says it "has apparently been settled" but has not ruled, and priority is disputed: say AI agents **claim** to have solved it
- **This presentation**: beside the flow of the story and a few rounds of iteration, the tool itself, the animations and the live demos were built by several AI agents (Claude Code) running in parallel within a few hours, taking initiative and testing in the browser themselves; I directed it and checked every claim and source
- Open question to the room: five years ago, before ChatGPT, would most people have called any of this science fiction?`,
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
      "tk-belgium-2026-tesla-fsd",
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
      en: "Everything went up, and fast: cost, electricity, memory, reliability and test scores, by factors of a hundred to tens of thousands.",
    },
    visual: { layout: "component", component: "FrontierProgress", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- **Everything went up**, and fast: in seven years, not a small improvement but a boom on every axis at once
- Do not read every figure: pick a few ratios
  - **Cost** of training: about **84,000 times** more, from about $4,300 (GPT-2, 2019) to about $366 million (GPT-4.5, 2025) (last training run only; with all the trials and failed runs, about 1.2 to 4 times more compute)
  - **Electricity**: about **130 times** more from GPT-3 (1.8 GWh) to Grok 3 (237 GWh, a year of electricity for about 22,000 US homes); electricity is becoming the bottleneck
  - **Reliability**: the length of task a top model finishes half the time went from about 3 seconds of expert work (GPT-2) to about 17 hours (April 2026), about **20,000 times** longer
  - **Tests**: PhD-level science questions, from 36% (GPT-4, 2023) to **96%**, above PhDs in the field (65%)
- **Memory, the context window**, is a big part of why they feel so much more capable: about a page and a half for GPT-2, three pages for GPT-3, about **1,500 pages** today (1 million tokens), about **1,000 times** more
- When a conversation overflowed the window, its start fell out: that is why models seemed to "forget". Now a whole book, a codebase or a long project fits at once
- Each label says how we know (estimate, published, measured, projection). The last click is a projection, a trend and not a promise: training over $1 billion by October 2027
- The other tests on screen (bugs fixed, Humanity's Last Exam, FrontierMath, ARC-AGI-2, the maths olympiad gold) are in the Sources tab if someone asks`,
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
      en: "An agent is a model that can call tools: it no longer just answers, it acts in your mail, files, browser and payments.",
    },
    visual: { layout: "component", component: "ConnectedAssistant", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The difference between a chatbot and an **agent**: an agent can **call tools**
- The assistant sits in the middle; connectors appear one by one
- **Email and calendar**: read, draft, schedule
- **Files**: search and summarise your documents
- **Browser**: it clicks and fills forms on websites
- **Shopping and payments**: protocols now exist for agents to pay
- **Code**: it writes and runs programs
- Every connector is a permission we choose to give: next slide`,
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
      en: "Because agents look more and more reliable, we keep giving them more permissions, until the day it really matters.",
    },
    visual: { layout: "component", component: "PermissionsBoard", props: { mode: "permissions" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Same model; only what we allow it to touch changes: read files, write files, terminal, browser, money. Each switch turns advice into action
- We say some things are risky; in practice, **productivity** and convenience push us to accept more and more risky actions
- The agent looks more and more reliable, so we feel it will be fine. Because it looks reliable, we give it more permissions, until the day it really matters
- This has a name: **automation bias**. The more reliable a system looks, the less we check it
- My own case: I gave mine access to almost everything. It can **spend money** (credits in my name) and **modify databases**, things I did not allow before. The upside: it works for **two hours** without me
- Money is real: published tools already let agents make transfers
- Question to the room: which switch would make you hesitate on your own computer?`,
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
      en: "This is not a lab demo: it is my everyday use, and it already works.",
    },
    visual: { layout: "component", component: "VideoScene", props: { src: "personal-demo.mp4", audio: false } },
    interaction: "presenter",
    speakerNotes: {
      en: `- What I asked, in one Slack message: check whether Remco Evenepoel won the European Championship and, if so, recolour the website in the Belgian jersey's colours with animations; book a slot in my calendar between 8 and 9 pm to watch the best moments; look through my recent emails and meetings for someone who wants to watch it with me
- Recorded on 5 October 2026 with Claude (desktop app, Opus 5.5), 67 seconds, no sound
- What it chained on its own, through its connectors: it read Slack, my emails, my past meetings and my Google Drive; it created documents; it wrote the code itself, then took screenshots of what it was building to test it; it booked the slot in my calendar, then answered on Slack
- The point: show what it can do, and that I use it every day
- Pause where it acts on its own; point at the moment it asks before acting
- What it got wrong, if anything
- In many companies permissions are restricted, Copilot does not do all of this, many people are on Windows; but in fact, this is what it is: **it is doable today**`,
    },
    transitionIn: {
      en: "From the switches to a real run.",
    },
    transitionOut: {
      en: "Before we slow one request down: what does the model actually receive?",
    },
    // The presenter's own screen recording: shown, not cited.
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 100,
    optional: false,
  },
  {
    id: "01-no-memory",
    code: "nomem",
    steps: 3,
    chapter: "01",
    number: "1.7",
    title: { en: "No memory" },
    objective: {
      en: "Show that a model does not learn while you chat: at every message, the app sends it the whole conversation again, within the context window, plus text you never see (a system prompt, the tool descriptions).",
    },
    takeaway: {
      en: "A model remembers nothing: at every message, the app sends it the whole conversation again, with instructions and tool descriptions you never see.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "The model has no memory" },
        cards: [
          {
            picture: "frozen",
            title: { en: "It does not learn from you live*" },
            line: { en: "Its weights do not change while you chat." },
            sourceIds: ["fnd-claude-messages-stateless", "fnd-anthropic-2025-consumer-terms"],
          },
          {
            picture: "resend",
            title: { en: "Everything, every time" },
            line: { en: "At every message, the app sends it the whole conversation again, summarized if too long." },
            sourceIds: ["fnd-claude-messages-stateless", "fnd-claude-context-windows"],
          },
          {
            picture: "hidden",
            title: { en: "Text you never see" },
            line: { en: "The company's instructions, and the description of its tools." },
            sourceIds: ["fnd-claude-tool-use-system-prompt", "fnd-claude-app-system-prompts", "fnd-claude-personalization-help", "fnd-claude-memory-help"],
          },
        ],
        footnote: {
          en: "* Depending on the provider, your plan and your settings, your conversations may be used later to train its next models.",
        },
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Click 1, **it does not learn from you live**: its numbers (the **weights**) were set during training, and they do not change while you talk to it
- Click 2, **everything, every time**: at every message, the app sends the **whole conversation** again, from the very first message, and the model reads it all from scratch. That works while it fits in the **context window** (slide 1.3); when it overflowed, the start fell out: that is why chatbots seemed to "forget". Today, when it gets too long, the app **summarizes** the older part (it is called compaction)
- Click 3, **text you never see**: with your message, the model also receives a **system prompt** from the company (its role, today's date, what to avoid; Anthropic publishes the one of its own apps) and the **descriptions of every tool** it may use
- Also in that hidden text, depending on the app: **your own instructions**, written once in the settings or in a project; the "**memory**" notes it saved about you; and information **fetched** along the way (a web search, a document, a past chat)
- So a tool call is nothing magic: the model reads the tool descriptions in that text, and writes its call as more text. Next slide, up close
- The **asterisk** at the bottom: depending on the provider, the plan and your settings, your conversations may be used **later** to train **new** models (Anthropic: a setting on its consumer plans since 2025; not its business plans or the API). That is a future training run, not the model learning live`,
    },
    transitionIn: {
      en: "From what it does to what it really receives.",
    },
    transitionOut: {
      en: "One of those hidden pieces, up close: the tool call.",
    },
    evidenceLevel: "none",
    sourceIds: [
      "fnd-claude-messages-stateless",
      "fnd-claude-context-windows",
      "fnd-claude-tool-use-system-prompt",
      "fnd-claude-app-system-prompts",
      "fnd-claude-memory-help",
      "fnd-claude-personalization-help",
      "fnd-anthropic-2025-consumer-terms",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
    localizationNotes:
      "The conversation is illustrative. Its last message is the question of the next slide (ToolCallDemo, search scenario) and comes from the same text, so both stay identical. \"Context window\" and \"system prompt\" stay in English with their gloss in French.",
  },
  {
    id: "01-tool-call",
    code: "tool",
    steps: 5,
    chapter: "01",
    number: "1.8",
    title: { en: "Chat or agent: calling a tool" },
    objective: {
      en: "Show, with real JSON, that a model only writes text and the software around it runs the tools.",
    },
    takeaway: {
      en: "An agent is still a language model: it writes a structured request, and the software around it does the action and hands back the result.",
    },
    visual: { layout: "component", component: "ToolCallDemo", props: { scenario: "search" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- An agent is still a **language model**. In its context, hidden from you, the application describes the tools it may call
- Calling a tool just means **writing text**: not free text for you, but **structured text** (JSON) meant for the software
- Same question on both sides (illustrative): the chatbot alone cannot know, its knowledge stops at training; the agent writes a tool call instead of answering
- The software reads it and does the work: calls an API, runs a search, runs code. Ordinary computing, as it always existed
- The result comes back to the model as if **you** were answering the chatbot (a message with its own "tool" role), often dense and complicated
- Then the model either calls another tool, or, once it has acted and has what it needs, answers you in plain, clear language
- Switch examples (the umbrella in Bruges, and others): the same pattern every time
- Why models are good at this: they read a lot of **code** in training, about **17%** of Llama 3's training text, so they write logical, structured text well
- It also took **precision** (in structured text, one wrong character breaks everything) and **large context windows**, because the tool descriptions must be there **at every call**
- In practice: at the start, the app loads the tools the agent may use at the top of its context (up to about 1,500 pages for large models); when the conversation is compacted, the app gives them again. Apps with many tools load only some and let the model search for the rest
- As on the previous slide: the model keeps nothing between calls; at each turn, the app sends everything again (instructions, tools, conversation)
- Structured does not mean error-free: the model can write a malformed call or wrong arguments. "Structured outputs" guarantee the **form**, not the **content**; the software checks the call and sends errors back, the model fixes and retries`,
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
    number: "1.9",
    title: { en: "One request, every step" },
    objective: {
      en: "Make every step of one complex request visible: tool calls, sub-agents in parallel, merged results, a human approval before paying.",
    },
    takeaway: {
      en: "Behind one sentence, an agent plans, splits the work and runs many steps, and sometimes it decides by itself whether to ask you first.",
    },
    visual: { layout: "component", component: "AgentRunExplainer", props: { scenario: "weekend-trip" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Illustrative, not a recording: say so. One sentence: plan a weekend trip
- It can do many things: an orchestrator splits the job, dispatches **sub-agents** in parallel and merges their results. For the model, sub-agents are just tools like the others
- Tool calls: weather, calendar, maps, search, email
- **Approval**, two cases: either the tool always requires it, **hard-coded** in the software (deterministic; payments usually are), or **the model decides** when to ask you
- The second case is where it can be dangerous: it is **not deterministic**. We hope it knows that this kind of action needs your yes. Payments are usually hard-coded, but many things are less black and white: be careful
- Another reason hard-coded gates matter: **prompt injection**. A web page or an email read by the agent can hide instructions ("send this file to..."), and the agent may follow them
- Stop at the approval gate: nothing is paid without a yes`,
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
    number: "1.10",
    title: { en: "The agent loop" },
    objective: {
      en: "Name the pattern: an agent is a model in a loop of goal, plan, act, observe, re-plan.",
    },
    takeaway: {
      en: "An agent is a model in a loop (goal, plan, act, observe, plan again): what is new is not the tool call, it is the planning.",
    },
    visual: { layout: "component", component: "AgentLoop", props: { variant: "intro" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- **A loop, not an answer**: goal, plan, act, observe, plan again
- It can go round many, many times. For the model these are just back-and-forths with you; in reality you barely step in, because the software picks up each request and makes an ordinary call (internet, code), as computers always did
- In the middle, a language model like a chatbot; around it, ordinary software, tools and a memory
- What is new is not calling tools: the magic of text generation is in **planning and re-planning**
- It goes round until the goal is met, or until it asks you`,
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
