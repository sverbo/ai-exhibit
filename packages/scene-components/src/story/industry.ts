import type { L10n } from "@ai-exhibit/presentation-core";

/*
 * IndustryStack: the whole industry as a stack of layers, each layer a row of
 * monochrome logos. Everything starts dimmed; each step lights only what the
 * presenter talks about, and portraits appear beside the organisations where
 * people work. Every change waits for a click: within a step, things only fade
 * in or out, never travel. Every lit actor and every move cites sources (st-
 * and sc- IDs).
 */

export type LayerId = "labs" | "cloud" | "chips" | "foundries" | "equipment";

export interface StackActor {
  id: string;
  /** Image ID in content/assets/media/story/credits.ts. */
  image: string;
  label: L10n;
  /** Step at which it lights; never lit when absent. */
  lightAt?: number;
  /** Row within the layer (labs has two). */
  row?: number;
  /** Optical correction of the logo area (1 = default). */
  weight?: number;
  /** The product the audience knows (mark image ID in credits.ts and its name), shown under the lab logo. */
  product?: { image: string; name: string };
  sourceIds: string[];
}

export interface StackLayer {
  id: LayerId;
  name: L10n;
  actors: StackActor[];
}

const l = (en: string, fr = en): L10n => ({ en, fr });

/** Top to bottom as drawn: the labs sit on everything below them. */
export const LAYERS: StackLayer[] = [
  {
    id: "labs",
    name: { en: "AI labs" },
    actors: [
      { id: "google-deepmind", image: "google-deepmind", label: l("Google DeepMind"), lightAt: 1, weight: 1.4, product: { image: "gemini", name: "Gemini" }, sourceIds: ["sc-wiki-google-deepmind", "st-wiki-gemini"] },
      { id: "openai", image: "openai", label: l("OpenAI"), lightAt: 3, weight: 1.15, product: { image: "chatgpt", name: "ChatGPT" }, sourceIds: ["sc-wiki-openai", "st-time-2025-openai-timeline", "st-wiki-chatgpt"] },
      { id: "anthropic", image: "anthropic", label: l("Anthropic"), lightAt: 6, product: { image: "claude", name: "Claude" }, sourceIds: ["st-anthropic-2021-series-a", "st-wiki-anthropic", "sc-wiki-anthropic"] },
      { id: "xai", image: "xai", label: l("xAI"), lightAt: 7, weight: 0.8, product: { image: "grok", name: "Grok" }, sourceIds: ["st-cbs-2023-xai-launch", "sc-wiki-xai", "st-wiki-grok"] },
      { id: "meta", image: "meta", label: l("Meta"), lightAt: 8, weight: 0.8, sourceIds: ["sc-wiki-meta-ai"] },
      { id: "mistral", image: "mistral", label: l("Mistral AI"), lightAt: 9, weight: 0.9, sourceIds: ["sc-wiki-mistral", "st-techcrunch-2023-mistral-seed"] },
      { id: "deepseek", image: "deepseek", label: l("DeepSeek"), lightAt: 10, row: 1, sourceIds: ["sc-wiki-deepseek", "sc-deepseek-r1-card", "st-openrouter-2026-open-weight"] },
      { id: "qwen", image: "qwen", label: l("Qwen (Alibaba)"), lightAt: 10, row: 1, weight: 0.95, sourceIds: ["sc-wiki-qwen", "sc-hf-qwen3"] },
      { id: "moonshot-ai", image: "moonshot-ai", label: l("Moonshot AI (Kimi)"), lightAt: 10, row: 1, weight: 0.85, sourceIds: ["st-hf-kimi-k2"] },
      { id: "zai", image: "zai", label: l("Z.ai (Zhipu)"), lightAt: 10, row: 1, weight: 0.7, sourceIds: ["st-wiki-zai", "st-hf-glm-4-5", "st-openrouter-2026-open-weight"] },
    ],
  },
  {
    id: "cloud",
    name: { en: "Data centers and cloud" },
    actors: [
      { id: "aws", image: "aws", label: l("Amazon Web Services"), sourceIds: ["sc-synergy-2026-q2-cloud"] },
      { id: "microsoft-azure", image: "microsoft-azure", label: l("Microsoft Azure"), sourceIds: ["sc-synergy-2026-q2-cloud"] },
      { id: "google-cloud", image: "google-cloud", label: l("Google Cloud"), sourceIds: ["sc-synergy-2026-q2-cloud", "sc-google-cloud-tpu"] },
      { id: "oracle", image: "oracle", label: l("Oracle"), sourceIds: ["st-register-2025-stargate-oracle"] },
      { id: "coreweave", image: "coreweave", label: l("CoreWeave"), sourceIds: ["st-wiki-coreweave"] },
      { id: "alibaba-cloud", image: "alibaba-cloud", label: l("Alibaba Cloud"), sourceIds: ["sc-wiki-alibaba-cloud"] },
    ],
  },
  {
    id: "chips",
    name: { en: "Chip designers" },
    actors: [
      { id: "nvidia", image: "nvidia", label: l("NVIDIA"), lightAt: 11, sourceIds: ["sc-wiki-nvidia", "sc-nvidia-2026-fy-results"] },
      { id: "amd", image: "amd", label: l("AMD"), sourceIds: ["sc-wiki-amd-instinct"] },
      { id: "google-tpu", image: "google", label: { en: "Google (TPU chips)" }, sourceIds: ["sc-google-cloud-tpu"] },
      { id: "huawei", image: "huawei", label: { en: "Huawei (Ascend chips)" }, sourceIds: ["sc-wiki-hisilicon"] },
    ],
  },
  {
    id: "foundries",
    name: { en: "Chip factories" },
    actors: [
      { id: "tsmc", image: "tsmc", label: l("TSMC"), lightAt: 12, weight: 0.8, sourceIds: ["sc-tsmc-2025-annual-report", "sc-trendforce-2026-foundry-q2"] },
      { id: "samsung", image: "samsung", label: l("Samsung"), sourceIds: ["sc-samsung-foundry", "sc-trendforce-2026-foundry-q2"] },
      { id: "intel", image: "intel", label: l("Intel"), sourceIds: ["sc-intel-foundry"] },
      { id: "smic", image: "smic", label: l("SMIC"), sourceIds: ["sc-smic-about", "sc-trendforce-2026-foundry-q2"] },
    ],
  },
  {
    id: "equipment",
    name: { en: "Machines that make chips" },
    actors: [
      { id: "asml", image: "asml", label: l("ASML"), lightAt: 13, weight: 0.9, sourceIds: ["sc-asml-about", "sc-asml-2021-euv-only"] },
      { id: "applied-materials", image: "applied-materials", label: l("Applied Materials"), sourceIds: ["sc-wiki-applied-materials"] },
      { id: "lam-research", image: "lam-research", label: l("Lam Research"), sourceIds: ["sc-lam-investor"] },
      { id: "tokyo-electron", image: "tokyo-electron", label: l("Tokyo Electron"), sourceIds: ["sc-wiki-tokyo-electron"] },
      { id: "kla", image: "kla", label: l("KLA"), sourceIds: ["sc-wiki-kla"] },
    ],
  },
];

export interface StackPerson {
  id: string;
  /** Image ID in credits.ts. */
  image: string;
  name: string;
}

export const PEOPLE: StackPerson[] = [
  { id: "elon-musk", image: "elon-musk", name: "Elon Musk" },
  { id: "sam-altman", image: "sam-altman", name: "Sam Altman" },
  { id: "dario-amodei", image: "dario-amodei", name: "Dario Amodei" },
  { id: "arthur-mensch", image: "arthur-mensch", name: "Arthur Mensch" },
  { id: "jensen-huang", image: "jensen-huang", name: "Jensen Huang" },
];

/**
 * Where a person stands from `step` on. `org` is a labs actor ID (drawn with a
 * link line) or null (standing apart, no link). `dx` offsets the portrait from
 * the organisation's logo so two people can share it. A new place fades in on
 * its own click while the previous one fades out: portraits never travel.
 */
export interface PersonMove {
  step: number;
  person: string;
  org: string | null;
  /** Horizontal offset from the org's logo centre, or the absolute x when `org` is null. */
  dx: number;
  /** Stand beside the org's logo in its own layer instead of in the portrait lane. */
  inline?: boolean;
  /** What the move shows, for the presenter (controller only). */
  what: L10n;
  sourceIds: string[];
}

export const MOVES: PersonMove[] = [
  {
    step: 2,
    person: "elon-musk",
    org: "openai",
    dx: -72,
    what: {
      en: "Musk is among the founders of OpenAI, a non-profit, in December 2015.",
    },
    sourceIds: ["st-time-2025-openai-timeline", "st-openai-2015-introducing"],
  },
  {
    step: 2,
    person: "sam-altman",
    org: "openai",
    dx: 72,
    what: {
      en: "Altman is among the founders of OpenAI in December 2015 and stays (CEO, briefly removed in November 2023).",
    },
    sourceIds: ["st-time-2025-openai-timeline", "st-techcrunch-2023-altman-return"],
  },
  {
    step: 4,
    person: "elon-musk",
    org: null,
    dx: 1360,
    what: {
      en: "Musk leaves OpenAI's board in February 2018.",
    },
    sourceIds: ["st-fortune-2018-musk-leaves-board", "st-techcrunch-2024-openai-musk-response"],
  },
  {
    step: 5,
    person: "dario-amodei",
    org: "openai",
    dx: -72,
    what: {
      en: "Dario Amodei works at OpenAI (vice president of research; co-author of the 2019 GPT-2 paper).",
    },
    sourceIds: ["st-wiki-anthropic", "st-radford-2019-gpt2"],
  },
  {
    step: 6,
    person: "dario-amodei",
    org: "anthropic",
    dx: 0,
    what: {
      en: "Dario Amodei co-founds Anthropic in 2021 with Daniela Amodei and other former OpenAI staff; he is its CEO.",
    },
    sourceIds: ["st-wiki-anthropic", "st-anthropic-2021-series-a"],
  },
  {
    step: 7,
    person: "elon-musk",
    org: "xai",
    dx: 0,
    what: {
      en: "Musk announces xAI in July 2023.",
    },
    sourceIds: ["st-cbs-2023-xai-launch", "sc-wiki-xai"],
  },
  {
    step: 9,
    person: "arthur-mensch",
    org: "mistral",
    dx: 0,
    what: {
      en: "Arthur Mensch works at DeepMind in Paris, then co-founds Mistral AI in 2023 with two former Meta researchers; he is its CEO.",
    },
    sourceIds: ["st-techcrunch-2023-mistral-seed", "st-wiki-arthur-mensch"],
  },
  {
    step: 11,
    person: "jensen-huang",
    org: "nvidia",
    dx: 185,
    inline: true,
    what: {
      en: "Jensen Huang founded NVIDIA in 1993 and has been its CEO ever since.",
    },
    sourceIds: ["st-nvidia-jensen-huang"],
  },
];

export const INDUSTRY_STEPS = Math.max(
  ...LAYERS.flatMap((layer) => layer.actors.map((a) => a.lightAt ?? 0)),
  ...MOVES.map((m) => m.step),
);

/** The latest move of each person at or before `step` (absent before their first move). */
export function placementsAt(step: number): Map<string, PersonMove> {
  const out = new Map<string, PersonMove>();
  for (const move of MOVES) if (move.step <= step) out.set(move.person, move);
  return out;
}
