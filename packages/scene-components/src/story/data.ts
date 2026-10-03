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
    name: { en: "Artificial intelligence", fr: "Intelligence artificielle" },
    definition: {
      en: "Any machine that imitates something we call intelligent, even with rules written by hand.",
      fr: "Toute machine qui imite ce qu'on appelle l'intelligence, même avec des règles écrites à la main.",
    },
    example: {
      en: "A chess program following rules its programmers wrote",
      fr: "Un programme d'échecs qui suit les règles écrites par ses programmeurs",
    },
    glyph: "♞",
    sourceIds: [],
  },
  {
    id: "ml",
    name: { en: "Machine learning", fr: "Apprentissage automatique" },
    definition: {
      en: "Learns its rules from examples instead of being told them.",
      fr: "Apprend ses règles à partir d'exemples, au lieu qu'on les lui dicte.",
    },
    example: {
      en: "A spam filter trained on emails people marked as spam",
      fr: "Un filtre antispam entraîné sur des courriels marqués comme spam",
    },
    glyph: "✉",
    sourceIds: ["st-graham-2002-plan-for-spam"],
  },
  {
    id: "nn",
    name: { en: "Neural networks (deep learning)", fr: "Réseaux de neurones (deep learning)" },
    definition: {
      en: "A kind of machine learning: layers of numbers, adjusted during training.",
      fr: "Une forme d'apprentissage automatique : des couches de nombres, ajustés pendant l'entraînement.",
    },
    example: {
      en: "Your phone finding every photo with a dog in it",
      fr: "Votre téléphone qui retrouve toutes les photos où il y a un chien",
    },
    glyph: "◉",
    sourceIds: [],
  },
  {
    id: "llm",
    name: { en: "Large language models", fr: "Grands modèles de langage" },
    definition: {
      en: "A neural network trained on enormous amounts of text.",
      fr: "Un réseau de neurones entraîné sur d'énormes quantités de texte.",
    },
    example: {
      en: "Chat assistants such as ChatGPT, Claude or Gemini",
      fr: "Les assistants conversationnels comme ChatGPT, Claude ou Gemini",
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
    when: { en: "1936", fr: "1936" },
    short: { en: "Turing machine", fr: "Machine de Turing" },
    title: { en: "One machine for any procedure", fr: "Une machine pour toute procédure" },
    text: {
      en: "Alan Turing describes a single universal machine that can carry out any step-by-step procedure.",
      fr: "Alan Turing décrit une seule machine universelle, capable d'exécuter n'importe quelle procédure pas à pas.",
    },
    sourceIds: ["st-turing-1936-computable-numbers", "st-sep-turing-machine"],
  },
  {
    id: "enigma-1939",
    track: "promise",
    demo: "bombe",
    when: { en: "1939 to 1945", fr: "1939 à 1945" },
    short: { en: "Enigma", fr: "Enigma" },
    title: { en: "Turing helps break Enigma", fr: "Turing aide à casser Enigma" },
    text: {
      en: "At Bletchley Park an electromechanical machine, the Bombe, starts from a guessed word and searches for the Enigma settings that fit.",
      fr: "À Bletchley Park, une machine électromécanique, la Bombe, part d'un mot deviné et cherche les réglages d'Enigma qui collent.",
    },
    sourceIds: ["st-bletchley-turing", "st-bletchley-bombe", "st-wiki-bombe", "st-wiki-rejewski"],
  },
  {
    id: "dartmouth-1956",
    track: "promise",
    when: { en: "1956", fr: "1956" },
    short: { en: "A name", fr: "Un nom" },
    title: { en: "A name for the field", fr: "Un nom pour un domaine" },
    text: {
      en: "Four researchers propose a summer workshop on “artificial intelligence” at Dartmouth College.",
      fr: "Quatre chercheurs proposent un atelier d'été sur « l'intelligence artificielle » au Dartmouth College.",
    },
    sourceIds: ["st-mccarthy-1955-dartmouth-proposal"],
  },
  {
    id: "perceptron-1958",
    track: "promise",
    when: { en: "1958", fr: "1958" },
    short: { en: "First neural network", fr: "Premier réseau de neurones" },
    title: { en: "The first neural network that learns", fr: "Le premier réseau de neurones qui apprend" },
    text: {
      en: "The perceptron teaches itself to sort marked cards. A newspaper hails the embryo of a computer that will read and grow wiser.",
      fr: "Le perceptron apprend seul à trier des cartes marquées. Un journal salue l'embryon d'un ordinateur qui lira et deviendra plus sage.",
    },
    sourceIds: ["st-cornell-2019-perceptron"],
  },
  {
    id: "ai-winters",
    track: "setback",
    period: true,
    when: { en: "1970s to 1980s", fr: "Années 1970 et 1980" },
    short: { en: "AI winters", fr: "Hivers de l'IA" },
    title: { en: "AI winters", fr: "Les hivers de l'IA" },
    text: {
      en: "Promises go unmet. Simple networks hit their limits, rule-based expert systems prove brittle, and funding dries up, twice.",
      fr: "Les promesses ne sont pas tenues. Les réseaux simples butent sur leurs limites, les systèmes experts à règles se révèlent fragiles, et les financements se tarissent, deux fois.",
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
    when: { en: "1997", fr: "1997" },
    short: { en: "Chess", fr: "Les échecs" },
    title: { en: "Deep Blue beats the chess champion", fr: "Deep Blue bat le champion d'échecs" },
    text: {
      en: "Deep Blue beats world champion Garry Kasparov over six games. It checks 200 million positions a second and scores them with rules its team wrote, advised by grandmasters.",
      fr: "Deep Blue bat le champion du monde Garry Kasparov en six parties. Il examine 200 millions de positions par seconde et les note avec des règles écrites par son équipe, conseillée par des grands maîtres.",
    },
    sourceIds: ["st-ibm-deep-blue"],
  },
  {
    id: "deep-learning-2012",
    track: "promise",
    when: { en: "2012", fr: "2012" },
    short: { en: "Deep learning", fr: "Réseaux profonds" },
    title: { en: "Deep learning takes off", fr: "L'apprentissage profond décolle" },
    text: {
      en: "A neural network for images (a convolutional network, or CNN), trained on two graphics cards made for video games, wins the ImageNet image recognition contest by a wide margin.",
      fr: "Un réseau de neurones pour les images (un réseau convolutif, ou CNN), entraîné sur deux cartes graphiques de jeu vidéo, gagne le concours de reconnaissance d'images ImageNet avec une large avance.",
    },
    sourceIds: ["st-krizhevsky-2012-alexnet", "st-imagenet-2012-results"],
  },
  {
    id: "transformer-2017",
    track: "promise",
    when: { en: "2017", fr: "2017" },
    short: { en: "Transformer", fr: "Transformer" },
    title: { en: "The Transformer", fr: "Le Transformer" },
    text: {
      en: "A new architecture reads all the words at once, so training can be split across thousands of chips in parallel: far faster, at the cost of enormous electricity. It is the T in GPT.",
      fr: "Une nouvelle architecture lit tous les mots à la fois, donc l'entraînement se répartit sur des milliers de puces en parallèle : bien plus rapide, au prix d'une énorme consommation d'électricité. C'est le T de GPT.",
    },
    sourceIds: ["st-vaswani-2017-attention", "st-wiki-gpt-2"],
  },
  {
    id: "gpt2-2019",
    track: "promise",
    when: { en: "2019", fr: "2019" },
    short: { en: "GPT-2", fr: "GPT-2" },
    title: { en: "GPT-2", fr: "GPT-2" },
    text: {
      en: "A language model trained on millions of web pages writes coherent paragraphs.",
      fr: "Un modèle de langage entraîné sur des millions de pages web écrit des paragraphes cohérents.",
    },
    sourceIds: ["st-radford-2019-gpt2", "st-wiki-gpt-2"],
  },
  {
    id: "gpt3-2020",
    track: "promise",
    when: { en: "2020", fr: "2020" },
    short: { en: "GPT-3", fr: "GPT-3" },
    title: { en: "GPT-3", fr: "GPT-3" },
    text: {
      en: "The same recipe, more than 100 times bigger. Show it a few examples and it takes on a new task.",
      fr: "La même recette, plus de 100 fois plus grande. Montrez-lui quelques exemples et il s'attaque à une nouvelle tâche.",
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
