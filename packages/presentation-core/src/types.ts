/**
 * Content model for presentations. Scenes are structured data, never arbitrary
 * page markup: this is what makes speaker notes, translations, editions and
 * automated review possible.
 */

import type { L10n, Locale } from "./locales.ts";

export type { L10n, Locale };
export { LOCALES } from "./locales.ts";

export type ChapterId =
  | "00" | "01" | "02" | "03" | "04" | "05"
  | "06" | "07" | "08" | "09" | "10" | "11";

/** Evidence badges (see the content guide), plus "none" for purely explanatory scenes. */
export type EvidenceLevel =
  | "observed"
  | "evaluation"
  | "projection"
  | "thought-experiment"
  | "contested"
  | "none";

/** A: deterministic/offline, B: local compute (in-browser training, no model download), C: live/networked. */
export type RuntimeClass = "A" | "B" | "C";

export type InteractionKind = "none" | "presenter" | "network";

export interface ChapterDefinition {
  id: ChapterId;
  title: L10n;
  /** One-line summary of what the chapter does in the story. */
  summary: L10n;
}

export interface CardItem {
  title: L10n;
  body?: L10n;
  /** Short emoji or symbol; purely decorative, never the only carrier of meaning. */
  icon?: string;
  evidence?: EvidenceLevel;
  sourceIds?: string[];
}

export interface FlowNode {
  id: string;
  label: L10n;
  detail?: L10n;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: L10n;
}

export interface CompareColumn {
  title: L10n;
  items: L10n[];
}

/**
 * What appears on the projector. Generic layouts cover explanatory scenes;
 * `component` points to a registered interactive or bespoke React component.
 * For `cards`, `list` and `flow`, each item is one reveal step unless the scene
 * sets `steps` explicitly.
 */
export type SceneVisual =
  | { layout: "title"; kicker?: L10n; heading: L10n; sub?: L10n }
  | { layout: "question"; question: L10n; hint?: L10n }
  | { layout: "statement"; text: L10n; attribution?: L10n }
  | { layout: "cards"; heading?: L10n; cards: CardItem[] }
  | { layout: "list"; heading?: L10n; items: L10n[] }
  | { layout: "flow"; heading?: L10n; nodes: FlowNode[]; edges?: FlowEdge[]; loop?: boolean }
  | { layout: "compare"; heading?: L10n; left: CompareColumn; right: CompareColumn }
  | { layout: "component"; component: string; props?: Record<string, unknown> }
  | { layout: "placeholder"; description: L10n };

export type FallbackSpec =
  | { kind: "none"; reason?: string }
  /** A recorded data file the component replays when `mode === "fallback"`. */
  | { kind: "recording"; asset: string }
  /** The component's own deterministic mode needs no extra data. */
  | { kind: "deterministic" }
  /** A static description of what the presenter shows/says instead. */
  | { kind: "static"; note: L10n };

export interface SceneDefinition {
  /** Stable identifier: `${chapter}-${kebab-slug}`, e.g. "03-probability-bars". */
  id: string;
  /**
   * Short stable code, 4 or 5 lowercase letters or digits derived from the
   * topic ("tokn", "race"). Personal presenter configurations refer to scenes
   * by code only, so a code is never changed and never reused: a deleted
   * scene's code moves to `PresentationDefinition.retiredSceneCodes`.
   */
  code: string;
  chapter: ChapterId;
  /** Position in the talk, e.g. "3.2". */
  number: string;
  /** Internal/editor title; may be hidden on screen. */
  title: L10n;
  /** One sentence: what the audience should understand. */
  objective: L10n;
  /** The single idea to retain, spoken at the end of the scene. */
  takeaway: L10n;
  visual: SceneVisual;
  /** Number of reveal steps. Defaults to the item count for cards/list/flow, else 0. */
  steps?: number;
  interaction: InteractionKind;
  /** Markdown. What to say, including questions to ask the room. */
  speakerNotes: L10n;
  transitionIn: L10n;
  transitionOut: L10n;
  evidenceLevel: EvidenceLevel;
  /** IDs into the source registry. */
  sourceIds: string[];
  runtimeClass: RuntimeClass;
  /** Logical artifact IDs from the artifact manifest. */
  artifacts: string[];
  fallback: FallbackSpec;
  durationSec: number;
  /** Short editions may skip optional scenes. */
  optional: boolean;
  /**
   * The rare scene that knowingly reaches the internet (an embedded video):
   * the hosts it calls and why. It must still work offline, with a text
   * fallback; `pnpm rehearse` blocks these hosts like any other but does not
   * report them while this scene is on screen.
   */
  online?: { hosts: string[]; why: string };
  /** English notes for translators/adapters. */
  localizationNotes?: string;
  /** Unverified claims or missing work, in English. Surfaced in Presenter View. */
  todo?: string[];
}

export type SourceKind =
  | "paper"
  | "report"
  | "news"
  | "regulation"
  | "dataset"
  | "documentation"
  | "book"
  | "other";

export interface SourceRecord {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  authors?: string[];
  /** Publication date, ISO (YYYY, YYYY-MM or YYYY-MM-DD). */
  date?: string;
  /** When the source was last checked, ISO date. */
  retrieved?: string;
  kind: SourceKind;
  /** English: what we use this source to support. */
  claim: string;
  evidence: EvidenceLevel;
  /**
   * "verified": a person or agent opened the source and confirmed the claim.
   * "needs-verification": plausible but not yet checked; shown as such.
   */
  verification: "verified" | "needs-verification";
  notes?: string;
}

export type ArtifactKind =
  | "tokenizer"
  | "language-model"
  | "embedding-model"
  | "embeddings"
  | "dataset"
  | "media"
  | "runtime";

export interface ArtifactFile {
  /** Path relative to the artifact root, e.g. "onnx/model_q4f16.onnx". */
  path: string;
  size: number;
  /** Hex sha256 of the file contents. */
  sha256: string;
}

export type ArtifactSource =
  | { type: "huggingface"; repo: string; revision: string; files: ArtifactFile[] }
  /** Already in the repo under content/assets; nothing to download. */
  | { type: "bundled"; path: string };

export interface ArtifactSpec {
  /** Logical ID referenced by scenes and used as the URL/cache directory name. */
  id: string;
  kind: ArtifactKind;
  title: string;
  version: string;
  license: string;
  source: ArtifactSource;
  runtime: {
    target: "browser" | "node" | "none";
    backends?: ("webgpu" | "wasm")[];
    /** Rough peak memory needed to run it, for the readiness screen. */
    approxRamMb?: number;
  };
  /** What the scene does when the artifact is missing. */
  fallback: string;
  optional?: boolean;
  /** Only needed when the talk is given in these locales; omitted means every locale. */
  locales?: Locale[];
}

/**
 * A cut of the talk: which scenes, for how long. Locale independent: the
 * language is chosen at launch and lives in the session (docs/specs/2026-10-03-locales.md).
 */
export interface EditionDefinition {
  id: string;
  title: L10n;
  /** Target talk length in minutes, inclusive range. */
  targetMinutes: [number, number];
  /** "full" keeps every scene; "short" drops scenes marked optional. */
  cut: "full" | "short";
  /** Explicit additions/removals on top of the cut, by scene ID. */
  include?: string[];
  exclude?: string[];
}

export interface PresentationDefinition {
  id: string;
  title: L10n;
  chapters: ChapterDefinition[];
  /** In narrative order. */
  scenes: SceneDefinition[];
  /**
   * Scenes set aside: kept for later editions, never part of any edition.
   * Listed in /overview so they stay easy to bring back.
   */
  parkedScenes?: SceneDefinition[];
  /** Chapters the parked scenes refer to. */
  parkedChapters?: ChapterDefinition[];
  /** Codes of deleted scenes: never given to another scene. */
  retiredSceneCodes?: string[];
  editions: EditionDefinition[];
  /**
   * Locales the launcher offers for this talk, default first. Every text must
   * exist in them (verify:content fails otherwise); other LOCALES are drafts.
   */
  locales: Locale[];
  artifacts: ArtifactSpec[];
  sources: SourceRecord[];
}

/** A presentation resolved for one edition: ordered scenes only. */
export interface ResolvedEdition {
  presentation: PresentationDefinition;
  edition: EditionDefinition;
  scenes: SceneDefinition[];
}
