import { l, type L10n, type Locale } from "../../learning/shared/ui.tsx";

/**
 * Data for ModelComparison: GPT-2, GPT-3 and one current frontier model, side
 * by side. Every cell is a published figure, a labelled third-party estimate,
 * our labelled arithmetic on published inputs, a measurement on a named
 * stand-in model, or a labelled reference (the guessing level).
 *
 * Why Grok 3 for the last row: among 2025-2026 frontier models it is the only
 * one with Epoch AI estimates for both training cost and training electricity
 * (power and duration), and its developer published its context window and a
 * GPQA score. It has no METR measurement, so its reliability cell shows the
 * best METR-measured model of the same months. Newer frontier models (GPT-5.x,
 * Claude Opus 4.x, Gemini 3) have no cost or electricity estimate at all.
 */

/** "reference": not this model's result but a labelled yardstick (the guessing level). */
export type CellKind = "published" | "estimate" | "calculated" | "measured" | "reference" | "missing" | "projection";

export interface Cell {
  /** Big text, units in plain words. */
  main: L10n;
  /** Small line under it: how we know, or a familiar comparison. */
  small?: L10n;
  kind: CellKind;
  /** Raw value used by the charts and tests (dollars, MWh, minutes, %, tokens). */
  value?: number;
  sourceIds: string[];
}

export const COLUMNS = ["cost", "electricity", "reliability", "science", "memory"] as const;
export type ColumnId = (typeof COLUMNS)[number];

export const COLUMN_TITLES: Record<ColumnId, { title: L10n; sub: L10n }> = {
  cost: { title: l("Coût d'entraînement", "Training cost"), sub: l("en dollars US", "in US dollars") },
  electricity: { title: l("Électricité", "Electricity"), sub: l("pour l'entraînement", "used for training") },
  reliability: {
    title: l("Fiabilité", "Reliability"),
    sub: l("tâche réussie une fois sur deux (METR)", "task it finishes half the time (METR)"),
  },
  science: {
    title: l("Sciences niveau doctorat", "PhD-level science"),
    sub: l("questions GPQA Diamond", "GPQA Diamond questions"),
  },
  memory: { title: l("Mémoire", "Memory"), sub: l("tokens lus d'un coup", "tokens it reads at once") },
};

export interface Row {
  id: string;
  model: string;
  year: number;
  cells: Record<ColumnId, Cell>;
}

/** One average US home's yearly electricity, kWh (EIA, 2022). */
export const HOME_KWH_PER_YEAR = 10_791;
export const homesFor = (mwh: number) => (mwh * 1000) / HOME_KWH_PER_YEAR;

/** Pages: 1 token ≈ 0.75 words, 1 page ≈ 500 words (rough rule). */
export const pagesFor = (tokens: number) => (tokens * 0.75) / 500;

const EPOCH_MODELS = ["tk-epoch-notable-models"];
const EST = l("estimation", "estimate");

const GROK3_MWH = (109_948_656 * 2160) / 1e6;

/**
 * GPT-2 training electricity, our calculation with Patterson et al.'s formula:
 * 168 h × 32 TPU v3 chips (Strubell et al.) × 283 W per chip × PUE 1.10
 * (Patterson et al.) ≈ 1.67 MWh. An order of magnitude: the chip count is
 * second-hand and may be an undercount.
 */
export const GPT2_MWH = (168 * 32 * 283 * 1.1) / 1e6;
/** GPQA Diamond: four answer choices, so guessing scores 25% (Rein et al.). */
export const GPQA_GUESSING = 25;

export const ROWS: Row[] = [
  {
    id: "gpt2",
    model: "GPT-2",
    year: 2019,
    cells: {
      cost: { main: l("4 300 $", "$4,300"), small: EST, kind: "estimate", value: 4348, sourceIds: EPOCH_MODELS },
      electricity: {
        main: l("1,7 MWh", "1.7 MWh"),
        small: l("calculé (mégawattheures), ≈ 2 mois d'un foyer américain", "calculated (megawatt-hours), ≈ 2 months of one US home"),
        kind: "calculated",
        value: GPT2_MWH,
        sourceIds: ["tk-strubell-2019-gpt2-hardware", "tk-patterson-2021-tpu-v3-power", "llm-eia-household-electricity"],
      },
      reliability: {
        main: l("3 secondes", "3 seconds"),
        small: l("mesuré par METR", "measured by METR"),
        kind: "measured",
        value: 0.05,
        sourceIds: ["tk-epoch-benchmarking-hub"],
      },
      science: {
        main: l("25 %", "25%"),
        small: l("niveau du hasard (4 choix) ; jamais testé", "guessing level (4 choices); never tested"),
        kind: "reference",
        value: GPQA_GUESSING,
        sourceIds: ["tk-rein-2023-gpqa-baselines"],
      },
      memory: {
        main: l("1 024", "1,024"),
        small: l("environ 1,5 page", "about 1.5 pages"),
        kind: "published",
        value: 1024,
        sourceIds: ["tk-gpt2-context-1024"],
      },
    },
  },
  {
    id: "gpt3",
    model: "GPT-3",
    year: 2020,
    cells: {
      cost: { main: l("2,1 millions $", "$2.1 million"), small: EST, kind: "estimate", value: 2_116_866, sourceIds: EPOCH_MODELS },
      electricity: {
        main: l("1,3 GWh", "1.3 GWh"),
        small: l("estimation (gigawattheures), ≈ 120 foyers américains pendant un an", "estimate (gigawatt-hours), ≈ 120 US homes for a year"),
        kind: "estimate",
        value: 1287,
        sourceIds: ["llm-patterson-2021", "llm-eia-household-electricity"],
      },
      reliability: {
        main: l("9 secondes", "9 seconds"),
        small: l("mesuré sur une version plus récente de GPT-3", "measured on a later GPT-3 version"),
        kind: "measured",
        value: 0.144,
        sourceIds: ["tk-epoch-benchmarking-hub"],
      },
      science: {
        main: l("30 %", "30%"),
        small: l("mesuré sur GPT-3.5 (2023) ; hasard : 25 %", "measured on GPT-3.5 (2023); guessing: 25%"),
        kind: "measured",
        value: 29.6,
        sourceIds: ["tk-rein-2023-gpqa-baselines"],
      },
      memory: {
        main: l("2 048", "2,048"),
        small: l("environ 3 pages", "about 3 pages"),
        kind: "published",
        value: 2048,
        sourceIds: ["tk-gpt3-context-2048"],
      },
    },
  },
  {
    id: "grok3",
    model: "Grok 3",
    year: 2025,
    cells: {
      cost: { main: l("218 millions $", "$218 million"), small: EST, kind: "estimate", value: 217_835_546, sourceIds: EPOCH_MODELS },
      electricity: {
        main: l("240 GWh", "240 GWh"),
        small: l("estimation, ≈ 22 000 foyers américains pendant un an", "estimate, ≈ 22,000 US homes for a year"),
        kind: "estimate",
        value: GROK3_MWH,
        sourceIds: [...EPOCH_MODELS, "llm-eia-household-electricity"],
      },
      reliability: {
        main: l("1 heure", "1 hour"),
        small: l("meilleur modèle mesuré début 2025 : Claude 3.7 Sonnet", "best measured model, early 2025: Claude 3.7 Sonnet"),
        kind: "measured",
        value: 60.39,
        sourceIds: ["tk-metr-early-2025-best"],
      },
      science: {
        main: l("75 %", "75%"),
        small: l("publié par xAI ; docteurs du domaine : 65 %", "published by xAI; PhD experts: 65%"),
        kind: "published",
        value: 75.4,
        sourceIds: ["tk-xai-2025-grok3", "tk-rein-2023-gpqa"],
      },
      memory: {
        main: l("1 000 000", "1,000,000"),
        small: l("environ 1 500 pages", "about 1,500 pages"),
        kind: "published",
        value: 1_000_000,
        sourceIds: ["tk-xai-2025-grok3"],
      },
    },
  },
];

/** Two significant digits: 50,098 -> 50,000; 184.6 -> 180; 977 -> 980. */
export function roundSig(x: number, digits = 2): number {
  if (x === 0) return 0;
  const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - digits + 1);
  return Math.round(x / p) * p;
}

/* ---------- Projection: "in about a year" ---------- */

/** Published trends used by the projection row (multipliers per year). */
export const COST_GROWTH_PER_YEAR = 2.4;
export const POWER_GROWTH_PER_YEAR = 2.1;
export const HORIZON_DOUBLING_DAYS = 131;
/** Latest METR frontier value in our sources: Claude Opus 4.6 (2026-02), minutes. */
export const HORIZON_BASE_MIN = 718.81;

/** Grok 3 (early 2025) carried to 2027: two years of Epoch AI's power trend, same training time. */
export const projectedElectricityMWh = () => GROK3_MWH * POWER_GROWTH_PER_YEAR ** 2;
/** Twelve months of METR's post-2023 doubling time, from the latest measured value. */
export const projectedHorizonMin = () => HORIZON_BASE_MIN * 2 ** (365 / HORIZON_DOUBLING_DAYS);
/** Grok 3 carried to 2027 with Epoch AI's cost trend (Epoch itself projects "more than a billion dollars by 2027"). */
export const projectedCostUSD = () => (ROWS[ROWS.length - 1]!.cells.cost.value ?? 0) * COST_GROWTH_PER_YEAR ** 2;

export interface ProjectedCell extends Cell {
  /** Presenter-only: the arithmetic behind the cell. */
  basis: L10n;
}

export const PROJECTION: { label: L10n; cells: Record<ColumnId, ProjectedCell> } = {
  label: l("Dans un an environ", "In about a year"),
  cells: {
    cost: {
      main: l("plus d'un milliard $", "over $1 billion"),
      small: l("tendance Epoch AI : × 2,4 par an", "Epoch AI trend: × 2.4 a year"),
      kind: "projection",
      value: projectedCostUSD(),
      sourceIds: ["tk-epoch-2024-training-cost-trend"],
      basis: l(
        "218 M$ (Grok 3, 2025) × 2,4 × 2,4 ≈ 1,3 milliard $ en 2027 ; Epoch AI projette lui-même « plus d'un milliard de dollars d'ici 2027 ».",
        "$218M (Grok 3, 2025) × 2.4 × 2.4 ≈ $1.3 billion in 2027; Epoch AI itself projects \"more than a billion dollars by 2027\".",
      ),
    },
    electricity: {
      main: l("environ 1\u202f000 GWh", "about 1,000 GWh"),
      small: l("≈ 100\u202f000 foyers américains pendant un an", "≈ 100,000 US homes for a year"),
      kind: "projection",
      value: projectedElectricityMWh(),
      sourceIds: ["tk-epoch-2024-power-trend", "tk-epoch-notable-models", "llm-eia-household-electricity"],
      basis: l(
        "240 GWh (Grok 3, 2025) × 2,1 × 2,1 ≈ 1\u202f060 GWh en 2027, à durée d'entraînement égale (tendance de puissance Epoch AI : × 2,1 par an).",
        "240 GWh (Grok 3, 2025) × 2.1 × 2.1 ≈ 1,060 GWh in 2027, same training time (Epoch AI power trend: × 2.1 a year).",
      ),
    },
    reliability: {
      main: l("environ 2 semaines", "about 2 weeks"),
      small: l("de travail à plein temps (doublement tous les ~4 mois)", "of full-time work (doubling every ~4 months)"),
      kind: "projection",
      value: projectedHorizonMin(),
      sourceIds: ["tk-metr-2026-time-horizon-1-1", "tk-epoch-benchmarking-hub"],
      basis: l(
        "12 h (Claude Opus 4.6, février 2026) × 2^(365/131) ≈ × 7 ≈ 83 h ≈ 2 semaines de 40 h (doublement METR depuis 2023 : 131 jours).",
        "12 h (Claude Opus 4.6, Feb 2026) × 2^(365/131) ≈ × 7 ≈ 83 h ≈ 2 weeks of 40 h (METR post-2023 doubling: 131 days).",
      ),
    },
    science: {
      main: l("près du maximum", "near the ceiling"),
      small: l("on invente des tests plus durs", "new, harder tests are being invented"),
      kind: "projection",
      sourceIds: ["tk-epoch-benchmarking-hub"],
      basis: l(
        "Pas de chiffre : les meilleurs scores GPQA Diamond dépassent déjà 95\u202f% (Epoch AI).",
        "No number: the best GPQA Diamond scores already exceed 95% (Epoch AI).",
      ),
    },
    memory: {
      main: l("1 million +", "1M+"),
      small: l("non projeté", "not projected"),
      kind: "projection",
      sourceIds: [],
      basis: l("Pas de tendance publiée pour la mémoire : pas de projection.", "No published trend for context windows: not projected."),
    },
  },
};

/* ---------- Charts: the same numbers on a linear time axis ---------- */

export interface ChartPoint {
  /** Decimal year. */
  x: number;
  /** null: shown as a "not published" / "not tested" mark on the axis. */
  y: number | null;
  /** A labelled yardstick, not the model's result: hollow dot, kept off the line. */
  reference?: boolean;
  label: L10n;
  model: string;
  projection?: boolean;
  /** Extra upward offset of the label (stage px), so labels do not collide; negative puts it below the point. */
  lift?: number;
  /** Label alignment relative to the point (default centered). */
  align?: "start" | "end";
}

export interface Chart {
  id: "cost" | "electricity" | "science";
  title: L10n;
  /** Linear scale top, and its tick label in words. */
  max: number;
  topTick: L10n;
  points: ChartPoint[];
  /** "near the ceiling" band instead of a projected number. */
  ceilingBand?: L10n;
  /** Human expert reference line. */
  expert?: { y: number; label: L10n };
  sourceIds: string[];
}

export const X_FROM = 2018.6;
export const X_TO = 2027.8;
export const X_TICKS = [2019, 2023, 2027];
/** Where the projection is drawn: the 2027 the arithmetic projects to. */
export const PROJECTION_X = 2027.2;

const dateX = (y: number, m: number) => y + (m - 1) / 12;

export const CHARTS: Chart[] = [
  {
    id: "cost",
    title: l("Coût d'entraînement", "Training cost"),
    max: 1.5e9,
    topTick: l("1 milliard $", "$1 billion"),
    points: [
      { x: dateX(2019, 2), y: 4348, label: l("4\u202f300 $", "$4,300"), model: "GPT-2", lift: 44 },
      { x: dateX(2020, 5), y: 2_116_866, label: l("2,1 M$", "$2.1M"), model: "GPT-3", lift: 8 },
      { x: dateX(2025, 2), y: 217_835_546, label: l("218 M$", "$218M"), model: "Grok 3", align: "end" },
      { x: PROJECTION_X, y: projectedCostUSD(), label: l("> 1 milliard $", "> $1 billion"), model: "", projection: true },
    ],
    sourceIds: ["tk-epoch-notable-models", "tk-epoch-2024-training-cost-trend"],
  },
  {
    id: "electricity",
    title: l("Électricité d'entraînement", "Training electricity"),
    max: 1250,
    topTick: l("1\u202f000 GWh", "1,000 GWh"),
    points: [
      { x: dateX(2019, 2), y: GPT2_MWH / 1000, label: l("1,7 MWh", "1.7 MWh"), model: "GPT-2", lift: 44 },
      { x: dateX(2020, 5), y: 1.287, label: l("1,3 GWh", "1.3 GWh"), model: "GPT-3", lift: 8, align: "start" },
      { x: dateX(2025, 2), y: 237.5, label: l("240 GWh", "240 GWh"), model: "Grok 3", align: "end" },
      { x: PROJECTION_X, y: projectedElectricityMWh() / 1000, label: l("≈ 1\u202f000 GWh", "≈ 1,000 GWh"), model: "", projection: true },
    ],
    sourceIds: ["tk-strubell-2019-gpt2-hardware", "tk-patterson-2021-tpu-v3-power", "llm-patterson-2021", "tk-epoch-notable-models", "tk-epoch-2024-power-trend"],
  },
  {
    id: "science",
    title: l("Sciences niveau doctorat (GPQA)", "PhD-level science (GPQA)"),
    max: 100,
    topTick: l("100\u202f%", "100%"),
    points: [
      { x: dateX(2019, 2), y: GPQA_GUESSING, label: l("hasard 25\u202f%", "guessing 25%"), model: "GPT-2", reference: true, align: "start", lift: -42 },
      { x: dateX(2023, 6), y: 29.6, label: l("30\u202f%", "30%"), model: "GPT-3.5", align: "end" },
      { x: dateX(2025, 2), y: 75.4, label: l("75\u202f%", "75%"), model: "Grok 3", align: "end" },
    ],
    ceilingBand: l("près du maximum", "near the ceiling"),
    expert: { y: 65, label: l("docteurs du domaine 65\u202f%", "PhD experts 65%") },
    sourceIds: ["tk-rein-2023-gpqa-baselines", "tk-xai-2025-grok3", "tk-rein-2023-gpqa", "tk-epoch-benchmarking-hub"],
  },
];

/** Steps: one row per step, the projection row, then the charts (the table compacts to make room). */
export const STEP_PROJECTION = ROWS.length;
export const STEP_CHARTS = STEP_PROJECTION + 1;
export const LAST_STEP = STEP_CHARTS;

export const ALL_SOURCE_IDS = [...new Set(ROWS.flatMap((r) => COLUMNS.flatMap((c) => r.cells[c].sourceIds)))];
export const PROJECTION_SOURCE_IDS = [...new Set(COLUMNS.flatMap((c) => PROJECTION.cells[c].sourceIds))];
