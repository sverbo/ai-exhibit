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
    steps: 12,
    chapter: "03",
    number: "3.1",
    title: { en: "Who builds it", fr: "Qui construit tout ça" },
    objective: {
      en: "Introduce the handful of labs and people building frontier models, and the story that links them.",
      fr: "Présenter la poignée de laboratoires et de personnes qui construisent les modèles de pointe, et l'histoire qui les relie.",
    },
    takeaway: {
      en: "A handful of labs, and a few people, shape the most capable models.",
      fr: "Une poignée de laboratoires, et quelques personnes, façonnent les modèles les plus capables.",
    },
    visual: { layout: "component", component: "IndustryStack", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The whole industry on one picture: machines, chip factories, chip designers, data centres, labs; only the ones we discuss light up
- Click 1, Google DeepMind (maker of Gemini): Alphabet's AI lab, based in London
- Click 2, Musk and Altman: in 2015 Altman writes to Musk that it would be good for "someone other than Google" to do it first
- Click 3, OpenAI (maker of ChatGPT): December 2015, a non-profit with a $1 billion pledge. 2019: a capped-profit company under the non-profit, then $1 billion from Microsoft
- Click 4, Musk leaves: he quits OpenAI's board in February 2018
- Click 5, Dario Amodei (OpenAI vice president of research) leaves and co-founds Anthropic (maker of Claude) in 2021 with other former OpenAI staff, a lab centred on safety
- Click 6, xAI (maker of Grok): Musk launches it in July 2023. Meanwhile: ChatGPT (Nov 2022); the board fires Altman in Nov 2023, he is back five days later; OpenAI becomes a public benefit corporation (Oct 2025); Musk's lawsuit dismissed as time-barred (May 2026), appeal announced
- Click 7, Meta
- Click 8, Arthur Mensch leaves DeepMind Paris and co-founds Mistral AI in 2023 with two former Meta researchers
- Click 9, DeepSeek, Qwen (Alibaba), Moonshot AI (Kimi) and Z.ai (Zhipu): many publish their model weights openly
- Click 10, NVIDIA designs the chips; its founder Jensen Huang has run it since 1993
- Clicks 11 and 12, TSMC (Taiwan) makes most of them, about 72% of the top ten foundries' revenue (Q2 2026); ASML (Netherlands) is the only maker of EUV machines
- **Ask:** where is the power in this chain?`,
      fr: `- Toute l'industrie sur une image : machines, usines de puces, concepteurs de puces, centres de données, laboratoires ; seuls ceux dont on parle s'allument
- Clic 1, Google DeepMind (qui fait Gemini) : le laboratoire d'IA d'Alphabet, basé à Londres
- Clic 2, Musk et Altman : en 2015, Altman écrit à Musk qu'il vaudrait mieux que « quelqu'un d'autre que Google » y arrive en premier
- Clic 3, OpenAI (qui fait ChatGPT) : décembre 2015, une organisation à but non lucratif avec 1 milliard de dollars promis. 2019 : une société à profit plafonné sous la fondation, puis 1 milliard de dollars de Microsoft
- Clic 4, Musk s'en va : il quitte le conseil d'OpenAI en février 2018
- Clic 5, Dario Amodei (vice-président de la recherche d'OpenAI) part cofonder Anthropic (qui fait Claude) en 2021 avec d'autres anciens d'OpenAI, un laboratoire centré sur la sécurité
- Clic 6, xAI (qui fait Grok) : Musk le lance en juillet 2023. Entre-temps : ChatGPT (nov. 2022) ; le conseil renvoie Altman en nov. 2023, il revient cinq jours plus tard ; OpenAI devient une société à mission (oct. 2025) ; la plainte de Musk est rejetée pour prescription (mai 2026), il annonce faire appel
- Clic 7, Meta
- Clic 8, Arthur Mensch quitte DeepMind Paris et cofonde Mistral AI en 2023 avec deux anciens chercheurs de Meta
- Clic 9, DeepSeek, Qwen (Alibaba), Moonshot AI (Kimi) et Z.ai (Zhipu) : beaucoup publient ouvertement les poids de leurs modèles
- Clic 10, NVIDIA conçoit les puces ; son fondateur Jensen Huang la dirige depuis 1993
- Clics 11 et 12, TSMC (Taïwan) en fabrique l'essentiel, environ 72 % du chiffre d'affaires des dix plus grands fondeurs (2e trimestre 2026) ; ASML (Pays-Bas) est le seul fabricant de machines EUV
- **Question :** où est le pouvoir dans cette chaîne ?`,
    },
    transitionIn: { en: "From how it works to who builds it.", fr: "De comment ça marche à qui le construit." },
    transitionOut: { en: "Why do they all move so fast?", fr: "Pourquoi vont-ils tous si vite ?" },
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
    title: { en: "Race dynamics", fr: "La dynamique de course" },
    objective: {
      en: "Explain, with a prisoner's-dilemma analogy, why each actor may see slowing down alone as costly even when all would gain from coordinating.",
      fr: "Expliquer, avec une analogie de dilemme du prisonnier, pourquoi chaque acteur peut juger coûteux de ralentir seul, même si tous gagneraient à se coordonner.",
    },
    takeaway: {
      en: "The problem is not always bad will; sometimes it is the structure of the game.",
      fr: "Le problème n'est pas toujours la mauvaise volonté ; c'est parfois la structure du jeu.",
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
      fr: `- Une analogie, pas une description d'acteurs réels
- Deux laboratoires : chacun peut prendre son temps ou foncer
- Quoi que fasse l'autre, foncer semble mieux
- Les deux foncent : pire pour les deux que de prendre leur temps ensemble
- Les sorties : accords, normes communes, vérification
- Certains contestent qu'il y ait une course : ne prêter d'intention à personne`,
    },
    transitionIn: { en: "From the players to the logic that links them.", fr: "Des acteurs à la logique qui les relie." },
    transitionOut: { en: "And while they race, look at what is already possible.", fr: "Et pendant qu'ils courent, regardez ce qui est déjà possible." },
    evidenceLevel: "thought-experiment",
    sourceIds: ["cg-armstrong-2013-racing"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: true,
  },
];
