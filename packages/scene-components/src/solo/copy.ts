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
  tokensFree: { en: "Free: cutting into tokens counts no ask." },
  tokensRecorded: { en: "Pick an example: typing needs the live tokenizer." },
  // Words as points
  wordsField: { en: "A word or a short phrase" },
  wordsHint: { en: "Drag to move, pinch to zoom, tap a dot to see its neighbours." },
  cloudHint: { en: "Drag to turn the cloud, pinch to zoom, tap a dot to see its neighbours." },
  wordsViews: { en: "Views" },
  wordsCost: { en: "A word already on the map is free; any other word counts as one ask." },
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
  ladderCost: { en: "One question counts as one ask, even with three models answering." },
  ladderRecorded: { en: "The talk's riddle, as four generations of GPT answered it." },
  // Asks: each demo has a few per phone and hour
  asksLeft: { en: "{n} of {m} asks left for this demo this hour." },
  demoUsedUp: {
    en: "You have used this demo's asks for this hour: recorded examples here. The other demos still answer live.",
  },
} satisfies Record<string, L10n>;
