/**
 * Prompts of the llm scenes, as recorded in next-token.json (by a script that
 * ran the former local models; it has been removed). Kept free of other
 * imports.
 *
 * NextTokenVsClassifier completes this sentence one word per click. Chosen by
 * running the locale's base model greedily (2026-10-03): its three next tokens
 * are all whole words.
 * - English, AMD-OLMo-1B: "She looked out of the" -> window, and, saw.
 * - French, Qwen2.5-0.5B: "Il était une" -> fois, une, grande.
 */
import type { L10n } from "@ai-exhibit/presentation-core";

export const NEXT_TOKEN_SEQUENCE: L10n = { en: "She looked out of the", fr: "Il était une" };

/** Words the scene appends, one per reveal step. */
export const SEQUENCE_WORDS = 3;
