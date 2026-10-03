import { base64ToBytes, dequantizeInt8, locateByNeighbours, topK, type Neighbour, type Vector } from "./geometry.ts";

/**
 * On-disk format of content/assets/embeddings/canonical.json, built from
 * content/assets/embeddings/vocabulary.ts by a script that ran the model
 * locally (since removed: the file is now frozen). Columnar arrays keep it compact.
 */
export interface CanonicalEmbeddingsJson {
  format: "ai-exhibit-embeddings/1";
  createdAt: string;
  model: {
    artifactId: string;
    repo: string;
    revision: string;
    dtype: string;
    pooling: "mean";
    normalized: true;
    /** How each text is wrapped before embedding, "{text}" is replaced. */
    template: string;
  };
  /** Stored vectors are normalize(embedding - mean); live queries must match. */
  centering: { mean: number[] };
  /** sha256 of the flattened vocabulary, to detect a stale build. */
  vocabularyHash: string;
  count: number;
  dims: number;
  clusters: { id: string; label: { fr: string; en: string } }[];
  labels: string[];
  lang: ("fr" | "en" | "both")[];
  /** Index into `clusters`. */
  cluster: number[];
  /** Index of the translation partner, or -1. */
  pair: number[];
  /** Flat coordinates in [-1, 1], rounded. umap2d/pca2d: 2 per item, umap3d/pca3d: 3 per item. */
  projections: { umap2d: number[]; umap3d: number[]; pca2d: number[]; pca3d: number[] };
  projectionParams: Record<string, unknown>;
  /** Top-k neighbours in the full space: flat indices and similarities, `neighbourK` per item. */
  neighbourK: number;
  neighbours: number[];
  neighbourSims: number[];
  /** Pairs close on the umap2d map but far apart in the full space. */
  distortions: { a: number; b: number; mapDistance: number; similarity: number; trueRank: number }[];
  vectors: { encoding: "int8-base64"; scales: number[]; data: string };
}

export function applyTemplate(template: string, text: string): string {
  return template.replace("{text}", text.trim());
}

/** Subtracts the vocabulary mean and L2-normalises, as the build script does. */
export function centerAndNormalize(v: Vector, mean: Vector): Float32Array {
  const out = new Float32Array(v.length);
  let n = 0;
  for (let i = 0; i < v.length; i++) {
    const x = v[i]! - (mean[i] ?? 0);
    out[i] = x;
    n += x * x;
  }
  n = Math.sqrt(n);
  if (n > 0) for (let i = 0; i < out.length; i++) out[i]! /= n;
  return out;
}

export type ProjectionName = keyof CanonicalEmbeddingsJson["projections"];

export interface EmbeddingItem {
  index: number;
  text: string;
  lang: "fr" | "en" | "both";
  cluster: number;
  pair: number;
}

/** Decoded, ready-to-use form of the canonical file. */
export interface EmbeddingSpace {
  json: CanonicalEmbeddingsJson;
  items: EmbeddingItem[];
  vectors: Float32Array[];
  /** Per item coordinates for each projection. */
  coords: Record<ProjectionName, number[][]>;
  neighboursOf(index: number): Neighbour[];
}

function chunk(flat: readonly number[], size: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < flat.length; i += size) out.push(flat.slice(i, i + size));
  return out;
}

export function decodeCanonical(json: CanonicalEmbeddingsJson): EmbeddingSpace {
  const bytes = base64ToBytes(json.vectors.data);
  const vectors = dequantizeInt8(new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length), json.vectors.scales, json.dims);
  const items: EmbeddingItem[] = json.labels.map((text, index) => ({
    index,
    text,
    lang: json.lang[index]!,
    cluster: json.cluster[index]!,
    pair: json.pair[index]!,
  }));
  const p = json.projections;
  const coords = {
    umap2d: chunk(p.umap2d, 2),
    umap3d: chunk(p.umap3d, 3),
    pca2d: chunk(p.pca2d, 2),
    pca3d: chunk(p.pca3d, 3),
  };
  const k = json.neighbourK;
  return {
    json,
    items,
    vectors,
    coords,
    neighboursOf(index) {
      const out: Neighbour[] = [];
      for (let i = 0; i < k; i++) {
        out.push({ index: json.neighbours[index * k + i]!, similarity: json.neighbourSims[index * k + i]! });
      }
      return out;
    },
  };
}

export interface LocatedQuery {
  /** Neighbours in the full space, best first. */
  neighbours: Neighbour[];
  /** Approximate positions on the maps, from the neighbours (not a true projection). */
  umap2d: number[];
  umap3d: number[];
}

/** The text actually sent to the model for a typed query. */
export function queryText(space: EmbeddingSpace, text: string): string {
  return applyTemplate(space.json.model.template, text);
}

/**
 * Places a live model output (`embed(queryText(...))`) in the precomputed
 * space: centres it like the vocabulary, finds its true neighbours, and
 * estimates where it would sit on the maps.
 */
export function locateQuery(space: EmbeddingSpace, rawEmbedding: Vector, k = 10): LocatedQuery {
  const v = centerAndNormalize(rawEmbedding, space.json.centering.mean);
  const neighbours = topK(v, space.vectors, k);
  return {
    neighbours,
    umap2d: locateByNeighbours(neighbours, space.coords.umap2d),
    umap3d: locateByNeighbours(neighbours, space.coords.umap3d),
  };
}

/** Same shape for a vocabulary entry, from precomputed data only (no model). */
export function locateVocabularyItem(space: EmbeddingSpace, index: number, k = 10): LocatedQuery {
  const self: Neighbour = { index, similarity: 1 };
  return {
    neighbours: [self, ...space.neighboursOf(index)].slice(0, k),
    umap2d: [...space.coords.umap2d[index]!],
    umap3d: [...space.coords.umap3d[index]!],
  };
}
