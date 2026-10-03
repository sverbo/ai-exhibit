import type { Camera } from "./view.ts";
import { type EmbeddingSpace, fuzzyFind, type LocatedQuery, locateVocabularyItem } from "@ai-exhibit/ml-runtime/embeddings";

/** How many neighbours the explorer publishes and lists. */
export const SHOWN_NEIGHBOURS = 6;

export interface QueryResult {
  /** What the presenter typed. */
  text: string;
  /**
   * "model": embedded live by the model.
   * "vocabulary": matched to a prepared word, precomputed neighbours (fallback).
   * "unknown": fallback found no prepared word close enough.
   * "map": the presenter clicked a word on the map (precomputed neighbours).
   */
  source: "model" | "vocabulary" | "unknown" | "map";
  /** Prepared word used in vocabulary mode, when it differs from the typed text. */
  matched?: string;
  neighbours: { index: number; similarity: number }[];
  /** Approximate position on the 2D map, [-1, 1]; null when unknown. */
  position: [number, number] | null;
  position3d: [number, number, number] | null;
  /** Live inference time, for the presenter. */
  ms?: number;
}

/** Shared scene state, published by the controller, rendered by every role. */
export interface ExplorerState {
  view?: "2d" | "3d";
  /** Cluster index highlighted by the presenter, or null. */
  focus?: number | null;
  query?: QueryResult | null;
  /** Shown on the display while the controller waits for the model. */
  busy?: boolean;
  /** Training mode: bumped by the presenter to replay the animation everywhere. */
  replay?: number;
  /** 2D map pan and zoom (data coordinates); null or absent is the whole map. */
  camera?: Camera | null;
  /** 3D cloud rotation and zoom once the presenter has moved it. */
  camera3d?: Camera3D | null;
  /** Label every word on the map (presenter's "Show all words" toggle). */
  showAll?: boolean;
  /** Word clicked on the map (cloud and training modes), or null. */
  selected?: number | null;
}

export interface Camera3D {
  angle: number;
  tilt: number;
  zoom: number;
}

/** A word picked on the map, with its precomputed neighbours. */
export function selectWord(space: EmbeddingSpace, index: number): QueryResult {
  return fromLocated(space.items[index]!.text, locateVocabularyItem(space, index, SHOWN_NEIGHBOURS), "map");
}

function round(x: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}

export function fromLocated(text: string, located: LocatedQuery, source: QueryResult["source"], extra: Partial<QueryResult> = {}): QueryResult {
  const p2 = located.umap2d;
  const p3 = located.umap3d;
  return {
    text,
    source,
    neighbours: located.neighbours.slice(0, SHOWN_NEIGHBOURS).map((n) => ({ index: n.index, similarity: round(n.similarity, 3) })),
    position: p2.length === 2 ? [round(p2[0]!), round(p2[1]!)] : null,
    position3d: p3.length === 3 ? [round(p3[0]!), round(p3[1]!), round(p3[2]!)] : null,
    ...extra,
  };
}

/** Fallback search: never touches the model, only precomputed neighbours. */
export function searchVocabulary(space: EmbeddingSpace, text: string): QueryResult {
  const match = fuzzyFind(text, space.items.map((i) => i.text));
  if (!match) return { text, source: "unknown", neighbours: [], position: null, position3d: null };
  const label = space.items[match.index]!.text;
  return fromLocated(text, locateVocabularyItem(space, match.index, SHOWN_NEIGHBOURS), "vocabulary", {
    matched: match.kind === "exact" ? undefined : label,
  });
}
