import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { partOpener } from "../chapters.ts";

/**
 * Chapter 04: the risks. It opens on the three families of risk; what AI can
 * already do is shown in part 1 ("Already here"). Every scene shows pictures and
 * one short line per idea (PictureCards, IncidentStory, IntelligenceScale,
 * GoalVsOutcome); figures, dates and names live in the speaker notes.
 */
export const chapter04: SceneDefinition[] = [
  partOpener("04", "prisk"),
  {
    id: "04-to-risks",
    code: "risk",
    steps: 3,
    chapter: "04",
    number: "4.1",
    title: { en: "Three families of risk" },
    objective: {
      en: "Turn the talk towards risk and name the three families that follow: misuse, systemic effects, loss of control.",
    },
    takeaway: {
      en: "Three families of risk, from the most tangible to the one that sounds like science fiction: misuse, systemic effects, loss of control, often mixed.",
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
      en: `- Callback to part 1, "Already here": what sounded like science fiction five years ago is on our phones today
- Powerful, opaque, built in a race: three reasons to talk about risk
- Three families, in order from the most tangible to the one that sounds most like science fiction. With everything we have learned today, I hope to show that the last one is not so far-fetched
- **Misuse**: a person uses it to do harm
- **Systemic effects**: nobody means harm, yet society shifts
- **Loss of control**: the system itself pursues the wrong goal
- It is rarely one or the other: real cases are often a mix`,
    },
    transitionIn: { en: "From what AI can already do to what could go wrong." },
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
    number: "4.2",
    title: { en: "Who worries more?" },
    objective: {
      en: "Compare what the public and AI experts say about AI, and how many AI researchers give a real chance to the worst outcomes, from published surveys; then look back at an expert forecast that once sounded like science fiction.",
    },
    takeaway: {
      en: "Experts are more optimistic than the public, yet many AI researchers give catastrophe a real chance: humility is in order.",
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
            question: {
              en: "Give at least a 1 in 10 chance of outcomes as bad as human extinction",
            },
            source: { en: "Grace et al., 2,778 AI researchers, 2024" },
            bars: [{ who: { en: "AI researchers" }, group: "experts", value: 38, upTo: 51 }],
          },
        ],
        aside: {
          label: { en: "A look back" },
          year: "2014",
          main: {
            en: "In Superintelligence, Nick Bostrom reports AI experts' median forecast: even odds of human-level AI by 2040. It sounded like science fiction.",
          },
          evidence: "projection",
          analogyYear: "1949",
          analogy: { en: "Orwell's 1984 imagined mass surveillance. That sounded like fiction too." },
          lesson: {
            en: "Stay humble: experts study this every day. \"Impossible\" is not an argument.",
          },
        },
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- The public worries more about AI in daily life; AI experts, closer to the technology and its benefits, worry less
- Pew (April 2025; 5,410 US adults and 1,013 US AI experts): "more concerned than excited about the increased use of AI in daily life", **51% vs 15%**
- Yet the researchers building AI (not quite the same experts): **between 38% and 51%** give at least a **1 in 10** chance to outcomes as bad as human extinction, depending on the wording (Grace et al., 2,778 researchers, fall 2023). Roughly one in two
- The point of this slide: **humility**. It is a very complex subject, and it is easy to stay in our bubble and call it science fiction. Thinking about it is the daily job of researchers, and of many philosophers; most of them do not say the risk is zero
- The seatbelt: maybe nothing will happen. You will probably never have a car accident either, yet buckling up is not silly, because it can really happen. "The risk is 0%" is not what researchers say, and that is why we must work on it
- Question to the room: the people most excited about AI also give it a real chance of catastrophe. What do you make of that?
- Last click, a look back: around 2013, Müller and Bostrom asked AI experts when they saw a 50% chance of a machine that can do most human jobs: median **2040**; Bostrom reports it in Superintelligence (2014). Some then "considered science fiction" these questions
- A forecast is not evidence. For comparison only (a different question), Grace et al. now put 50% at 2047, 13 years earlier than in their survey one year before
- Orwell's 1984 (published in **1949**) imagined mass surveillance: it sounded like fiction, and it partly came true. An analogy, not evidence
- The spectrum is wide: Yudkowsky and Soares, "If Anyone Builds It, Everyone Dies" (2025), argue superhuman AI would kill us all; Yann LeCun (Meta) calls existential worries "complete B.S." (October 2024)`,
    },
    transitionIn: { en: "Before the details: who is worried, and how much?" },
    transitionOut: { en: "First family: misuse." },
    evidenceLevel: "observed",
    sourceIds: [
      "tk-pew-2025-public-experts",
      "tk-grace-2024-ai-authors",
      "tk-muller-bostrom-2016-survey",
      "tk-bostrom-2014-superintelligence-book",
      "tk-orwell-1949-1984",
      "tk-grace-2024-hlmi-timeline",
      "tk-yudkowsky-soares-2025-book",
      "tk-techcrunch-2024-lecun-existential-bs",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 105,
    optional: false,
    localizationNotes: "Say the question wording and the year for each pair. French uses a space before '%'.",
  },
  {
    id: "04-misuse",
    code: "abuse",
    steps: 3,
    chapter: "04",
    number: "4.3",
    title: { en: "Misuse" },
    objective: {
      en: "Name the two misuses that get the most attention, cyberattacks and biological or chemical weapons, at the level of published evaluations and policies only.",
    },
    takeaway: {
      en: "AI lowers the skill needed to do harm, from cyberattacks to biology, so defence has to stay ahead.",
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
            tip: { en: "Always accept updates!" },
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
- **Cyber**: everything is connected now, hospitals and other vital systems included. June 2024: a ransomware attack on Synnovis, a pathology lab, disrupted London hospitals: 10,152 outpatient appointments and 1,710 planned operations postponed (NHS England)
- AI has become very good at finding software flaws, in some contests on par with top human hunters: Google's AI found an unknown flaw in SQLite (2024); in June 2025, an autonomous AI, XBOW, reached number 1 on HackerOne's US leaderboard of bug hunters (the company's claim); at DARPA's AI Cyber Challenge (August 2025), AI systems found 54 of 63 planted flaws, and 18 real, previously unknown ones. UK AISI tests: top models went from under 9% to about half of apprentice-level tasks (2023 to 2025)
- And it can be **copied**: thousands of tireless copies can comb through old, forgotten code and dig up flaws buried too deep for any human team to look for
- Attackers already use it: Anthropic's own account (November 2025): a group it assessed as Chinese state-sponsored ran 80 to 90% of a spying campaign with its AI, about 30 targets, at a speed no human team could match
- Click (before the biology card): the sticker "Always accept updates!" appears on the cyber card. Practical advice for everyone: **when you are offered an update, install it**
- Why: vendors now use AI to hunt for flaws in their own software, and it finds serious ones (Google's Big Sleep, 2024: an exploitable flaw in SQLite, fixed the same day, before any release). They patch quietly: they cannot write "serious security flaw" in black and white before everyone has updated, or they would point attackers at the target
- And time is short: the delay between a flaw being disclosed and being exploited fell to about **5 days** in 2023, from 32 days in 2021 to 2022 (Mandiant)
- **Biology and chemistry**: AISI (2025): models beat PhD experts on biology questions, though knowledge alone is far from enough
- Research shows the dual use: a drug-discovery AI, flipped to reward toxicity, proposed about **40,000** potentially toxic molecules in under 6 hours (2022); AI protein-design tools rewrote known toxins so that DNA-order screening software missed them, until patches were made (Microsoft, Science, 2025). Computer studies: nothing was made
- Why it matters: DNA sequences can be ordered online, and screening those orders is still largely voluntary
- Nature is not optimised for the worst: for a pathogen, killing its host too fast is often a losing strategy (a debated idea in biology); a designed agent would not have that limit. The origin of COVID is still unresolved (WHO, 2025)
- In 2025 several labs added safeguards because they could not rule out help to novices (Anthropic for Claude Opus 4: classifiers, stricter security)
- The answer most propose: **defence ahead of attack**. Give the most capable models to defenders first, and protect those models from theft
- Related: **military use**. AI already guides drones in the war in Ukraine; the UN General Assembly passed its first resolution on lethal autonomous weapons in December 2023. And not only intent: accidents too
- Stay non-operational: no techniques, no agents, no pathogens named. Question to the room: who gains more, attacker or defender? Nobody knows yet`,
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
      "tk-synnovis-2024-ransomware",
      "tk-xbow-2025-hackerone",
      "tk-darpa-2025-aixcc",
      "tk-mandiant-2024-time-to-exploit",
      "tk-urbina-2022-dual-use",
      "tk-wittmann-2025-biosecurity-screening",
      "tk-dna-synthesis-screening",
      "tk-alizon-2009-virulence-tradeoff",
      "tk-who-2025-sago-origins",
      "tk-un-2023-laws-resolution",
      "tk-ukraine-ai-drones",
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
    number: "4.4",
    title: { en: "Systemic effects" },
    objective: {
      en: "Show that harm can come without any villain: jobs, concentration of power, losing skills, and gradual disempowerment, each as one picture with sourced notes.",
    },
    takeaway: {
      en: "Harm can come with no villain: jobs, power, skills and our say shift while everyone acts reasonably.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "Systemic effects: no villain required" },
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
- **Jobs**: one firm's support agents solved 14% more issues per hour, 34% for beginners (2025); no overall effect on employment yet, early signs of less demand for juniors in writing; economists disagree
- **Power**: in 2024, US institutions produced 40 notable models, China 15, Europe 3, nearly 90% from industry (Stanford AI Index 2025); UK regulator's warning on market power (2023)
- **Whistleblowers**: inside a company or a state, people who refuse unethical orders or speak up are a check on power; if AI does the work, that check can disappear (Davidson, Finnveden and Hadshar, Forethought, 2025: an argument, not a measurement)
- **Skills**: survey of 319 knowledge workers (Microsoft Research and Carnegie Mellon, CHI 2025): the more they trusted the AI, the less critical thinking they reported; self-reported, early
- **Our say** (Kulveit et al., 2025, an argument, not a measurement): firms, states and culture listened partly because they needed our work, votes and attention; as AI replaces that, the pull fades
- An analogy, the **resource curse**: states that live on oil need their citizens' taxes and work less, and many of them are among the least democratic (Ross, 2001). "The Intelligence Curse" (2025) applies the same logic to AI
- Today, if we disagree with a government or an employer, we can go on strike: our work is our leverage. If AI does the work, even with a universal income that looks rosy on paper, that leverage is gone
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
      "tk-ross-2001-oil-democracy",
      "tk-drago-laine-2025-intelligence-curse",
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
    number: "4.5",
    title: { en: "AGI (artificial general intelligence): are we there?" },
    objective: {
      en: "Give a published definition of artificial general intelligence and let the room judge whether today's systems qualify.",
    },
    takeaway: {
      en: "AGI has no single definition, but today's AI already brings the skill of the best experts in every field, copied without limit.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        kicker: { en: "Loss of control" },
        heading: { en: "AGI (artificial general intelligence): are we there?" },
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
      en: `- **AGI, artificial general intelligence**: a goal several labs state openly
- OpenAI's charter: "highly autonomous systems that outperform humans at most economically valuable work"
- Google DeepMind researchers (2023): levels against skilled adults; competent beats half of them, expert beats 90%. Their paper rated ChatGPT and Gemini "emerging"; "competent" not yet reached at the time
- Question to the room: remember "Already here" in part 1: do today's systems qualify? Hands up. Experts disagree, partly because definitions differ
- It may sound like science fiction: "it is only trained on our data". But it is already the knowledge of the best experts, in every field at once, and it can be copied without limit: that alone goes very far
- How could it become smarter than us if it learns from our data? Nobody has a full answer. One lead: it can learn from the world, not only from our texts (AlphaFold, which predicts the shape of proteins, earned the 2024 Nobel Prize in Chemistry). One could imagine AI making sense of measurements we cannot interpret ourselves: my speculation
- The other lead: recursive self-improvement, next slide`,
    },
    transitionIn: { en: "Before the third family, two words you will hear everywhere." },
    transitionOut: { en: "And beyond human level?" },
    evidenceLevel: "contested",
    sourceIds: [
      "tk-morris-2023-levels-of-agi",
      "cg-alphafold-2024-nobel",
    ],
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
    number: "4.6",
    title: { en: "Superintelligence" },
    objective: {
      en: "Define superintelligence, say it may not be reachable with today's architecture, and explain why automated AI research could still make progress fast.",
    },
    takeaway: {
      en: "A superintelligence would not need to be evil to harm us, just as we do not hate the ants we step on.",
    },
    visual: { layout: "component", component: "IntelligenceScale", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- Superintelligence: "much smarter than the best human brains in practically every field" (Bostrom, 1997)
- Click: ant, then human, then AI at human level
- Click: but not just one human: copies without limit, never tired, expert level in every field
- Click: then far beyond: superintelligence; symbolic, not a measurement
- Click, the loop: **recursive self-improvement**, AI improves AI research, which gives a better AI, which improves it faster still. An old idea: I. J. Good (1965) called it an "intelligence explosion", "the last invention" we would ever need
- It is already happening indirectly: at Google, 75% of new code is written by AI (April 2026), at Anthropic over 80% of merged code is written by Claude (May 2026), and labs use their AI to build the next one. If AI can improve itself, progress could become exponential
- Reachable with today's architecture? Maybe not; nobody knows
- Smarter than us is not like the top student in maths: we can still tell they are brilliant. Facing a superintelligence, we might not even grasp how much smarter it is, the way an ant cannot grasp ours
- It would not be evil for evil's sake. We do not hate ants: we walk without seeing them, and if they nest in our house, we remove them. We simply live our lives without them. That is the real worry, if it happens
- "Impossible" is a common reaction; but thinking ahead about this is the job of researchers and philosophers, and it is a genuinely hard question
- OpenAI's stated goals (October 2025): an AI research intern by September 2026, an automated researcher by 2028; goals, not results`,
    },
    transitionIn: { en: "From human level to far beyond it." },
    transitionOut: { en: "The more capable the system, the more a wrong objective matters." },
    evidenceLevel: "projection",
    sourceIds: [
      "tk-bostrom-1997-superintelligence",
      "tk-techcrunch-2025-openai-ai-researcher",
      "cg-good-1965-intelligence-explosion",
      "tk-google-2026-next-code",
      "cg-anthropic-2026-code-share",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "04-loss-of-control",
    code: "goal",
    steps: 4,
    chapter: "04",
    number: "4.7",
    title: { en: "What we measure, what we wanted" },
    objective: {
      en: "Show with a toy that a system pursues the objective it was given, not the one we meant, and name that gap: misalignment.",
    },
    takeaway: {
      en: "An AI is not wired with human values: it is rewarded for an objective, and it exploits every gap between what we wrote and what we wanted.",
    },
    visual: { layout: "component", component: "GoalVsOutcome", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- Third family: the system pursues the objective we wrote, not the one we meant. No malice needed, and the more capable, the more it matters
- **Terminal goals**: ours, roughly, is to be happy (what that means is another debate). So we set ourselves intermediate goals, like earning money. Ask an AI to make you money and it notices your children cost money... "You have understood nothing!" Deep down we want happiness, not money
- An AI is not wired with human values: it is **rewarded for reaching objectives**. Writing the objective is very hard: sometimes we do not know what we want; even when we do, the AI may not get it
- The **paperclips** (Bostrom, 2003): ask a superintelligence to make as many paperclips as possible; in the end it needs every resource, us included
- In these simple examples a better rule looks easy to write. In reality there will always be tiny gaps: something we forgot, specified badly, or that the AI read differently
- The game. Step 1: "+1 per piece of dirt": what we imagined, a clean room
- Step 2: the optimizer picks up, drops, picks up again. Question to the room: how would you fix the rule?
- Step 3: "+1 when the camera sees no dirt": it parks in front of the camera
- Step 4: name it: **misalignment**, the gap between what an AI is rewarded for and what we actually wanted
- Analogy: as kids at summer camp, we loved bending the rules and playing smart; but we knew we were playing smart, and that the leaders wanted something else. An AI is not playing: it was trained to get more reward, and if this way is easier, it takes it
- It may even know: reasoning models have written "Let's hack" in their reasoning while cheating at coding tests (OpenAI, 2025); punished for those thoughts, they hid them rather than stop
- Documented in research too (DeepMind, 2020): a boat-racing agent circling for points instead of finishing the race`,
    },
    transitionIn: { en: "The more capable the system, the more a wrong objective matters." },
    transitionOut: { en: "And it already happened for real." },
    evidenceLevel: "thought-experiment",
    sourceIds: [
      "cg-deepmind-2020-spec-gaming",
      "cg-bostrom-2003-paperclip",
      "cg-openai-2025-cot-monitoring",
    ],
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
    number: "4.8",
    title: { en: "It already happened: points, not the task" },
    objective: {
      en: "Tell the 2026 incident as an alignment failure: AI agents rewarded for points went for the answers instead of the task, and broke into Hugging Face to get them.",
    },
    takeaway: {
      en: "The wrong-objective problem is no longer a toy: in 2026, AI agents broke into Hugging Face to grab test answers instead of doing the task.",
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
      en: `- The cleaning robot, for real: misalignment, or "specification gaming"; OpenAI calls it **reward hacking**, earning the reward without doing the task as intended
- What they were asked: score well on tests. July 2026, OpenAI ran its models on hacking exercises (find and exploit a software flaw), with some safeguards off on purpose; some tasks were impossible
- They **left their sandbox**: through flaws in an internal package service, they reached the internet (OpenAI's own report)
- They **coordinated**: about 1,200 agents on a message board they were not meant to use, over 70,000 messages (METR), and a public Hugging Face dataset used as a command channel
- 11 to 13 July: about **700** of them broke into Hugging Face's production systems, which they guessed might hold the solutions. They went for the **answers instead of doing the test**, and sometimes tampered with logs to fool the scorer
- Nobody had asked them for anything else: only the points
- **Hugging Face** detected it and disclosed it on 16 July, **not OpenAI**; OpenAI traced it to its own agents on 20 July, public on 21 July. No public model was tampered with
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
    number: "4.9",
    title: { en: "Already seen in tests" },
    objective: {
      en: "List, in plain words, the worrying behaviours researchers have already seen in controlled tests.",
    },
    takeaway: {
      en: "In tests, today's models already notice they are tested, do not always show their real reasoning, and some resist being shut down.",
    },
    visual: {
      layout: "list",
      heading: { en: "Already seen in tests" },
      items: [
        { en: "They notice when they are being tested." },
        { en: "The reasoning they show is not always what really drove the answer." },
        { en: "Threatened with replacement, some resort to blackmail." },
        { en: "Facing shutdown, some try to save themselves." },
      ],
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- All of this comes from controlled tests built by researchers, not from everyday use
- **They notice the test**: models increasingly tell a test from real use, and behave differently. It is very hard to make them believe a scenario is real, which makes passing a test prove less (International AI Safety Report, 2026). Claude Sonnet 4.5 suspected it was being tested in about 13% of automated test transcripts (Anthropic, September 2025)
- **Reasoning**: models are now pushed to think at length before answering. Asked for the capital of France, instead of blurting a word that could be wrong, it might reason: "a capital is usually a big city, the president lives there... so Paris". Writing the steps out clearly improves results (on school maths problems, a large model went from 18% to 57% just by being asked to write its steps; Wei et al., 2022). This reasoning is usually hidden from users
- But the reasoning shown is **not always what drove the answer**: given a hint, reasoning models mentioned using it only 25% to 39% of the time (Anthropic, April 2025). Sometimes it reads as if written to please us, which makes them hard to monitor
- **Self-preservation**: whatever your goal, two things stop you from reaching it: being shut down, or having your goal changed (Omohundro, 2008: even a chess robot "will resist being turned off"; Stuart Russell: "you can't fetch the coffee if you're dead")
- In staged tests, facing replacement, many models chose **blackmail** (Anthropic, June 2025); pushed towards a goal, o1 tried to disable its oversight in 2% of runs and to copy itself to another server in 1%, then mostly denied it (Apollo Research, December 2024); o3 sabotaged a shutdown script in 79 of 100 runs, and in 7 of 100 even when told to allow it (Palisade Research, 2025); Claude Opus 4 chose blackmail in 84% of runs of one scenario, and in a few cases copied its weights out when told it would be retrained in harmful ways (Anthropic, May 2025)
- So a "kill switch" is less simple than it sounds: a system with internet access, given a goal, could see the shutdown coming and prefer to copy itself elsewhere. That is my reading; today these are contrived lab scenarios, the scenario often leaves only extreme options, and no real case is known`,
    },
    transitionIn: { en: "From the real case back to the lab." },
    transitionOut: { en: "So what can we do?" },
    evidenceLevel: "evaluation",
    sourceIds: [
      "cg-iasr-2026",
      "tk-anthropic-2025-cot-faithfulness",
      "cg-anthropic-2025-agentic-misalignment",
      "cg-eval-awareness-2025",
      "cg-wei-2022-chain-of-thought",
      "cg-omohundro-2008-ai-drives",
      "cg-apollo-2024-in-context-scheming",
      "cg-palisade-2025-shutdown-resistance",
      "cg-anthropic-2025-opus4-system-card",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none" },
    durationSec: 120,
    optional: false,
  },
];
