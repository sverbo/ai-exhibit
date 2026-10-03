/**
 * Formats of the recorded model outputs in content/assets/recordings.
 *
 * next-token.json was recorded with the former local models (the script
 * that ran them locally has been removed); the llm scenes copy a few of its
 * numbers and the tests check them against the file. tokenizations.json and
 * cloud.json are what Simulation replays.
 */
import type { LanguageModelId } from "./types.ts";

export type RecordingLocale = import("@ai-exhibit/presentation-core").Locale;

/** Compact candidate: rounded numbers keep the file small. */
export interface RecordedCandidate {
  id: number;
  text: string;
  /** Raw probability (temperature 1), 4 significant decimals. */
  p: number;
  logit: number;
}

export interface RecordedStep {
  /** Top-k candidates for the next token after the prompt plus previous steps. */
  candidates: RecordedCandidate[];
  /** Entropy of the full distribution, bits. */
  entropyBits: number;
}

/** A prompt run greedily for a few steps: step 0 is the distribution right after the prompt. */
export interface RecordedPrompt {
  key: string;
  locale: RecordingLocale;
  model: LanguageModelId;
  text: string;
  inputIds: number[];
  steps: RecordedStep[];
}

export interface RecordedCompletion {
  key: string;
  locale: RecordingLocale;
  model: LanguageModelId;
  /** The user-facing prompt (before any chat template). */
  prompt: string;
  /** "continuation" for the base model, "chat" when the chat template was applied. */
  format: "continuation" | "chat";
  /** Exact text the model read, for chat prompts (the rendered chat template). */
  modelInput?: string;
  /** The model's end token, for chat prompts (generation stops when it is written). */
  endTag?: string;
  text: string;
  tokens: string[];
  settings: { temperature: number; topK: number; topP: number; seed: number; maxNewTokens: number; greedy: boolean };
  stopReason: string;
}

export interface RecordedModel {
  artifactId: LanguageModelId;
  repo: string;
  revision: string;
  dtype: string;
  backend: string;
}

export interface NextTokenRecordingFile {
  version: 1;
  generatedAt: string;
  generator: string;
  models: RecordedModel[];
  topK: number;
  prompts: RecordedPrompt[];
  completions: RecordedCompletion[];
}

export function normalizePrompt(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/* ------------------------------------------------------------------------- */
/* content/assets/recordings/tokenizations.json: tokenizer fallback.          */

export interface RecordedToken {
  id: number;
  start: number;
  end: number;
  partial?: boolean;
  bytes?: string;
}

export interface RecordedTokenization {
  tokenizerId: string;
  locale: RecordingLocale;
  text: string;
  tokens: RecordedToken[];
}

export interface TokenizationRecordingFile {
  version: 1;
  generatedAt: string;
  generator: string;
  tokenizers: { artifactId: string; repo: string; revision: string }[];
  items: RecordedTokenization[];
}

export function findRecordedTokenization(
  file: TokenizationRecordingFile | null | undefined,
  tokenizerId: string,
  text: string,
): RecordedTokenization | undefined {
  return file?.items.find((i) => i.tokenizerId === tokenizerId && i.text === text);
}

/* ------------------------------------------------------------------------- */
/* content/assets/recordings/cloud.json: cloud models on the preset prompts.  */

export interface CloudRecordedCompletion {
  kind: "base" | "chat";
  locale: RecordingLocale;
  /** The user-facing prompt or question. */
  prompt: string;
  /** Chat only: the hidden system prompt that was sent. */
  system?: string;
  /** Chat only: the text the model read (its chat template, rendered). */
  raw?: string;
  endTag?: string;
  text: string;
  finishReason: string | null;
  /** Chat only: probabilities of the first answer tokens and their top-5 alternatives. */
  firstTokens?: { token: string; p: number; top: { token: string; p: number }[] }[];
  /** Prompt tokens the provider counted (checks the rendered template). */
  promptTokens?: number;
}

/** One-token predictions on a preset prompt, run greedily: what the bars show in Simulation. */
export interface CloudRecordedNext {
  locale: RecordingLocale;
  prompt: string;
  /** Step 0 follows the prompt; each step's `token` is the most likely one, appended before the next step. */
  steps: { token: string; candidates: { text: string; p: number }[] }[];
}

export interface CloudRecordingFile {
  version: 1;
  generatedAt: string;
  generator: string;
  base: { model: string; provider: string };
  chat: { model: string; provider: string };
  /** Model that gave the next-token probabilities (raw text, no chat format). */
  next?: { model: string; provider: string };
  completions: CloudRecordedCompletion[];
  nextRuns?: CloudRecordedNext[];
}

export function findCloudNext(file: CloudRecordingFile | null | undefined, prompt: string): CloudRecordedNext | undefined {
  const n = normalizePrompt(prompt);
  return file?.nextRuns?.find((r) => normalizePrompt(r.prompt) === n);
}

export function findCloudRecording(
  file: CloudRecordingFile | null | undefined,
  kind: "base" | "chat",
  prompt: string,
): CloudRecordedCompletion | undefined {
  const n = normalizePrompt(prompt);
  return file?.completions.find((c) => c.kind === kind && normalizePrompt(c.prompt) === n);
}
