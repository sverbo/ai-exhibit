import { pick, tr } from "@ai-exhibit/presentation-core";
import { l, type L10n, type Locale } from "../../learning/shared/ui.tsx";

/**
 * The "search" scenario of ToolCallDemo: a chatbot alone next to the same model
 * with a web search tool, the tool side shown as real Messages API blocks (same
 * shapes as weather.ts, checked against the tool-use docs on 2026-10-02).
 * The match, clubs, sites and score are invented for the example.
 */

export const SEARCH_TOOL_USE_ID = "toolu_01T1x1fJ34qAmk2tNTrN7Up6";

export const SEARCH_TEXT = {
  question: { en: "Who won last night's match, Westhoek against Damme?" },
  chatAnswer: l(
    "Je ne peux pas le savoir : mes connaissances s'arrêtent à la date de mon entraînement.",
    "I can't know that: my knowledge stops at the date of my training.",
  ),
  chatNote: { en: "On its own, the model sees nothing that happened since." },
  toolDescription: { en: "Search the web, return the top results" },
  query: { en: "Westhoek Damme match last night score" },
  results: [
    { en: "sport.example: Westhoek 2, Damme 1" },
    { en: "news.example: Damme beaten 2 to 1" },
  ],
  answer: l(
    "Westhoek a gagné 2 à 1 contre Damme hier soir (sources : sport.example, news.example).",
    "Westhoek beat Damme 2 to 1 last night (sources: sport.example, news.example).",
  ),
};

export function searchToolDefinition(locale: Locale) {
  return {
    name: "web_search",
    description: tr(SEARCH_TEXT.toolDescription, locale),
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  };
}

export function searchToolUseBlock(locale: Locale) {
  return {
    type: "tool_use",
    id: SEARCH_TOOL_USE_ID,
    name: "web_search",
    input: { query: pick(SEARCH_TEXT.query, locale) },
  };
}

export function searchToolResultBlock(locale: Locale) {
  return {
    type: "tool_result",
    tool_use_id: SEARCH_TOOL_USE_ID,
    content: SEARCH_TEXT.results.map((r) => ({ type: "text", text: tr(r, locale) })),
  };
}

export interface SearchStage {
  /** Reveal step at which this stage is on screen. */
  step: number;
  chip: L10n;
  from: "software" | "model";
  to: "software" | "model" | "you";
  /** Where the JSON sits in the API exchange. */
  where?: string;
  caption: L10n;
  highlights: string[];
}

/** Right-hand pane, steps 2 to 5 (steps 0 and 1 set up the question and the chat-only answer). */
export const SEARCH_STAGES: SearchStage[] = [
  {
    step: 2,
    chip: { en: "Tools" },
    from: "software",
    to: "model",
    where: '"tools": [ … ]',
    caption: { en: "The software describes the tool to the model: a name, what it does, what it expects." },
    highlights: ["name", "description", "input_schema.properties"],
  },
  {
    step: 3,
    chip: { en: "Call" },
    from: "model",
    to: "software",
    where: '"stop_reason": "tool_use"',
    caption: l(
      "Le modèle écrit une demande de recherche. Il n'agit pas : c'est le logiciel qui lit ce texte et lance la recherche.",
      "The model writes a search request. It does not act: the software reads that text and runs the search.",
    ),
    highlights: ["type", "input"],
  },
  {
    step: 4,
    chip: { en: "Results" },
    from: "software",
    to: "model",
    where: '"content": [ … ]',
    caption: { en: "The software sends the results back to the model, with the same id." },
    highlights: ["tool_use_id", "content"],
  },
  {
    step: 5,
    chip: { en: "Answer" },
    from: "model",
    to: "you",
    caption: { en: "The model answers, citing what it found." },
    highlights: [],
  },
];

/** The JSON shown at a reveal step, or null when that step shows no JSON. */
export function searchJsonAt(step: number, locale: Locale) {
  if (step === 2) return searchToolDefinition(locale);
  if (step === 3) return searchToolUseBlock(locale);
  if (step === 4) return searchToolResultBlock(locale);
  return null;
}

/** One line per result block keeps the result readable; this is the width that allows it. */
export const SEARCH_INLINE_MAX = 68;
