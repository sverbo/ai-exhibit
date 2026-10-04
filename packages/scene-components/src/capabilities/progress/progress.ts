import type { L10n } from "../../learning/shared/ui.tsx";

/**
 * Data for FrontierProgress ("Everything went up", scene 01-progress).
 *
 * Design note. One slide, two rows on one stage, so the room sees the whole
 * story at once and each click adds one series:
 * - Top row, four small LINEAR charts on the same 2019 to 2028 time axis, for
 *   what went into the models and what they can hold: training cost, training
 *   electricity (power x training time), memory (context window, in pages) and reliability
 *   (METR: length of task finished half the time). Linear on purpose: early
 *   points sit on the floor and the curve turns into a wall, which is the
 *   point; every plotted value still has a label (first and last points on
 *   screen, every point in the speaker notes) and a big "x N" growth factor.
 * - Bottom row, one large chart of the hardest tests, as "best score so far"
 *   on a 2023 to 2027 axis: GPQA Diamond against PhD experts (65%), SWE-bench
 *   Verified, Humanity's Last Exam, FrontierMath and ARC-AGI-2, plus the
 *   2025 Math Olympiad gold medal as a marker. Each line is named at its end,
 *   so color is never the only cue; the newest series is drawn on top and
 *   the older ones fade while it is introduced.
 * - Last click: a dashed projection "in about a year" (October 2027) on three
 *   of the top charts, drawn as an arrow leaving the chart, because the
 *   projected values do not fit the measured scale. Memory and benchmarks
 *   are not projected (no published trend; scores are near the ceiling).
 * Labels on screen say how we know: "estimate" (Epoch AI), "published"
 * (developers), "measured" (METR, Epoch AI, ARC Prize), "projection".
 *
 * Why these models: each series uses the models with a published value or a
 * labelled Epoch AI estimate, so the frontier point differs by series (GPT-4.5
 * is the newest model with a cost estimate; Grok 3 the newest with both a power
 * and a training-time estimate, so an energy: GPT-6 Astra has a power estimate,
 * 233 MW, but no training time, so it is left off the electricity chart rather
 * than given an invented duration). The model is named next to the first and
 * last points.
 */

export type Kind = "estimate" | "published" | "measured";

export interface Point {
  /** "YYYY-MM-DD". */
  date: string;
  value: number;
  model: string;
  /** Value as people read it; points without a label are plotted only (the notes give them). */
  label?: L10n;
  /** Where the label goes relative to the point. */
  place?: "above-right" | "below-left";
  /** How the value was obtained, a third line under the model ("110 MW for 90 days"). */
  detail?: L10n;
  /** Label anchor relative to the point (chart units of the 424-wide panel), when `place` collides with the line. */
  offset?: [number, number];
}

/** Decimal year of a "YYYY-MM-DD" date. */
export function yearOf(date: string): number {
  const [y, m = "1", d = "1"] = date.split("-");
  return Number(y) + (Number(m) - 1) / 12 + (Number(d) - 1) / 365;
}

/** Two significant digits: 84,171 -> 84,000; 45.6 -> 46. */
export function roundSig(x: number, digits = 2): number {
  if (x === 0) return 0;
  const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - digits + 1);
  return Math.round(x / p) * p;
}

/* ---------- Top row: four small linear charts ---------- */

/** "In about a year": one year after the talk's date (October 2026). */
export const PROJECTION_DATE = "2027-10-04";

export interface Projection {
  /** Projected value (chart units), always above the chart's top: drawn as an arrow leaving it. */
  value: number;
  label: L10n;
  /** Presenter-only: the arithmetic. */
  basis: L10n;
  sourceIds: string[];
}

export interface Panel {
  id: "cost" | "electricity" | "memory" | "reliability";
  step: number;
  title: L10n;
  /** What is measured, in plain words, under the title. */
  sub: L10n;
  /** How we know, shown as a tag next to the subtitle. */
  kind: Kind;
  /** Chart top (chart units) and its one tick, in words. */
  max: number;
  tick: { value: number; label: L10n };
  points: Point[];
  /** Big "x N" factor, first to last point (the first point's model is named on the chart). */
  growth: { factor: number; label: L10n };
  projection?: Projection;
  /** Shown under the chart when there is no projection, or a familiar comparison. */
  note?: L10n;
  sourceIds: string[];
}

/** One average US home's yearly electricity, kWh (EIA, 2022). */
export const HOME_KWH_PER_YEAR = 10_791;
/** US homes a year of whose electricity equals this energy. */
export const homesFor = (gigawattHours: number) => (gigawattHours * 1e6) / HOME_KWH_PER_YEAR;

/** Energy = power x training time (Epoch AI estimates of both), GWh. */
export const energyGWh = (megawatts: number, hours: number) => (megawatts * hours) / 1000;

/** Pages: 1 token ≈ 0.75 words, 1 page ≈ 500 words (rough rule). */
export const pagesFor = (tokens: number) => (tokens * 0.75) / 500;

/** Published trends used by the projections. */
export const COST_GROWTH_PER_YEAR = 2.4;
export const POWER_GROWTH_PER_YEAR = 2.1;
/** METR, frontier time horizon doubling: about 131 days since 2023 (TH1.1), about 7 months since 2019. */
export const HORIZON_DOUBLING_DAYS_FAST = 131;
export const HORIZON_DOUBLING_DAYS_SLOW = (7 * 365) / 12;

const DAYS_PER_YEAR = 365.25;
export const yearsBetween = (from: string, to: string) => yearOf(to) - yearOf(from);

const COST_POINTS: Point[] = [
  { date: "2019-02-14", value: 4348.44, model: "GPT-2", label: { en: "$4,300" }, place: "above-right" },
  { date: "2020-05-28", value: 2_116_866.24, model: "GPT-3" },
  { date: "2023-03-15", value: 37_334_304.98, model: "GPT-4" },
  { date: "2025-02-27", value: 366_010_627.63, model: "GPT-4.5", label: { en: "$366M" }, place: "below-left" },
];
/**
 * Training electricity: Epoch AI's power draw (MW) x training time (hours),
 * for the models that have both. GPT-2 has neither; GPT-6 Astra has a power
 * (233 MW) but no training time: both are left off.
 */
export const TRAINING_RUNS = [
  { date: "2020-05-28", model: "GPT-3", megawatts: 5.1008, hours: 355.2 },
  { date: "2023-03-15", model: "GPT-4", megawatts: 19.944, hours: 2280 },
  { date: "2025-02-17", model: "Grok 3", megawatts: 109.949, hours: 2160 },
] as const;
const run = (i: number) => TRAINING_RUNS[i]!;
const ENERGY_POINTS: Point[] = [
  {
    date: run(0).date,
    value: energyGWh(run(0).megawatts, run(0).hours),
    model: "GPT-3",
    label: { en: "1.8 GWh" },
    detail: { en: "5 MW for 15 days" },
    place: "above-right",
    // Left of the steep segment to Grok 3, above the flat one to GPT-4.
    offset: [-34, -62],
  },
  { date: run(1).date, value: energyGWh(run(1).megawatts, run(1).hours), model: "GPT-4" },
  {
    date: run(2).date,
    value: energyGWh(run(2).megawatts, run(2).hours),
    model: "Grok 3",
    label: { en: "237 GWh" },
    detail: { en: "110 MW for 90 days" },
    place: "below-left",
    // Left of the steep segment from GPT-4, clear of the line.
    offset: [-44, 6],
  },
];
/** Latest power estimate (GPT-6 Astra, Sep 2026), MW: the projection starts from it. */
export const LATEST_POWER = { date: "2026-09-03", model: "GPT-6 Astra", megawatts: 232.67 };
const MEMORY_POINTS: Point[] = [
  { date: "2019-02-14", value: 1024, model: "GPT-2", label: { en: "1.5 pages" }, place: "above-right" },
  { date: "2020-05-28", value: 2048, model: "GPT-3" },
  { date: "2023-03-14", value: 32_768, model: "GPT-4" },
  { date: "2025-02-19", value: 1_000_000, model: "Grok 3", label: { en: "1,500 pages" }, place: "below-left" },
];
/** METR 50% time horizon, minutes. */
const HORIZON_POINTS: Point[] = [
  { date: "2019-11-05", value: 0.053778, model: "GPT-2", label: { en: "3 seconds" }, place: "above-right" },
  { date: "2023-03-14", value: 3.5, model: "GPT-4" },
  { date: "2025-02-24", value: 60.39, model: "Claude 3.7 Sonnet" },
  { date: "2025-08-07", value: 203.01, model: "GPT-5" },
  { date: "2026-02-05", value: 718.81, model: "Claude Opus 4.6" },
  { date: "2026-04-07", value: 1044.78, model: "Claude Mythos Preview", label: { en: "17 hours" }, place: "below-left" },
];

const last = (pts: Point[]) => pts[pts.length - 1]!;
const growthOf = (pts: Point[]) => last(pts).value / pts[0]!.value;

/** $366M (GPT-4.5, Feb 2025) carried to October 2027 at Epoch AI's 2.4x a year. */
export const projectedCostUSD = () =>
  last(COST_POINTS).value * COST_GROWTH_PER_YEAR ** yearsBetween(last(COST_POINTS).date, PROJECTION_DATE);
/** 233 MW (GPT-6 Astra, Sep 2026) carried to October 2027 at Epoch AI's 2.1x a year. */
export const projectedPowerMW = () =>
  LATEST_POWER.megawatts * POWER_GROWTH_PER_YEAR ** yearsBetween(LATEST_POWER.date, PROJECTION_DATE);
/**
 * That power for the same training time as the latest model with a known one
 * (Grok 3, 2,160 hours, about 90 days): an assumption, stated in the basis.
 */
export const projectedEnergyGWh = () => energyGWh(projectedPowerMW(), run(2).hours);
/** 17 hours (Apr 2026) carried to October 2027 with METR's two doubling times: [slow, fast], minutes. */
export function projectedHorizonMin(): [number, number] {
  const days = yearsBetween(last(HORIZON_POINTS).date, PROJECTION_DATE) * DAYS_PER_YEAR;
  const base = last(HORIZON_POINTS).value;
  return [base * 2 ** (days / HORIZON_DOUBLING_DAYS_SLOW), base * 2 ** (days / HORIZON_DOUBLING_DAYS_FAST)];
}
/** Weeks of 40-hour work. */
export const workWeeks = (minutes: number) => minutes / 60 / 40;

export const STEP_COST = 1;
export const STEP_ELECTRICITY = 2;
export const STEP_MEMORY = 3;
export const STEP_RELIABILITY = 4;

export const PANELS: Panel[] = [
  {
    id: "cost",
    step: STEP_COST,
    title: { en: "Training cost" },
    sub: { en: "final training run, US dollars" },
    kind: "estimate",
    max: 460e6,
    tick: { value: 400e6, label: { en: "$400M" } },
    points: COST_POINTS,
    growth: { factor: growthOf(COST_POINTS), label: { en: "× 84,000" } },
    projection: {
      value: projectedCostUSD(),
      label: { en: "over $1 billion" },
      basis: {
        en: "$366M (GPT-4.5, Feb 2025) × 2.4 a year for 2.6 years ≈ $3.6 billion by October 2027; Epoch AI itself says \"more than a billion dollars by 2027\".",
      },
      sourceIds: ["tk-epoch-2024-training-cost-trend", "tk-epoch-notable-models"],
    },
    sourceIds: ["tk-epoch-notable-models"],
  },
  {
    id: "electricity",
    step: STEP_ELECTRICITY,
    title: { en: "Training electricity" },
    sub: { en: "power × training time, GWh" },
    kind: "estimate",
    max: 290,
    tick: { value: 200, label: { en: "200 GWh" } },
    points: ENERGY_POINTS,
    growth: { factor: growthOf(ENERGY_POINTS), label: { en: "× 130" } },
    projection: {
      value: projectedEnergyGWh(),
      label: { en: "about 1,100 GWh" },
      basis: {
        en: "233 MW (GPT-6 Astra, Sep 2026) × 2.1 a year for 1.1 years ≈ 520 MW in October 2027 (Epoch AI power trend), for the same training time as the latest model with a known one (Grok 3, about 90 days): ≈ 1,100 GWh, a year of about 100,000 US homes.",
      },
      sourceIds: ["tk-epoch-2024-power-trend", "tk-epoch-notable-models", "llm-eia-household-electricity"],
    },
    note: { en: "Grok 3 ≈ 22,000 US homes for a year" },
    sourceIds: ["tk-epoch-notable-models", "llm-eia-household-electricity"],
  },
  {
    id: "memory",
    step: STEP_MEMORY,
    title: { en: "Memory" },
    sub: { en: "text read at once, in pages" },
    kind: "published",
    max: 1_200_000,
    tick: { value: 1_000_000, label: { en: "1,500 pages" } },
    points: MEMORY_POINTS,
    growth: { factor: growthOf(MEMORY_POINTS), label: { en: "× 1,000" } },
    note: { en: "not projected" },
    sourceIds: ["tk-gpt2-context-1024", "tk-gpt3-context-2048", "tk-openai-2023-gpt4-context", "tk-xai-2025-grok3"],
  },
  {
    id: "reliability",
    step: STEP_RELIABILITY,
    title: { en: "Task length" },
    sub: { en: "finished half the time (METR)" },
    kind: "measured",
    max: 1380,
    tick: { value: 1200, label: { en: "20 hours" } },
    points: HORIZON_POINTS,
    growth: { factor: growthOf(HORIZON_POINTS), label: { en: "× 19,000" } },
    projection: {
      value: projectedHorizonMin()[0],
      label: { en: "3 to 8 weeks of work" },
      basis: {
        en: "17 h (Claude Mythos Preview, Apr 2026) carried to October 2027: doubling every 7 months (METR, since 2019) gives about 100 h, every 131 days (METR, since 2023) about 310 h, so 3 to 8 weeks of 40 hours.",
      },
      sourceIds: ["tk-metr-2025-time-horizon-paper", "tk-metr-2026-time-horizon-1-1", "tk-epoch-benchmarks-best-so-far"],
    },
    sourceIds: ["tk-epoch-benchmarks-best-so-far", "tk-metr-2026-time-horizon-1-1"],
  },
];

/* ---------- Bottom row: the hardest tests, best score so far ---------- */

export interface Series {
  id: "gpqa" | "swe" | "hle" | "frontiermath" | "arc";
  step: number;
  name: string;
  /** One line a lay audience understands. */
  what: L10n;
  /** Best score so far (%), at each new record. */
  points: Point[];
  /** CSS custom property for the line. */
  color: string;
  sourceIds: string[];
}

export const STEP_GPQA = 5;
export const STEP_SWE = 6;
export const STEP_HARD = 7;
export const STEP_ARC = 8;
export const STEP_PROJECTION = 9;
export const LAST_STEP = STEP_PROJECTION;

const pt = (date: string, value: number, model: string): Point => ({ date, value, model });

export const SERIES: Series[] = [
  {
    id: "gpqa",
    step: STEP_GPQA,
    name: "GPQA Diamond",
    what: { en: "PhD-level science questions" },
    points: [
      pt("2023-03-14", 35.7, "GPT-4"),
      pt("2024-06-20", 54.0, "Claude 3.5 Sonnet"),
      pt("2024-12-17", 76.8, "o1"),
      pt("2025-03-25", 83.8, "Gemini 2.5 Pro"),
      pt("2025-11-18", 92.6, "Gemini 3 Pro"),
      pt("2026-09-03", 95.8, "GPT-6 Astra"),
    ],
    color: "var(--color-accent)",
    sourceIds: ["tk-epoch-benchmarks-best-so-far", "tk-rein-2023-gpqa"],
  },
  {
    id: "swe",
    step: STEP_SWE,
    name: "SWE-bench Verified",
    what: { en: "real software bugs to fix" },
    points: [
      pt("2024-11-20", 31.0, "GPT-4o"),
      pt("2025-02-24", 61.0, "Claude 3.7 Sonnet"),
      pt("2025-05-22", 70.7, "Claude Opus 4"),
      pt("2025-11-24", 76.7, "Claude Opus 4.5"),
      pt("2026-04-16", 83.5, "Claude Opus 4.7"),
    ],
    color: "var(--color-accent-2)",
    sourceIds: ["tk-epoch-benchmarks-best-so-far", "tk-swebench-verified"],
  },
  {
    id: "hle",
    step: STEP_HARD,
    name: "Humanity's Last Exam",
    what: { en: "expert questions written to stump AI" },
    points: [
      pt("2024-09-24", 4.6, "Gemini 1.5 Pro"),
      pt("2024-12-17", 8.0, "o1"),
      pt("2025-03-25", 18.2, "Gemini 2.5 Pro"),
      pt("2025-08-07", 25.3, "GPT-5"),
      pt("2025-11-18", 37.5, "Gemini 3 Pro"),
      pt("2026-02-19", 46.4, "Gemini 3.1 Pro"),
      pt("2026-09-03", 54.8, "GPT-6 Astra"),
    ],
    color: "var(--color-danger)",
    sourceIds: ["tk-epoch-benchmarks-best-so-far", "tk-phan-2025-hle"],
  },
  {
    id: "frontiermath",
    step: STEP_HARD,
    name: "FrontierMath",
    what: { en: "research maths, hours for an expert" },
    points: [
      pt("2024-04-09", 0.7, "GPT-4 Turbo"),
      pt("2024-12-17", 14.7, "o1"),
      pt("2025-04-16", 36.1, "o4-mini"),
      pt("2025-08-07", 55.4, "GPT-5"),
      pt("2025-12-11", 74.0, "GPT-5.2 Pro"),
      pt("2026-04-23", 87.7, "GPT-5.5 Pro"),
      pt("2026-09-03", 93.7, "GPT-6 Astra"),
    ],
    color: "var(--color-ok)",
    sourceIds: ["tk-epoch-benchmarks-best-so-far", "tk-glazer-2024-frontiermath"],
  },
  {
    id: "arc",
    step: STEP_ARC,
    name: "ARC-AGI-2",
    what: { en: "puzzles easy for people" },
    points: [
      pt("2024-07-18", 0, "GPT-4o mini"),
      pt("2025-01-31", 3.0, "o3-mini"),
      pt("2025-07-09", 16.0, "Grok 4"),
      pt("2025-11-18", 31.1, "Gemini 3 Pro"),
      pt("2025-12-11", 54.2, "GPT-5.2 Pro"),
      pt("2026-02-12", 84.6, "Gemini 3 Deep Think"),
      pt("2026-09-03", 95.0, "GPT-6 Astra"),
    ],
    color: "var(--color-text)",
    sourceIds: ["tk-epoch-benchmarks-best-so-far", "tk-arcprize-2025-arc-agi-2"],
  },
];

/** PhD experts on GPQA (Rein et al.). */
export const GPQA_EXPERTS = { value: 65, label: { en: "PhD experts on GPQA: 65%" }, sourceIds: ["tk-rein-2023-gpqa"] };

/** The 2025 International Mathematical Olympiad: officially graded gold (Google DeepMind). */
export const IMO_GOLD = {
  date: "2025-07-21",
  step: STEP_ARC,
  title: { en: "Maths Olympiad: gold medal" },
  sub: { en: "July 2025, graded by the IMO" },
  sourceIds: ["tk-deepmind-2025-imo-gold"],
};

/** Percent as people read it: 95.8 -> "96%", 0.7 -> "1%". */
export const pct = (v: number) => `${Math.round(v)}%`;

/* ---------- Sources ---------- */

const uniq = (ids: string[]) => [...new Set(ids)];

export const ALL_SOURCE_IDS = uniq([
  ...PANELS.flatMap((p) => [...p.sourceIds, ...(p.projection?.sourceIds ?? [])]),
  ...SERIES.flatMap((s) => s.sourceIds),
  ...GPQA_EXPERTS.sourceIds,
  ...IMO_GOLD.sourceIds,
]);

/** The few sources named in the slide's footer (the rest are in the notes and the scene's sourceIds). */
export const FOOTER_SOURCE_IDS = [
  "tk-epoch-notable-models",
  "tk-epoch-benchmarks-best-so-far",
  "tk-metr-2026-time-horizon-1-1",
  "tk-deepmind-2025-imo-gold",
];

/** Shared time axes. */
export const TOP_X = { from: 2018.7, to: 2028.1, ticks: [2019, 2023, 2027] };
export const BENCH_X = { from: 2023.0, to: 2027.0, ticks: [2023, 2024, 2025, 2026, 2027] };
