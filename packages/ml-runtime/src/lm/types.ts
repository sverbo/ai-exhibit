/**
 * Shared language-model types: the model IDs of the recordings, chat messages
 * and token candidates.
 */

/** Artifact IDs of the causal models (spec §5, plus the French-capable Qwen pair). */
export type LanguageModelId =
  | "smollm2-135m"
  | "smollm2-135m-instruct"
  | "qwen2.5-0.5b"
  | "qwen2.5-0.5b-instruct"
  | "gpt2"
  | "amd-olmo-1b"
  | "amd-olmo-1b-sft-dpo";
/** Any artifact that ships a tokenizer: the models above, or `tokenizer-gpt2`. */
export type TokenizerId = LanguageModelId | "tokenizer-gpt2";

export type LmBackend = "webgpu" | "wasm" | "node-cpu";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface TokenCandidate {
  id: number;
  /** Decoded text of the token alone (may contain a leading space). */
  text: string;
  /** Probability under the raw model distribution (temperature 1, no filter). */
  probability: number;
  logit: number;
  /** Probability after temperature/top-k/top-p, 0 when filtered out. */
  adjustedProbability: number;
}

export interface Distribution {
  modelId: LanguageModelId;
  /** Token IDs the model read (after chat formatting). */
  inputIds: number[];
  candidates: TokenCandidate[];
  /** Probability mass not covered by `candidates` (raw distribution). */
  otherProbability: number;
  /** Entropy of the raw distribution, in bits. */
  entropyBits: number;
  backend: LmBackend;
  /** Inference time; 0 when served from the worker's logits cache. */
  ms: number;
}

