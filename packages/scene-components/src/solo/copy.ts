/**
 * Copy of the solo demos (audience phones). Written in English; other
 * languages come from the catalog (presentations/canonical/locales), like
 * every scene component's copy. The scenes' own copy is reused where it fits.
 */
import type { L10n } from "@ai-exhibit/presentation-core";

export const SOLO = {
  busy: { en: "Many people are playing right now. Try again in a few seconds." },
  recordedNote: { en: "Recorded real examples: live answers are not available right now." },
  // Tokens
  tokensField: { en: "Your sentence" },
  tokensFree: { en: "Free: cutting into tokens does not use your live answers." },
  tokensRecorded: { en: "Pick an example: typing needs the live tokenizer." },
  // Words as points
  wordsField: { en: "A word or a short phrase" },
  wordsHint: { en: "Drag to move, pinch to zoom, tap a dot to see its neighbours." },
  wordsCost: { en: "A word already on the map is free; any other word uses one live answer." },
  // Base model and assistant
  baseIntro: { en: "A model fresh out of pretraining. It only continues your text." },
  baseField: { en: "The start of a text" },
  addTokens: { en: "+10 tokens" },
  showRecorded: { en: "Show the recorded continuation" },
  startOver: { en: "Start over" },
  assistantTitle: { en: "Assistant" },
  assistantIntro: { en: "The same kind of model, trained further to answer questions." },
  questionField: { en: "Your question" },
  shortAnswers: { en: "Answers are kept short here to share the budget." },
  pickQuestion: { en: "Pick a question: these answers were recorded." },
  // Then and now
  ladderIntro: { en: "One question, three open models of increasing size, answering at the same time." },
  ladderCost: { en: "One question uses three live answers, one per model." },
  ladderRecorded: { en: "The talk's riddle, as four generations of GPT answered it." },
  cannotAfford: { en: "Not enough live answers left for three models." },
} satisfies Record<string, L10n>;
