import { l, type L10n, type Locale } from "../../learning/shared/ui.tsx";

/**
 * The "weather" walkthrough of ToolCallDemo: one tool round trip with the
 * Anthropic Messages API block shapes (tool definition, `tool_use`,
 * `tool_result`), checked against
 * https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
 * on 2026-10-02. Field names are exact; values are illustrative (no live weather).
 */

/** The id format matches the docs' example; the value itself is made up. */
export const TOOL_USE_ID = "toolu_01A09q90qw90lq917835lq9";

/** Tomorrow's date as the software would pass it, in ISO format. */
export function tomorrowIso(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const WEATHER_TEXT = {
  question: l("Faut-il un parapluie à Bruges demain ?", "Do I need an umbrella in Bruges tomorrow?"),
  toolDescription: l("Météo d'une ville pour un jour donné", "Weather for a city on a given day"),
  serviceReply: l("Pluie dès 14 h, risque 80 %, 14 °C", "Rain from 2 pm, 80% chance, 14 °C"),
  answer: l(
    "Oui, prenez un parapluie : il devrait pleuvoir à Bruges demain après-midi (risque de 80 %), avec 14 °C.",
    "Yes, take an umbrella: rain is likely in Bruges tomorrow afternoon (80% chance), around 14 °C.",
  ),
};

/** Step 1: what the software sends the model, before the question (one entry of `tools`). */
export function toolDefinition(locale: Locale) {
  return {
    name: "get_weather",
    description: WEATHER_TEXT.toolDescription[locale],
    input_schema: {
      type: "object",
      properties: {
        location: { type: "string" },
        date: { type: "string" },
      },
      required: ["location", "date"],
    },
  };
}

/** Step 2: the model's reply is this content block (with `stop_reason: "tool_use"`), not prose. */
export function toolUseBlock(date: string) {
  return {
    type: "tool_use",
    id: TOOL_USE_ID,
    name: "get_weather",
    input: { location: "Bruges, Belgium", date },
  };
}

/** Step 3: the software ran the tool and sends the result back, tied to the call by its id. */
export function toolResultBlock(locale: Locale) {
  return {
    type: "tool_result",
    tool_use_id: TOOL_USE_ID,
    content: WEATHER_TEXT.serviceReply[locale],
  };
}

export interface WeatherStage {
  /** Who produces what is on screen at this step. */
  actor: "software" | "model" | "service";
  title: L10n;
  caption: L10n;
  /** Field paths highlighted in that step's JSON. */
  highlights: string[];
}

export const WEATHER_STAGES: WeatherStage[] = [
  {
    actor: "software",
    title: l("Le logiciel décrit ses outils au modèle", "The software describes its tools to the model"),
    caption: l(
      "Avant même la question, le logiciel envoie la liste des outils : un nom, à quoi il sert, ce qu'il attend.",
      "Before the question, the software sends the list of tools: a name, what it is for, what it expects.",
    ),
    highlights: ["name", "description", "input_schema.properties"],
  },
  {
    actor: "model",
    title: l("Le modèle répond… par une demande en JSON", "The model replies… with a request in JSON"),
    caption: l(
      "Le modèle n'agit pas : il écrit seulement du texte. C'est le logiciel qui lit ce texte et lance l'outil.",
      "The model does not act: it only writes text. The software reads that text and runs the tool.",
    ),
    highlights: ["type", "name", "input"],
  },
  {
    actor: "service",
    title: l("Le logiciel appelle le service météo", "The software calls the weather service"),
    caption: l(
      "Puis il renvoie la réponse au modèle, avec le même identifiant que la demande.",
      "Then it sends the answer back to the model, with the same id as the request.",
    ),
    highlights: ["tool_use_id", "content"],
  },
  {
    actor: "model",
    title: l("Le modèle répond en langage courant", "The model answers in plain language"),
    caption: l("Il lit le résultat et rédige la réponse pour vous.", "It reads the result and writes the answer for you."),
    highlights: [],
  },
];
