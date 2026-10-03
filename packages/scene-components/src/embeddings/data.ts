import { type CanonicalEmbeddingsJson, decodeCanonical, type EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import { useEffect, useState } from "react";

/**
 * The precomputed vocabulary (artifact `embeddings-canonical`) ships with the
 * app as a lazily loaded chunk, so it works without the runtime and costs
 * nothing until an embedding scene is shown. Decoded once per page.
 */
let cached: EmbeddingSpace | null = null;
let pending: Promise<EmbeddingSpace> | null = null;

export function loadEmbeddingSpace(): Promise<EmbeddingSpace> {
  if (cached) return Promise.resolve(cached);
  pending ??= import("@ai-exhibit/content/assets/embeddings/canonical.json")
    .then((mod) => {
      cached = decodeCanonical((mod as { default: unknown }).default as CanonicalEmbeddingsJson);
      return cached;
    })
    .catch((err: unknown) => {
      pending = null;
      throw err;
    });
  return pending;
}

export type SpaceState = { space: EmbeddingSpace; error: null } | { space: null; error: string | null };

export function useEmbeddingSpace(): SpaceState {
  const [state, setState] = useState<SpaceState>(() => (cached ? { space: cached, error: null } : { space: null, error: null }));
  useEffect(() => {
    if (state.space) return;
    let alive = true;
    loadEmbeddingSpace().then(
      (space) => alive && setState({ space, error: null }),
      (err: unknown) => alive && setState({ space: null, error: err instanceof Error ? err.message : String(err) }),
    );
    return () => {
      alive = false;
    };
  }, [state.space]);
  return state;
}

/** Theme colour tokens with clearly different hues, used as the base of the group palette. */
const BASE_TOKENS = [
  "--color-accent",
  "--color-accent-2",
  "--color-evidence-projection",
  "--color-danger",
  "--color-ok",
  "--color-evidence-thought-experiment",
] as const;

/**
 * One colour per group, built only from theme tokens so it follows the light
 * and dark themes: the six base hues, then blends of neighbouring hues, then
 * hues blended toward the text colour. Group names on the map carry the
 * meaning; colour is never the only signal.
 */
export function clusterColor(index: number, count: number): string {
  const n = BASE_TOKENS.length;
  const step = count % 7 === 0 ? 5 : 7;
  const slot = (index * step) % Math.max(count, 1);
  const v = (k: number) => `var(${BASE_TOKENS[k % n]})`;
  if (slot < n) return v(slot);
  if (slot < 2 * n) return `color-mix(in oklch, ${v(slot - n)} 50%, ${v(slot - n + 1)})`;
  return `color-mix(in oklch, ${v(slot - 2 * n)} 55%, var(--color-text))`;
}
