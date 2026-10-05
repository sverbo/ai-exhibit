import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { partOpener } from "../chapters.ts";

/**
 * Chapter 03: who builds it (storyboard v1, scenes 3.1 to 3.3).
 * Companies and people are described by documented events and roles, never by
 * assigned motives. The drama is told from the notes, not shown on screen.
 */
export const chapter03: SceneDefinition[] = [
  partOpener("03", "pbld"),
  {
    id: "03-industry",
    code: "stack",
    steps: 13,
    chapter: "03",
    number: "3.1",
    title: { en: "Who builds it" },
    objective: {
      en: "Introduce the handful of labs and people building frontier models, and the story that links them.",
    },
    takeaway: {
      en: "A complex chain with few players, some of them near-monopolies, led by people who do not get along: that is where the race starts.",
    },
    visual: { layout: "component", component: "IndustryStack", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The idea: a complex structure, many layers and many kinds of players; and yet, in the end, not that many players, some of them near-monopolies
- Almost all the top labs are American, with China close behind: in 2024, 40 notable models from US institutions, 15 from China, 3 from Europe (Stanford AI Index 2025). London is in the story only because of DeepMind
- Click 1, **Google DeepMind** (maker of Gemini): founded in London in 2010, bought by Google in 2014
- Click 2, **Musk and Altman**: in 2015 Altman writes to Musk that it would be good for "someone other than Google" to do it first. OpenAI starts as a counterweight to Google
- Click 3, **OpenAI** (maker of ChatGPT): December 2015, a non-profit with a $1 billion pledge
- Click 4, **Musk leaves**: in 2017 the founders fight over control; according to OpenAI, Musk wanted majority equity, control of the board and to be CEO. He quits the board in February 2018. Altman becomes CEO in 2019, the year OpenAI creates a capped-profit company and gets $1 billion from Microsoft
- Click 5, **Dario Amodei**, vice president of research at OpenAI
- Click 6, **Anthropic** (maker of Claude): Amodei leaves OpenAI at the end of 2020 and co-founds Anthropic in 2021 with other former OpenAI staff, a lab centred on safety. Started for a good cause; but the market pushes it into the same race as the others
- Click 7, **xAI** (maker of Grok): Musk launches it in July 2023 (he had bought Twitter, now X, in 2022)
- November 2022: ChatGPT comes out
- 17 November 2023: OpenAI's board fires Altman, saying he "was not consistently candid" with it. Five days later he is back as CEO, with a new board (Bret Taylor, Larry Summers, Adam D'Angelo): of the four members who fired him, only D'Angelo stays. In the end, it is Altman who wins
- That is nearly three years after Amodei left (end of 2020), and four months after Musk launched xAI (July 2023)
- October 2025: OpenAI becomes a public benefit corporation
- Musk against OpenAI: lawsuits since 2024, an unsolicited bid of about $97.4 billion for OpenAI in February 2025 (rejected); his lawsuit was dismissed as time-barred in May 2026, appeal announced
- Why all this drama matters: these people do not like each other, and their rivalry speeds up the race. Everything we will say about risks is made worse by it. Calling them megalomaniacs is my opinion: say it as such, the facts speak for themselves
- Click 8, **Meta**
- Click 9, **Mistral AI** (France), with Arthur Mensch: he worked at DeepMind in Paris, then co-founded it in 2023 with two former Meta researchers. Europe's main lab, much smaller
- Click 10, the Chinese labs, **DeepSeek, Qwen (Alibaba), Moonshot AI (Kimi), Z.ai (Zhipu)**: **open weight**, anyone can download and run their models
- Click 11, **NVIDIA** designs the chips: about **92%** of data-centre GPUs (2024, IoT Analytics); its founder Jensen Huang has run it since 1993
- Click 12, **TSMC** (Taiwan) makes most of them: about **72%** of the top ten foundries' revenue (Q2 2026)
- Click 13, **ASML** (Netherlands): **100%** of EUV machines, the only maker in the world
- Question to the room: where is the power in this chain?`,
    },
    transitionIn: { en: "From how it works to who builds it." },
    transitionOut: { en: "Why do they all move so fast?" },
    evidenceLevel: "observed",
    sourceIds: [
      "st-wiki-arthur-mensch",
      "st-techcrunch-2023-mistral-seed",
      "st-nvidia-jensen-huang",
      "sc-wiki-google-deepmind",
      "sc-wiki-openai",
      "sc-wiki-anthropic",
      "sc-wiki-meta-ai",
      "sc-wiki-xai",
      "sc-wiki-deepseek",
      "sc-wiki-qwen",
      "sc-deepseek-r1-card",
      "sc-hf-qwen3",
      "st-hf-kimi-k2",
      "st-hf-glm-4-5",
      "st-transformer-2024-openai-emails",
      "st-time-2025-openai-timeline",
      "st-fortune-2018-musk-leaves-board",
      "st-techcrunch-2019-openai-lp",
      "st-microsoft-2019-openai-partnership",
      "st-wiki-anthropic",
      "st-cbs-2023-xai-launch",
      "st-nbc-2023-altman-removed",
      "st-techcrunch-2023-altman-return",
      "st-microsoft-2025-openai-next-chapter",
      "st-cbs-2026-musk-verdict",
      "cg-stanford-2025-ai-index",
      "sc-wiki-nvidia",
      "sc-nvidia-2026-fy-results",
      "sc-tsmc-2025-annual-report",
      "sc-trendforce-2026-foundry-q2",
      "sc-asml-2021-euv-only",
      "sc-asml-about",
      "tk-deepmind-2014-google-acquisition",
      "tk-openai-2024-musk-blog",
      "tk-altman-ceo-2019",
      "tk-amodei-2020-leaves-openai",
      "tk-musk-altman-public-feud",
      "tk-nvidia-ai-accelerator-share",
      "tk-stanford-2025-ai-index",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 300,
    optional: false,
    localizationNotes: "Name only documented roles and events; never attribute motives to people or companies.",
    todo: [
      "Before each talk, re-check the Musk v. OpenAI appeal status (st-cbs-2026-musk-verdict) and OpenAI's structure.",
    ],

  },
  {
    id: "03-race",
    code: "race",
    steps: 5,
    chapter: "03",
    number: "3.2",
    title: { en: "Race dynamics" },
    objective: {
      en: "Explain, with a prisoner's-dilemma analogy, why each actor may see slowing down alone as costly even when all would gain from coordinating.",
    },
    takeaway: {
      en: "Even those who want to be careful race, because slowing down alone looks like losing: a prisoner's dilemma.",
    },
    visual: { layout: "component", component: "RaceDilemma", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- **Optional**: the drama of "Who builds it" already shows the race; this slide adds the game-theory reason. Hide it in Config if time is short
- The **prisoner's dilemma**, applied to AI labs: an analogy, not a description of real players
- Two labs: each can take its time or race
- Whatever the other does, racing looks better: if the other slows down, I win; if it races, I must not fall behind
- Both race: worse for both than taking their time together
- That is how a lab founded for safety ends up racing too: investors and the market push it
- Ways out: agreements, shared standards, verification
- Some dispute that there is a race at all; the US government itself talks of "winning the AI race" (America's AI Action Plan, July 2025)`,
    },
    transitionIn: { en: "From the players to the logic that links them." },
    transitionOut: { en: "Racing towards what? The risks." },
    evidenceLevel: "thought-experiment",
    sourceIds: [
      "cg-armstrong-2013-racing",
      "tk-us-2025-ai-action-plan",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: true,
  },
];
