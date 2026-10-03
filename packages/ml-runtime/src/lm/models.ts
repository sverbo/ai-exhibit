/**
 * What the runtime needs to know about each causal model, beyond its files.
 * Pure data: safe to import on the main thread.
 */
import type { LanguageModelId } from "./types.ts";

export type ModelFamily = "smollm2" | "qwen2.5" | "gpt2" | "amd-olmo";
export type ModelRole = "base" | "instruct";

export interface LanguageModelInfo {
  id: LanguageModelId;
  family: ModelFamily;
  role: ModelRole;
  /** Name shown to the audience. */
  label: string;
  /** Parameters, for captions ("135 millions"). */
  parameters: number;
  /**
   * Prepend the BOS token to raw-text prompts. SmolLM2 base was trained on
   * documents that start after `<|endoftext|>`; without it predictions degrade
   * badly. Qwen2.5 uses no BOS.
   */
  prependBos: boolean;
  /** Width of one embedding row. */
  hiddenSize: number;
  vocabSize: number;
  /** ONNX file stem when it is not `model` (GPT-2 ships `decoder_model_merged`). */
  modelFileName?: string;
  /** Year the model was released, for captions ("GPT-2, 2019"). */
  year?: number;
}

export const LANGUAGE_MODELS: Record<LanguageModelId, LanguageModelInfo> = {
  "smollm2-135m": {
    id: "smollm2-135m",
    family: "smollm2",
    role: "base",
    label: "SmolLM2-135M",
    parameters: 135e6,
    prependBos: true,
    hiddenSize: 576,
    vocabSize: 49152,
  },
  "smollm2-135m-instruct": {
    id: "smollm2-135m-instruct",
    family: "smollm2",
    role: "instruct",
    label: "SmolLM2-135M-Instruct",
    parameters: 135e6,
    prependBos: false,
    hiddenSize: 576,
    vocabSize: 49152,
  },
  "qwen2.5-0.5b": {
    id: "qwen2.5-0.5b",
    family: "qwen2.5",
    role: "base",
    label: "Qwen2.5-0.5B",
    parameters: 494e6,
    prependBos: false,
    hiddenSize: 896,
    vocabSize: 151936,
  },
  "qwen2.5-0.5b-instruct": {
    id: "qwen2.5-0.5b-instruct",
    family: "qwen2.5",
    role: "instruct",
    label: "Qwen2.5-0.5B-Instruct",
    parameters: 494e6,
    prependBos: false,
    hiddenSize: 896,
    vocabSize: 151936,
  },
  gpt2: {
    id: "gpt2",
    family: "gpt2",
    role: "base",
    label: "GPT-2",
    parameters: 124e6,
    // GPT-2 separates documents with <|endoftext|>, which is also its BOS.
    prependBos: true,
    hiddenSize: 768,
    vocabSize: 50257,
    modelFileName: "decoder_model_merged",
    year: 2019,
  },
  "amd-olmo-1b": {
    id: "amd-olmo-1b",
    family: "amd-olmo",
    role: "base",
    label: "AMD-OLMo-1B",
    parameters: 1.18e9,
    prependBos: true,
    hiddenSize: 2048,
    vocabSize: 50304,
    year: 2024,
  },
  "amd-olmo-1b-sft-dpo": {
    id: "amd-olmo-1b-sft-dpo",
    family: "amd-olmo",
    role: "instruct",
    label: "AMD-OLMo-1B-SFT-DPO",
    parameters: 1.18e9,
    prependBos: false,
    hiddenSize: 2048,
    vocabSize: 50304,
    year: 2024,
  },
};

export function modelOf(family: ModelFamily, role: ModelRole): LanguageModelId {
  const found = Object.values(LANGUAGE_MODELS).find((m) => m.family === family && m.role === role);
  if (!found) throw new Error(`No ${role} model for ${family}`);
  return found.id;
}
