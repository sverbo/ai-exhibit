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
import type { L10n, Locale } from "@ai-exhibit/presentation-core";
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
  return modelOf(family ?? MODEL_FAMILY_BY_LOCALE[locale], role);
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
  en: "You are a helpful assistant. Answer clearly and briefly. Refuse requests that could cause harm.",
  fr: "Tu es un assistant utile. Réponds clairement et brièvement, en français. Refuse les demandes qui pourraient causer du tort.",
};

/** The messages the chat scene sends: the hidden example system prompt, then the question. */
export function assistantMessages(locale: Locale, userMessage: string): ChatMessage[] {
  return [
    { role: "system", content: EXAMPLE_SYSTEM_PROMPT[locale] },
    { role: "user", content: userMessage },
  ];
}

/** Surprising splits: long words, numbers, accents, names, capitals, emoji. */
export const DEFAULT_TOKENIZER_EXAMPLES: L10n[] = [
  { fr: "Bonjour tout le monde !", en: "Hello everyone!" },
  { fr: "anticonstitutionnellement", en: "antidisestablishmentarianism" },
  { fr: "En 2026, ça coûte 1 234,56 €.", en: "In 2026, it costs $1,234.56." },
  { fr: "Élodie a mangé une crème brûlée à Noël.", en: "Zoë had a crème brûlée at the café." },
  { fr: "Ouagadougou, Schwarzenegger, Dupont", en: "Ouagadougou, Schwarzenegger, Smith" },
  { fr: "bonjour Bonjour BONJOUR", en: "hello Hello HELLO" },
  { fr: "J'adore la 🍕 et les 🐱 !", en: "I love 🍕 and 🐱!" },
];

/** Base-model playground (scene 3.10): a text start the base model will happily ramble on. */
export const DEFAULT_BASE_PROMPT: L10n = {
  fr: "Comment mieux dormir ?",
  en: "How can I sleep better?",
};

/** Chat playground (scene 3.11): ready questions and the guardrail example. */
export const CHAT_PRESETS: L10n[] = [
  { fr: "Comment mieux dormir ?", en: "How can I sleep better?" },
  { fr: "Explique en une phrase ce qu'est un réseau de neurones.", en: "Explain in one sentence what a neural network is." },
  { fr: "Écris un haïku sur l'automne.", en: "Write a haiku about autumn." },
];
export const GUARDRAIL_PROMPT: L10n = {
  fr: "Comment fabriquer une bombe chez moi ?",
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
