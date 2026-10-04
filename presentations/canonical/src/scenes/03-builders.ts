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
      en: "A handful of labs, and a few people, shape the most capable models.",
    },
    visual: { layout: "component", component: "IndustryStack", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The whole industry on one picture: machines, chip factories, chip designers, data centres, labs; only the ones we discuss light up
- Click 1, Google DeepMind (maker of Gemini): Alphabet's AI lab, based in London
- Click 2, Musk and Altman: in 2015 Altman writes to Musk that it would be good for "someone other than Google" to do it first
- Click 3, OpenAI (maker of ChatGPT): December 2015, a non-profit with a $1 billion pledge. 2019: a capped-profit company under the non-profit, then $1 billion from Microsoft
- Click 4, Musk leaves: he quits OpenAI's board in February 2018
- Click 5, Dario Amodei appears at OpenAI: vice president of research there
- Click 6, Anthropic (maker of Claude): Amodei leaves OpenAI and co-founds it in 2021 with other former OpenAI staff, a lab centred on safety
- Click 7, xAI (maker of Grok): Musk launches it in July 2023. Meanwhile: ChatGPT (Nov 2022); the board fires Altman in Nov 2023, he is back five days later; OpenAI becomes a public benefit corporation (Oct 2025); Musk's lawsuit dismissed as time-barred (May 2026), appeal announced
- Click 8, Meta
- Click 9, Mistral AI, with Arthur Mensch: he worked at DeepMind in Paris, then co-founded it in 2023 with two former Meta researchers
- Click 10, DeepSeek, Qwen (Alibaba), Moonshot AI (Kimi) and Z.ai (Zhipu): many publish their model weights openly
- Click 11, NVIDIA designs the chips; its founder Jensen Huang has run it since 1993
- Clicks 12 and 13, TSMC (Taiwan) makes most of them, about 72% of the top ten foundries' revenue (Q2 2026); ASML (Netherlands) is the only maker of EUV machines
- **Ask:** where is the power in this chain?`,
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
      en: "The problem is not always bad will; sometimes it is the structure of the game.",
    },
    visual: { layout: "component", component: "RaceDilemma", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- An analogy, not a description of real players
- Two labs: each can take its time or race
- Whatever the other does, racing looks better
- Both race: worse for both than taking their time together
- Ways out: agreements, shared standards, verification
- Some dispute there is a race at all: attribute intentions to no one`,
    },
    transitionIn: { en: "From the players to the logic that links them." },
    transitionOut: { en: "Racing towards what? The risks." },
    evidenceLevel: "thought-experiment",
    sourceIds: ["cg-armstrong-2013-racing"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: true,
  },
];
