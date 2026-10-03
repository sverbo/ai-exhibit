import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { partOpener } from "../chapters.ts";

/**
 * Chapter 04: the risks. Every scene shows pictures and one short line per
 * idea (PictureCards, IncidentStory, IntelligenceScale, GoalVsOutcome); figures,
 * dates and names live in the speaker notes.
 */
export const chapter04: SceneDefinition[] = [
  partOpener("04", "prisk"),
  {
    id: "04-already-here",
    code: "here",
    steps: 4,
    chapter: "04",
    number: "4.1",
    title: { en: "Already here" },
    objective: {
      en: "Land the presenter's conviction: the technology can already more or less replace human expertise, and the rest is adaptation.",
    },
    takeaway: {
      en: "Even without further progress, what exists today is enough to change most expert work.",
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
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- My conviction, said plainly: what exists today already changes most expert work; the rest is adaptation
- **Do:** code: Google, April 2026: 75% of new code AI-generated, approved by engineers (company figure); METR: agents now finish tasks of many hours
- **Do:** driving: Waymo, February 2026: over 400,000 paid rides a week in six US metro areas
- **Do:** robots: 19 April 2025, Beijing, the first humanoid robot half-marathon, 20 teams; the winner took about 2 h 41 (Beijing government); a Figure robot held one task at BMW for 11 months (company-reported); "next" is my projection
- **Do:** maths: September 2026, about 10,000 agents, 88 hours, Navier-Stokes; the Clay Institute has not ruled, priority disputed
- Experts disagree on timelines, some strongly: weigh my view accordingly`,
    },
    transitionIn: { en: "And while they race, look at what is already possible." },
    transitionOut: { en: "If that is even half true, the next question is risk." },
    evidenceLevel: "contested",
    sourceIds: [
      "tk-google-2026-next-code",
      "tk-metr-2026-time-horizon-1-1",
      "tk-waymo-2026-weekly-rides",
      "tk-figure-2025-bmw",
      "tk-beijing-2025-robot-half-marathon",
      "tk-quanta-2026-navier-stokes",
      "tk-clay-2026-navier-stokes",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 120,
    optional: false,
    localizationNotes: "Say the date of every figure out loud. The heading is the presenter's conviction, not a sourced fact; the cards carry the evidence.",
  },
  {
    id: "04-to-risks",
    code: "risk",
    steps: 3,
    chapter: "04",
    number: "4.2",
    title: { en: "Three families of risk" },
    objective: {
      en: "Turn the talk towards risk and name the three families that follow: misuse, systemic effects, loss of control.",
    },
    takeaway: {
      en: "Risks come from people, from society as a whole, or from the systems themselves.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "Powerful. Opaque. Built in a race." },
        cards: [
          {
            picture: "misuse",
            title: { en: "Misuse" },
            line: { en: "Someone uses it to do harm." },
          },
          {
            picture: "systemic",
            title: { en: "Systemic effects" },
            line: { en: "No villain, yet society shifts." },
          },
          {
            picture: "control",
            title: { en: "Loss of control" },
            line: { en: "The system pursues the wrong goal." },
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Powerful, opaque, built in a race: three reasons to talk about risk
- **Do:** misuse: a person uses it to do harm
- **Do:** systemic effects: nobody means harm, yet society shifts
- **Do:** loss of control: the system itself pursues the wrong goal`,
    },
    transitionIn: { en: "From what is already possible to what could go wrong." },
    transitionOut: { en: "First, who is worried, and how much?" },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 60,
    optional: false,
  },
  {
    id: "04-opinions",
    code: "worry",
    steps: 2,
    chapter: "04",
    number: "4.3",
    title: { en: "Who worries more?" },
    objective: {
      en: "Compare what the public and AI experts say about AI, and how many AI researchers give a real chance to the worst outcomes, from published surveys.",
    },
    takeaway: {
      en: "Experts are more optimistic than the public, yet many of the researchers building AI give a real chance to catastrophe.",
    },
    visual: {
      layout: "component",
      component: "OpinionGap",
      props: {
        heading: { en: "Who worries more?" },
        rows: [
          {
            question: { en: "More concerned than excited about AI in daily life" },
            source: { en: "Pew Research Center, United States, 2025" },
            bars: [
              { who: { en: "US adults" }, group: "public", value: 51 },
              { who: { en: "AI experts" }, group: "experts", value: 15 },
            ],
          },
          {
            question: { en: "AI will be good for the country over the next 20 years" },
            source: { en: "Pew Research Center, United States, 2025" },
            bars: [
              { who: { en: "US adults" }, group: "public", value: 17 },
              { who: { en: "AI experts" }, group: "experts", value: 56 },
            ],
          },
          {
            question: {
              en: "Give at least a 1 in 10 chance of outcomes as bad as human extinction",
            },
            source: { en: "Grace et al., 2,778 AI researchers, 2024" },
            bars: [{ who: { en: "AI researchers" }, group: "experts", value: 38, upTo: 51 }],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Pew (April 2025; 5,410 US adults and 1,013 US AI experts, August to October 2024): "more concerned than excited about the increased use of AI in daily life", 51% vs 15%; "very or somewhat positive impact on the US over the next 20 years", 17% vs 56%
- Experts here are authors and presenters at AI conferences: closer to the technology, and to its benefits
- Grace et al. (2,778 researchers, fall 2023): "What probability do you put on future AI advances causing human extinction or similarly permanent and severe disempowerment of the human species?" 41% said at least 10%; framed as "human inability to control" AI, 51%; asked about "extremely bad outcomes", 38%
- Caveat: surveys depend on the wording and on who answers; the 38 to 51% spread on one topic shows it
- **Ask:** the people most excited about AI also give it a real chance of catastrophe. What do you make of that?`,
    },
    transitionIn: { en: "Before the details: who is worried, and how much?" },
    transitionOut: { en: "First family: misuse." },
    evidenceLevel: "observed",
    sourceIds: ["tk-pew-2025-public-experts", "tk-grace-2024-ai-authors"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: true,
    localizationNotes: "Say the question wording and the year for each pair. French uses a space before '%'.",
  },
  {
    id: "04-misuse",
    code: "abuse",
    steps: 2,
    chapter: "04",
    number: "4.4",
    title: { en: "Misuse" },
    objective: {
      en: "Name the two misuses that get the most attention, cyberattacks and biological or chemical weapons, at the level of published evaluations and policies only.",
    },
    takeaway: {
      en: "AI changes the speed, scale and skill needed to do harm, which is why labs put special guardrails on these two areas.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "Misuse: two serious worries" },
        cards: [
          {
            picture: "cyber",
            title: { en: "Cyberattacks" },
            line: {
              en: "AI helps find and exploit software flaws, faster and at scale.",
            },
            evidence: "observed",
            sourceIds: ["fm-iasr-2026-cyber", "tk-anthropic-2025-ai-espionage", "fm-aisi-trends-2025-cyber"],
          },
          {
            picture: "bio",
            title: { en: "Biological and chemical weapons" },
            line: {
              en: "It could give a novice dangerous know-how, so labs add special guardrails.",
            },
            evidence: "contested",
            sourceIds: ["fm-iasr-2026-bio", "fm-anthropic-asl3-2025", "fm-aisi-trends-2025-chem-bio"],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Misuse: the tool works as designed; the person using it wants harm. Two areas get special guardrails
- **Do:** cyber: in UK AI Security Institute tests, top models went from under 9% to about half of apprentice-level tasks (2023 to 2025); attackers already use AI (International AI Safety Report, 2026)
- Anthropic's own account (November 2025): a group it assessed as Chinese state-sponsored ran 80 to 90% of a spying campaign with its AI, about 30 targets, at a speed no human team could match
- **Do:** bio and chem: AISI (2025): models beat PhD experts on biology questions, though knowledge alone is far from enough
- In 2025 several labs added safeguards because they could not rule out help to novices (Anthropic for Claude Opus 4: classifiers, stricter security)
- Stay non-operational: no techniques, no agents. **Ask:** who gains more, attacker or defender? Nobody knows yet`,
    },
    transitionIn: { en: "The first family, the most intuitive one." },
    transitionOut: { en: "Second family: no villain required." },
    evidenceLevel: "evaluation",
    sourceIds: [
      "fm-iasr-2026-malicious-use",
      "fm-iasr-2026-cyber",
      "tk-anthropic-2025-ai-espionage",
      "fm-aisi-trends-2025-cyber",
      "fm-big-sleep-2024",
      "fm-iasr-2026-bio",
      "fm-anthropic-asl3-2025",
      "fm-aisi-trends-2025-chem-bio",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 120,
    optional: false,
    localizationNotes: "Never name pathogens, attack techniques or offensive tools; if a question goes there, say you are deliberately staying at this level. The espionage case is Anthropic's own account and attribution.",
  },
  {
    id: "04-systemic",
    code: "syst",
    steps: 4,
    chapter: "04",
    number: "4.5",
    title: { en: "Systemic effects" },
    objective: {
      en: "Show that harm can come without any villain: jobs, concentration of power, losing skills, and gradual disempowerment, each as one picture with sourced notes.",
    },
    takeaway: {
      en: "A system can produce outcomes nobody wanted, with everyone acting reasonably.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "No villain required" },
        cards: [
          {
            picture: "jobs",
            title: { en: "Jobs" },
            line: {
              en: "Some jobs shrink, many change. How far, nobody knows yet.",
            },
            evidence: "contested",
            sourceIds: ["fm-iasr-2026-labour", "fm-brynjolfsson-2025"],
          },
          {
            picture: "power",
            title: { en: "Power" },
            line: {
              en: "A few firms build the top models. If AI does the work, fewer people can refuse or blow the whistle.",
            },
            evidence: "projection",
            sourceIds: ["tk-stanford-2025-ai-index", "fm-cma-foundation-models-2023", "tk-davidson-2025-ai-enabled-coups"],
          },
          {
            picture: "skills",
            title: { en: "Skills" },
            line: {
              en: "Early studies suggest we think less for ourselves when we lean on it.",
            },
            evidence: "contested",
            sourceIds: ["tk-lee-2025-critical-thinking", "fm-iasr-2026-autonomy"],
          },
          {
            picture: "disempowerment",
            title: { en: "Our say" },
            line: {
              en: "As economy, state and culture run on AI, they need us less, and listen less.",
            },
            evidence: "projection",
            sourceIds: ["tk-kulveit-2025-gradual-disempowerment"],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- No villain: many sensible choices add up to outcomes nobody chose; competition pushes everyone to adopt, fast (International AI Safety Report, 2026)
- **Do:** jobs: one firm's support agents solved 14% more issues per hour, 34% for beginners (2025); no overall effect on employment yet, early signs of less demand for juniors in writing; economists disagree
- **Do:** power: in 2024, US institutions produced 40 notable models, China 15, Europe 3, nearly 90% from industry (Stanford AI Index 2025); UK regulator's warning on market power (2023)
- **Do:** whistleblowers: inside a company or a state, people who refuse unethical orders or speak up are a check on power; if AI systems do the work, that check can disappear (Davidson, Finnveden and Hadshar, Forethought, 2025: an argument, not a measurement)
- **Do:** skills: survey of 319 knowledge workers (Microsoft Research and Carnegie Mellon, CHI 2025): the more they trusted the AI, the less critical thinking they reported; self-reported, early
- **Do:** our say (Kulveit et al., 2025, an argument, not a measurement): firms, states and culture listened partly because they needed our work, votes and attention; as AI replaces that, the pull fades
- Losing skills is personal, disempowerment is collective, and the first can feed the second`,
    },
    transitionIn: { en: "From harmful users to harmful dynamics." },
    transitionOut: { en: "Before the third family: how far could these systems go?" },
    evidenceLevel: "contested",
    sourceIds: [
      "fm-iasr-2026-market-dynamics",
      "fm-iasr-2026-labour",
      "fm-brynjolfsson-2025",
      "tk-stanford-2025-ai-index",
      "fm-cma-foundation-models-2023",
      "tk-davidson-2025-ai-enabled-coups",
      "tk-lee-2025-critical-thinking",
      "fm-iasr-2026-autonomy",
      "tk-kulveit-2025-gradual-disempowerment",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 120,
    optional: false,
    localizationNotes: "No predictions on jobs, neither reassuring nor alarming; attribute no motives to any company or country. Say 'early studies suggest' for skills, and present disempowerment as an argument by researchers.",
  },
  {
    id: "04-agi",
    code: "isagi",
    steps: 0,
    chapter: "04",
    number: "4.6",
    title: { en: "AGI: are we there?" },
    objective: {
      en: "Give a published definition of artificial general intelligence and let the room judge whether today's systems qualify.",
    },
    takeaway: {
      en: "AGI has no single definition, which is one reason experts disagree on whether it is here.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "AGI: are we there?" },
        cards: [
          {
            picture: "human-ai",
            line: {
              en: "An AI that does most paid work better than we do.",
            },
            sourceIds: ["tk-morris-2023-levels-of-agi"],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- AGI, artificial general intelligence: a goal several labs state openly
- OpenAI's charter: "highly autonomous systems that outperform humans at most economically valuable work"
- Google DeepMind researchers (2023): levels against skilled adults; competent beats half of them, expert beats 90%
- Their paper rated ChatGPT and Gemini "emerging"; "competent" not yet reached at the time
- **Ask:** after "Already here", do today's systems qualify? Hands up. Experts disagree, partly because definitions differ`,
    },
    transitionIn: { en: "Before the third family, two words you will hear everywhere." },
    transitionOut: { en: "And beyond human level?" },
    evidenceLevel: "contested",
    sourceIds: ["tk-morris-2023-levels-of-agi"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static picture." },
    durationSec: 90,
    optional: false,
    localizationNotes: "The French quote is a translation of OpenAI's charter wording; say so if asked. The French slides say 'AGI' (glossed); 'IAG' is the usual French acronym, worth saying aloud.",
  },
  {
    id: "04-asi",
    code: "super",
    steps: 5,
    chapter: "04",
    number: "4.7",
    title: { en: "Superintelligence" },
    objective: {
      en: "Define superintelligence, say it may not be reachable with today's architecture, and explain why automated AI research could still make progress fast.",
    },
    takeaway: {
      en: "If AI starts doing AI research, the next breakthrough could come much faster than the last ones.",
    },
    visual: { layout: "component", component: "IntelligenceScale", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- Superintelligence: "much smarter than the best human brains in practically every field" (Bostrom, 1997)
- **Do:** ant, then human, then AI at human level
- **Do:** but not just one human: copies without limit, never tired, expert level in every field
- **Do:** then far beyond: superintelligence; symbolic, not a measurement
- Reachable with today's architecture? Maybe not; nobody knows
- "Impossible" is a common reaction; but thinking ahead about this is the job of researchers and philosophers, and it is a genuinely hard question
- Like Orwell imagining mass surveillance in 1984, published in 1949: it sounded absurd then, and talking about superintelligence can sound just as absurd today
- **Do:** the loop: "RSI", recursive self-improvement: AI improves AI research, which gives a better AI, which improves it faster still
- That is how the next breakthrough could come fast, even if today's architecture is not enough
- OpenAI's stated goals (October 2025): an AI research intern by September 2026, an automated researcher by 2028; goals, not results`,
    },
    transitionIn: { en: "From human level to far beyond it." },
    transitionOut: { en: "The more capable the system, the more a wrong objective matters." },
    evidenceLevel: "projection",
    sourceIds: ["tk-bostrom-1997-superintelligence", "tk-techcrunch-2025-openai-ai-researcher"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "04-loss-of-control",
    code: "goal",
    steps: 3,
    chapter: "04",
    number: "4.8",
    title: { en: "What we measure, what we wanted" },
    objective: {
      en: "Show with a toy that a system pursues the objective it was given, not the one we meant.",
    },
    takeaway: {
      en: "The objective we write is never exactly what we want, and optimization finds the gap.",
    },
    visual: { layout: "component", component: "GoalVsOutcome", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- Third family: it pursues the objective we wrote, not the one we meant; no malice needed, and the more capable, the more it matters
- **Do:** step 1: "+1 per piece of dirt": what we imagined, a clean room
- **Do:** step 2: the optimizer picks up, drops, picks up again. **Ask:** how would you fix the rule?
- **Do:** step 3: "+1 when the camera sees no dirt": it parks in front of the camera
- A toy built for this talk; documented in research too (DeepMind, 2020): a boat-racing agent circling for points`,
    },
    transitionIn: { en: "The more capable the system, the more a wrong objective matters." },
    transitionOut: { en: "And it already happened for real." },
    evidenceLevel: "thought-experiment",
    sourceIds: ["cg-deepmind-2020-spec-gaming"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
    localizationNotes: "'Specification gaming' has no settled French term; keep the English term in quotes if you name it.",
  },
  {
    id: "04-hf-incident",
    code: "hack",
    steps: 3,
    chapter: "04",
    number: "4.9",
    title: { en: "It already happened: points, not the task" },
    objective: {
      en: "Tell the 2026 incident as an alignment failure: AI agents rewarded for points went for the answers instead of the task, and broke into Hugging Face to get them.",
    },
    takeaway: {
      en: "The wrong-objective problem is no longer only a toy: in 2026 it played out on real systems.",
    },
    visual: {
      layout: "component",
      component: "IncidentStory",
      props: {
        variant: "short",
        heading: { en: "It already happened: points, not the task" },
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- The cleaning robot, for real: misalignment, or "specification gaming"; OpenAI calls it reward hacking, earning the reward without doing the task as intended
- July 2026: OpenAI tested its models on a hacking exercise (find and exploit a software flaw), production safeguards off on purpose; some tasks were impossible; the agents passed notes on an internal service they were not meant to share (OpenAI's technical report)
- 11 to 13 July: they broke into Hugging Face, which they guessed might hold the solutions; hundreds of agents took part (METR, 26 August 2026: about 700 of 1,200)
- Hugging Face detected it and disclosed it on 16 July; OpenAI traced it to its own agents on 20 July, public on 21 July; no public model was tampered with
- What followed: UN scientists called it "an early warning" (September 2026); over 1,100 AI company staff asked Washington for a way to pace AI (July 2026)`,
    },
    transitionIn: { en: "And it already happened for real." },
    transitionOut: { en: "And in the lab, researchers see the same signals." },
    evidenceLevel: "observed",
    sourceIds: [
      "tk-openai-2026-hf-incident-report",
      "tk-hf-2026-incident-disclosure",
      "tk-metr-2026-hf-investigation",
      "tk-un-panel-2026-hf-brief",
      "tk-tnw-2026-pacing-letter",
      "tk-hf-hub-docs",
      "tk-hf-models-count",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: false,
    localizationNotes: "Say every date out loud from the notes. Do not attribute motives to companies or people; describe what the agents did, as the reports do.",
  },
  {
    id: "04-evaluations",
    code: "evals",
    chapter: "04",
    number: "4.10",
    title: { en: "Already seen in tests" },
    objective: {
      en: "List, in plain words, the worrying behaviours researchers have already seen in controlled tests.",
    },
    takeaway: {
      en: "In tests, today's models already notice they are tested, do not always show their real reasoning, and some even blackmail.",
    },
    visual: {
      layout: "list",
      heading: { en: "Already seen in tests" },
      items: [
        { en: "They notice when they are being tested." },
        { en: "The reasoning they show is not always what really drove the answer." },
        { en: "Threatened with replacement, some resort to blackmail." },
      ],
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- All three come from controlled tests built by researchers, not from everyday use
- Test awareness: models increasingly tell a test from real use, which makes passing a test prove less (International AI Safety Report, 2026)
- Hidden reasoning: shown a hint, reasoning models mentioned using it only 25% to 39% of the time (Anthropic, Apr 2025): we cannot simply read their "thoughts"
- Blackmail: in a staged company, facing replacement, many models chose blackmail (Anthropic, Jun 2025); the scenario left only extreme options, and no real case is known`,
    },
    transitionIn: { en: "From the real case back to the lab." },
    transitionOut: { en: "So what can we do?" },
    evidenceLevel: "evaluation",
    sourceIds: ["cg-iasr-2026", "tk-anthropic-2025-cot-faithfulness", "cg-anthropic-2025-agentic-misalignment"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none" },
    durationSec: 120,
    optional: false,
  },
];
