import type { L10n } from "@ai-exhibit/presentation-core";

/* -------------------------------------------------------------------------- */
/* AIEnvelopes: AI contains machine learning contains neural networks          */
/* contains large language models. Explanatory, no evidence badge.            */
/* -------------------------------------------------------------------------- */

export interface Envelope {
  id: "ai" | "ml" | "nn" | "llm";
  name: L10n;
  definition: L10n;
  /** One plain, everyday example. */
  example: L10n;
  /** Decorative glyph next to the example; never the only carrier of meaning. */
  glyph: string;
  sourceIds: string[];
}

export const ENVELOPES: Envelope[] = [
  {
    id: "ai",
    name: { en: "Artificial intelligence" },
    definition: {
      en: "Any machine that imitates something we call intelligent, even with rules written by hand.",
    },
    example: {
      en: "A chess program following rules its programmers wrote",
    },
    glyph: "♞",
    sourceIds: [],
  },
  {
    id: "ml",
    name: { en: "Machine learning" },
    definition: {
      en: "Learns its rules from examples instead of being told them.",
    },
    example: {
      en: "A spam filter trained on emails people marked as spam",
    },
    glyph: "✉",
    sourceIds: ["st-graham-2002-plan-for-spam"],
  },
  {
    id: "nn",
    name: { en: "Neural networks (deep learning)" },
    definition: {
      en: "A kind of machine learning: layers of numbers, adjusted during training.",
    },
    example: {
      en: "Your phone finding every photo with a dog in it",
    },
    glyph: "◉",
    sourceIds: [],
  },
  {
    id: "llm",
    name: { en: "Large language models" },
    definition: {
      en: "A neural network trained on enormous amounts of text.",
    },
    example: {
      en: "Chat assistants such as ChatGPT, Claude or Gemini",
    },
    glyph: "❝",
    sourceIds: [],
  },
];

/* -------------------------------------------------------------------------- */
/* AITimeline { range: "ai" }: no company names on screen.                    */
/* -------------------------------------------------------------------------- */

export type MilestoneTrack = "promise" | "setback";

export interface Milestone {
  id: string;
  /** Promises run above the rail, setbacks below it. */
  track: MilestoneTrack;
  /** A span of years, drawn as a shaded band on its track instead of a point. */
  period?: boolean;
  /** An animated demonstration shown in the feature panel (see BombeDemo). */
  demo?: "bombe";
  /** Big label in the feature panel and on the rail. */
  when: L10n;
  /** Short label next to the rail station. */
  short: L10n;
  title: L10n;
  text: L10n;
  sourceIds: string[];
}

/** In date order; each reveal step adds the next one, whatever its track. */
export const AI_MILESTONES: Milestone[] = [
  {
    id: "turing-1936",
    track: "promise",
    when: { en: "1936" },
    short: { en: "Turing machine" },
    title: { en: "One machine for any procedure" },
    text: {
      en: "Alan Turing describes a single universal machine that can carry out any step-by-step procedure.",
    },
    sourceIds: ["st-turing-1936-computable-numbers", "st-sep-turing-machine"],
  },
  {
    id: "enigma-1939",
    track: "promise",
    demo: "bombe",
    when: { en: "1939 to 1945" },
    short: { en: "Enigma" },
    title: { en: "Turing helps break Enigma" },
    text: {
      en: "At Bletchley Park an electromechanical machine, the Bombe, starts from a guessed word and searches for the Enigma settings that fit.",
    },
    sourceIds: ["st-bletchley-turing", "st-bletchley-bombe", "st-wiki-bombe", "st-wiki-rejewski"],
  },
  {
    id: "dartmouth-1956",
    track: "promise",
    when: { en: "1956" },
    short: { en: "A name" },
    title: { en: "A name for the field" },
    text: {
      en: "Four researchers propose a summer workshop on “artificial intelligence” at Dartmouth College.",
    },
    sourceIds: ["st-mccarthy-1955-dartmouth-proposal"],
  },
  {
    id: "perceptron-1958",
    track: "promise",
    when: { en: "1958" },
    short: { en: "First neural network" },
    title: { en: "The first neural network that learns" },
    text: {
      en: "The perceptron teaches itself to sort marked cards. A newspaper hails the embryo of a computer that will read and grow wiser.",
    },
    sourceIds: ["st-cornell-2019-perceptron"],
  },
  {
    id: "ai-winters",
    track: "setback",
    period: true,
    when: { en: "1970s to 1980s" },
    short: { en: "AI winters", fr: "Hivers de l'IA" },
    title: { en: "AI winters", fr: "Les hivers de l'IA" },
    text: {
      en: "Promises go unmet. Simple networks hit their limits, rule-based expert systems prove brittle, and funding dries up, twice.",
    },
    sourceIds: [
      "st-wiki-ai-winter",
      "st-cornell-2019-perceptron",
      "st-wiki-perceptrons-book",
      "st-lighthill-1973-report",
      "st-wiki-lighthill-report",
      "st-wiki-expert-system",
    ],
  },
  {
    id: "deep-blue-1997",
    track: "promise",
    when: { en: "1997" },
    short: { en: "Chess" },
    title: { en: "Deep Blue beats the chess champion" },
    text: {
      en: "Deep Blue beats world champion Garry Kasparov over six games. It checks 200 million positions a second and scores them with rules its team wrote, advised by grandmasters.",
    },
    sourceIds: ["st-ibm-deep-blue"],
  },
  {
    id: "deep-learning-2012",
    track: "promise",
    when: { en: "2012" },
    short: { en: "Deep learning" },
    title: { en: "Deep learning takes off" },
    text: {
      en: "A neural network for images (a convolutional network, or CNN), trained on two graphics cards made for video games, wins the ImageNet image recognition contest by a wide margin.",
    },
    sourceIds: ["st-krizhevsky-2012-alexnet", "st-imagenet-2012-results"],
  },
  {
    id: "alphago-2016",
    track: "promise",
    when: { en: "2016" },
    short: { en: "Go" },
    title: { en: "A machine wins at Go" },
    text: {
      en: "AlphaGo beats Lee Sedol, winner of 18 world titles, 4 games to 1. Nobody wrote its strategy: it learned from thousands of human games, then from playing against itself.",
    },
    sourceIds: ["st-deepmind-alphago"],
  },
  {
    id: "transformer-2017",
    track: "promise",
    when: { en: "2017" },
    short: { en: "Transformer" },
    title: { en: "The Transformer" },
    text: {
      en: "A new architecture reads all the words at once, so training can be split across thousands of chips in parallel: far faster, at the cost of enormous electricity. It is the T in GPT.",
    },
    sourceIds: ["st-vaswani-2017-attention", "st-wiki-gpt-2"],
  },
  {
    id: "gpt2-2019",
    track: "promise",
    when: { en: "2019" },
    short: { en: "GPT-2" },
    title: { en: "GPT-2" },
    text: {
      en: "A language model trained on millions of web pages writes coherent paragraphs.",
    },
    sourceIds: ["st-radford-2019-gpt2", "st-wiki-gpt-2"],
  },
  {
    id: "gpt3-2020",
    track: "promise",
    when: { en: "2020" },
    short: { en: "GPT-3" },
    title: { en: "GPT-3" },
    text: {
      en: "The same recipe, more than 100 times bigger. Show it a few examples and it takes on a new task.",
    },
    sourceIds: ["st-brown-2020-gpt3", "st-radford-2019-gpt2"],
  },
];

export const TIMELINES: Record<"ai", Milestone[]> = { ai: AI_MILESTONES };

/**
 * Size a logo so every mark carries about the same visual weight: equal area,
 * with width and height clamped. Square marks would otherwise look huge.
 */
export function logoBox(aspect: number, area: number, maxW: number, maxH: number): { w: number; h: number } {
  let w = Math.sqrt(area * aspect);
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  if (w > maxW) {
    w = maxW;
    h = w / aspect;
  }
  return { w: Math.round(w), h: Math.round(h) };
}
