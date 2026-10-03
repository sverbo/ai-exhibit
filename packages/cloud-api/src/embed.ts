// Sentence embeddings through Hugging Face Inference (hf-inference provider).
//
// The precomputed vocabulary (content/assets/embeddings/canonical.json) holds
// the mean-pooled, L2-normalised output of paraphrase-multilingual-MiniLM-L12-v2
// for texts wrapped in the template (": {text}"). This endpoint returns the
// same for a text the caller has already wrapped, so the caller then centres
// it on the vocabulary mean (locateQuery) like a stored vector.
//
// Differences that remain: the vocabulary was built with the 8-bit ONNX export
// (Xenova/paraphrase-multilingual-MiniLM-L12-v2), Hugging Face runs the float
// weights. Measured on the 433 vocabulary items after centring: median cosine
// 0.9985 with the stored vectors, 427 above 0.99, every item still its own
// nearest neighbour.

/** Original sentence-transformers repo; the vocabulary was built with its ONNX export. */
export const EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";
export const EMBED_URL = `https://router.huggingface.co/hf-inference/models/${EMBED_MODEL}/pipeline/feature-extraction`;

/** L2-normalised copy; the hf-inference provider ignores `normalize: true`. */
export function l2normalize(v: readonly number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n);
  return n > 0 ? v.map((x) => x / n) : [...v];
}

function isNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "number" && Number.isFinite(x));
}

/**
 * One sentence vector per input from the provider's answer. sentence-transformers
 * models answer pooled vectors; a token-level answer ([tokens][dims]) is mean-pooled.
 */
export function toSentenceVectors(body: unknown, count: number): number[][] | null {
  if (!Array.isArray(body) || body.length !== count) return null;
  const out: number[][] = [];
  for (const item of body) {
    if (isNumberArray(item)) {
      out.push(l2normalize(item));
    } else if (Array.isArray(item) && item.length > 0 && item.every(isNumberArray)) {
      const rows = item as number[][];
      const dims = rows[0]!.length;
      const mean = new Array<number>(dims).fill(0);
      for (const r of rows) for (let i = 0; i < dims; i++) mean[i]! += r[i]! / rows.length;
      out.push(l2normalize(mean));
    } else {
      return null;
    }
  }
  const dims = out[0]?.length;
  return out.every((v) => v.length === dims) ? out : null;
}

/** Six decimals are far below the int8 precision of the stored vocabulary. */
export function roundVector(v: readonly number[]): number[] {
  return v.map((x) => Math.round(x * 1e6) / 1e6);
}
