/**
 * Data and pure logic for NextTokenVsClassifier.
 *
 * The next-token probabilities are real: copied from
 * content/assets/recordings/next-token.json (recorded with the former
 * local models, greedy run, top candidates per step). The
 * test checks that every number here still matches the recording and that
 * each locale uses the same base model as the language scenes
 * (`languageModelFor` in ../language/data.ts): AMD-OLMo-1B in English,
 * Qwen2.5-0.5B in French. Re-run the generator snippet in README.md after a
 * new recording.
 *
 * Step 0 is the chapter's running example, the sports classifier of
 * ../textlab: a real output of its trained network (committed weights) for a
 * sentence it never trained on.
 */
import { tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import { LANGUAGE_MODELS, type LanguageModelId } from "@ai-exhibit/ml-runtime/lm";
import { netBasketballProbability } from "../textlab/data/net.ts";
import { SEQUENCE_WORDS } from "./prompts.ts";

export interface SliceCandidate {
  /** Token ID in the model's vocabulary (also its position in the grid). */
  id: number;
  text: string;
  /** Probability, as recorded. */
  p: number;
}

export interface RecordedSlice {
  locale: Locale;
  model: LanguageModelId;
  text: string;
  /** steps[0]: after the prompt; steps[k]: after appending the top candidates of steps[0..k-1]. */
  steps: SliceCandidate[][];
}

/** Reveal steps: the classifier, the first bars, then one appended word per step. */
export const NEXT_TOKEN_STEPS = 1 + SEQUENCE_WORDS;

/**
 * Step 0: one held-out sentence per language (from the network's test set,
 * seed NET_TEST) on which the sports network is right but not certain.
 */
export const CLASSIFIER_SENTENCE: Record<Locale, { text: string; label: "football" | "basketball" }> = {
  en: { text: "The veteran won the rebound in the first half.", label: "basketball" },
  fr: { text: "L'arrière a glissé le ballon au fond des filets.", label: "football" },
};

const SPORT_LABELS = {
  football: { en: "Football" },
  basketball: { en: "Basketball" },
} satisfies Record<string, L10n>;

/** The two bars of step 0, computed by the textlab network (deterministic, cheap). */
export function classifierBars(locale: Locale): { label: string; p: number; sport: "football" | "basketball" }[] {
  const pBasket = netBasketballProbability(tr(CLASSIFIER_SENTENCE, locale).text, locale);
  return [
    { label: tr(SPORT_LABELS.football, locale), p: 1 - pBasket, sport: "football" as const },
    { label: tr(SPORT_LABELS.basketball, locale), p: pBasket, sport: "basketball" as const },
  ].sort((a, b) => b.p - a.p);
}

export const SLICES: RecordedSlice[] = [
  {
    locale: "en",
    model: "amd-olmo-1b",
    text: "She looked out of the",
    steps: [
      [
        { id: 3497, text: " window", p: 0.6205 },
        { id: 7145, text: " corner", p: 0.06655 },
        { id: 3369, text: " door", p: 0.02526 },
        { id: 1113, text: " car", p: 0.01708 },
        { id: 1930, text: " side", p: 0.009119 },
        { id: 8576, text: " kitchen", p: 0.008803 },
        { id: 8323, text: " windows", p: 0.008627 },
        { id: 3817, text: " box", p: 0.005394 },
      ],
      [
        { id: 285, text: " and", p: 0.2354 },
        { id: 15, text: ".", p: 0.1696 },
        { id: 13, text: ",", p: 0.1409 },
        { id: 387, text: " at", p: 0.09742 },
        { id: 273, text: " of", p: 0.07451 },
        { id: 281, text: " to", p: 0.04918 },
        { id: 347, text: " as", p: 0.02162 },
        { id: 969, text: " again", p: 0.01813 },
      ],
      [
        { id: 3047, text: " saw", p: 0.3381 },
        { id: 753, text: " said", p: 0.066 },
        { id: 840, text: " then", p: 0.02077 },
        { id: 11373, text: " smiled", p: 0.01871 },
        { id: 21374, text: " sighed", p: 0.01689 },
        { id: 8344, text: " noticed", p: 0.01544 },
        { id: 369, text: " was", p: 0.01476 },
        { id: 1869, text: " thought", p: 0.01364 },
      ],
      [
        { id: 253, text: " the", p: 0.2922 },
        { id: 247, text: " a", p: 0.1961 },
        { id: 326, text: " that", p: 0.1198 },
        { id: 617, text: " her", p: 0.01875 },
        { id: 271, text: " an", p: 0.01471 },
        { id: 767, text: " two", p: 0.01152 },
        { id: 1633, text: " something", p: 0.009427 },
        { id: 352, text: " it", p: 0.007899 },
      ],
    ],
  },
  {
    locale: "fr",
    model: "qwen2.5-0.5b",
    text: "Il était une",
    steps: [
      [
        { id: 36191, text: " fois", p: 0.4037 },
        { id: 84334, text: " nuit", p: 0.04191 },
        { id: 18195, text: " femme", p: 0.01707 },
        { id: 24604, text: " grande", p: 0.01639 },
        { id: 76718, text: " heure", p: 0.01586 },
        { id: 38792, text: " belle", p: 0.01426 },
        { id: 3958, text: " é", p: 0.014 },
        { id: 50551, text: " bonne", p: 0.01378 },
      ],
      [
        { id: 6185, text: " une", p: 0.2852 },
        { id: 650, text: " un", p: 0.177 },
        { id: 11, text: ",", p: 0.1104 },
        { id: 6866, text: " dans", p: 0.04666 },
        { id: 1112, text: "...", p: 0.02329 },
        { id: 3784, text: " à", p: 0.02268 },
        { id: 662, text: " en", p: 0.02163 },
        { id: 512, text: " le", p: 0.01501 },
      ],
      [
        { id: 24604, text: " grande", p: 0.1304 },
        { id: 18195, text: " femme", p: 0.06212 },
        { id: 35863, text: " jeune", p: 0.04761 },
        { id: 37820, text: " petite", p: 0.04366 },
        { id: 36191, text: " fois", p: 0.03371 },
        { id: 36154, text: " fille", p: 0.03024 },
        { id: 38873, text: " ville", p: 0.02617 },
        { id: 3958, text: " é", p: 0.02247 },
      ],
      [
        { id: 38873, text: " ville", p: 0.1775 },
        { id: 3958, text: " é", p: 0.03309 },
        { id: 46176, text: " maison", p: 0.02864 },
        { id: 66528, text: " famille", p: 0.0196 },
        { id: 20007, text: " mont", p: 0.01881 },
        { id: 1675, text: " gu", p: 0.0156 },
        { id: 264, text: " a", p: 0.0148 },
        { id: 521, text: " ch", p: 0.01369 },
      ],
    ],
  },
];

export function sliceFor(locale: Locale): RecordedSlice {
  return SLICES.find((s) => s.locale === locale)!;
}

/** The source that backs the vocabulary size shown on screen. */
export function vocabSourceId(model: LanguageModelId): string {
  if (model.startsWith("qwen")) return "fnd-qwen25-config";
  if (model.startsWith("smollm2")) return "fnd-smollm2-135m-config";
  if (model.startsWith("amd-olmo")) return "llm-amd-olmo-1b-config";
  return "llm-amd-olmo-1b-config";
}

export function vocabSize(model: LanguageModelId): number {
  return LANGUAGE_MODELS[model].vocabSize;
}

/** Probability left for every token outside the recorded top candidates. */
export function restProbability(cands: SliceCandidate[]): number {
  return Math.max(0, 1 - cands.reduce((sum, c) => sum + c.p, 0));
}

/** How a token is shown: leading space dropped, invisible characters made visible. */
export function displayToken(text: string): string {
  if (text === "\n" || text === "\n\n") return "↵";
  const t = text.replace(/^ /, "").replace(/ /g, "·");
  return t.trim() === "" ? "·" : t;
}

/** The sentence after `appended` greedy steps (each appends the most likely token). */
export function sentenceAfter(slice: RecordedSlice, appended: number): { prompt: string; added: string[] } {
  const added: string[] = [];
  for (let i = 0; i < appended && i < slice.steps.length; i++) added.push(slice.steps[i]![0]!.text);
  return { prompt: slice.text, added };
}

/** Which recorded step the bars show at a reveal step (0 = classifier, no slice). */
export function barsStepFor(revealStep: number): number | null {
  if (revealStep <= 0) return null;
  return Math.min(revealStep, NEXT_TOKEN_STEPS) - 1;
}

/** Words appended to the sentence at a reveal step: one per step after the first bars. */
export function appendedAt(revealStep: number): number {
  return Math.max(0, Math.min(revealStep, NEXT_TOKEN_STEPS) - 1);
}

/** Deterministic PRNG (mulberry32): controller, display and preview draw the same cloud. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The token cloud: one cell per token of the vocabulary, laid out as a jittered
 * grid over a w x h panel. `pitch` is the cell size in stage pixels.
 */
export function cloudShape(size: number, w: number, h: number): { cols: number; rows: number; pitchX: number; pitchY: number } {
  const cols = Math.max(1, Math.ceil(Math.sqrt((size * w) / h)));
  const rows = Math.max(1, Math.ceil(size / cols));
  return { cols, rows, pitchX: w / cols, pitchY: h / rows };
}

export interface CloudSpot {
  id: number;
  x: number;
  y: number;
}

/** Room kept clear to the right of the first spot for its label (stage pixels). */
export const CLOUD_LABEL_ROOM = { left: 40, right: 250, up: 52, down: 52 };

/**
 * Where the highlighted tokens sit in the cloud. Token IDs say nothing about
 * meaning, so a spot is a stable hash of the ID, kept away from the edges and
 * from the other spots so every highlight stays visible. The first spot (the
 * most likely token) is named on screen: the others stay out of its label.
 */
export function cloudSpots(ids: number[], w: number, h: number, minGap = 84): CloudSpot[] {
  const spots: CloudSpot[] = [];
  const mx = w * 0.12;
  const my = h * 0.12;
  const room = CLOUD_LABEL_ROOM;
  const clearance = (x: number, y: number): number => {
    let gap = spots.reduce((m, s) => Math.min(m, Math.hypot(s.x - x, s.y - y)), Infinity);
    const first = spots[0];
    if (first) {
      // Distance from (x, y) to the label box of the first spot.
      const dx = Math.max(first.x - room.left - x, 0, x - (first.x + room.right));
      const dy = Math.max(first.y - room.up - y, 0, y - (first.y + room.down));
      gap = Math.min(gap, Math.hypot(dx, dy) + minGap / 2);
    }
    return gap;
  };
  ids.forEach((id, index) => {
    const rand = seededRandom(id * 2654435761 + 17);
    const right = index === 0 ? w - mx - room.right + 40 : w - mx;
    let best: CloudSpot | null = null;
    let bestGap = -1;
    for (let attempt = 0; attempt < 80; attempt++) {
      const x = mx + rand() * (right - mx);
      const y = my + rand() * (h - 2 * my);
      const gap = clearance(x, y);
      if (gap >= minGap) {
        best = { id, x, y };
        break;
      }
      if (gap > bestGap) {
        bestGap = gap;
        best = { id, x, y };
      }
    }
    spots.push(best!);
  });
  return spots;
}
