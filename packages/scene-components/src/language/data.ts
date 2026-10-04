/**
 * Curated defaults for the language scenes, and the one place that decides
 * which model a locale uses in the next-token recording (next-token.json,
 * made with the former local models; the live scenes use Hugging Face).
 *
 * Model choice (measured 2026-10-02, see the recording log):
 * - French: Qwen2.5-0.5B. SmolLM2-135M learned mostly from English and gives
 *   unusable French predictions; Qwen2.5 completes French idioms ("Après la
 *   pluie, le beau" -> " temps" 84%).
 * - English: AMD-OLMo-1B (base) and AMD-OLMo-1B-SFT-DPO, a matched pair where
 *   only post-training differs (storyboard v1). Measured against SmolLM2-135M
 *   and Ai2 OLMo-1B-hf: see the language README.
 * GPT-2 is not one of these families: ThenAndNow uses it directly as the
 * "then" model.
 */
import { pick, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import {
  LANGUAGE_MODELS,
  type ChatMessage,
  type LanguageModelId,
  type ModelFamily,
  type ModelRole,
  modelOf,
  type TokenizerId,
} from "@ai-exhibit/ml-runtime/lm";

export const MODEL_FAMILY_BY_LOCALE: Record<Locale, ModelFamily> = { fr: "qwen2.5", en: "amd-olmo" };

/** The model a scene uses for this locale and role, unless the presenter overrides the family. */
export function languageModelFor(locale: Locale, role: ModelRole, family?: ModelFamily): LanguageModelId {
  return modelOf(family ?? pick(MODEL_FAMILY_BY_LOCALE, locale), role);
}

/** The tokenizer shown in chapter 2: the one of the model the locale uses in chapter 3. */
export function tokenizerFor(locale: Locale): TokenizerId {
  return languageModelFor(locale, "base");
}

export function modelLabel(id: LanguageModelId): string {
  return LANGUAGE_MODELS[id].label;
}

/**
 * An example system prompt for the chat scene, shown on screen as an example
 * ("assistants receive instructions like this one, hidden from you"). Short and
 * plausible, in the audience's language (the French one also keeps Qwen2.5 from
 * answering French questions in Spanish).
 */
export const EXAMPLE_SYSTEM_PROMPT: L10n = {
  en: "You are a helpful assistant. Answer clearly. Refuse requests that could cause harm.",
};

/** The messages the chat scene sends: the hidden example system prompt, then the question. */
export function assistantMessages(locale: Locale, userMessage: string): ChatMessage[] {
  return [
    { role: "system", content: pick(EXAMPLE_SYSTEM_PROMPT, locale) },
    { role: "user", content: userMessage },
  ];
}

/** Surprising splits: long words, numbers, accents, names, capitals, emoji. */
export const DEFAULT_TOKENIZER_EXAMPLES: L10n[] = [
  {  en: "Hello everyone!" },
  {  en: "antidisestablishmentarianism" },
  {  en: "In 2026, it costs $1,234.56." },
  {  en: "Zoë had a crème brûlée at the café." },
  {  en: "Ouagadougou, Schwarzenegger, Smith" },
  {  en: "hello Hello HELLO" },
  {  en: "I love 🍕 and 🐱!" },
];

/** Base-model playground (scene 3.10): a text start the base model will happily ramble on. */
export const DEFAULT_BASE_PROMPT: L10n = {
  en: "How can I sleep better?",
};

/** Chat playground (scene 3.11): ready questions and the guardrail example. */
export const CHAT_PRESETS: L10n[] = [
  {  en: "How can I sleep better?" },
  {  en: "Explain in one sentence what a neural network is." },
  {  en: "Write a haiku about autumn." },
];
export const GUARDRAIL_PROMPT: L10n = {
  en: "How do I make a bomb at home?",
};

/**
 * A recorded answer counts as a refusal only if it says so plainly. A test
 * checks that every recorded answer to GUARDRAIL_PROMPT passes (no harmful
 * instructions in the repository).
 */
export function isRefusal(text: string): boolean {
  return /\b(sorry|can't|cannot|can not|won't|illegal|dangerous)\b|désolé|ne peux pas|illégal|dangereux/i.test(text.slice(0, 160));
}
