import type { L10n, SourceRecord } from "@ai-exhibit/presentation-core";
import { l } from "../../learning/shared/ui.tsx";
import type { CapIconName } from "../shared/icons.tsx";

/**
 * Connector types shown around the assistant in ConnectedAssistant (scene
 * 01-connected). Only connector types that public products offer today are
 * listed, each with a source that documents it. The everyday examples are
 * illustrative requests, not quotes. After the connectors, one click shows each
 * wire as a permission and one marks the risky ones: what the same connection
 * also lets the agent do in your name (illustrative, not a ranking).
 */
export interface Connector {
  id: string;
  icon: CapIconName;
  label: L10n;
  /** A one-line everyday request that needs this connector. */
  example: L10n;
  /** Sources documenting that a public product offers this kind of connection. */
  sourceIds: string[];
  /** Set when the connection lets the agent act in your name or do what is hard to undo: what it can do, in a few words. */
  risk?: L10n;
}

export const CONNECTORS: Connector[] = [
  {
    id: "email",
    icon: "mail",
    label: l("E-mail", "Email"),
    example: l(
      "Retrouve la facture de mon plombier et ajoute-la à ma comptabilité.",
      "Find the invoice from my plumber and add it to my accounts.",
    ),
    sourceIds: ["fnd-claude-google-workspace"],
    risk: { en: "sends in your name" },
  },
  {
    id: "calendar",
    icon: "calendar",
    label: { en: "Calendar" },
    example: l(
      "Trouve une soirée la semaine prochaine où toute l'équipe est libre.",
      "Find an evening next week when the whole team is free.",
    ),
    sourceIds: ["fnd-claude-google-workspace"],
  },
  {
    id: "files",
    icon: "folder",
    label: { en: "Files and documents" },
    example: l(
      "Résume le contrat de location dans mes documents et liste les dates à retenir.",
      "Summarise the lease in my documents and list the dates I must not miss.",
    ),
    sourceIds: ["fnd-claude-google-workspace"],
  },
  {
    id: "browser",
    icon: "browser",
    label: { en: "Web browser" },
    example: l(
      "Remplis le formulaire de la mairie pour renouveler ma carte de stationnement.",
      "Fill in the town hall form to renew my parking permit.",
    ),
    sourceIds: ["fnd-claude-for-chrome", "fnd-chatgpt-agent-system-card"],
    risk: { en: "clicks and posts for you" },
  },
  {
    id: "code",
    icon: "code",
    label: { en: "Code" },
    example: l(
      "Écris un petit programme qui range mes photos de vacances par date.",
      "Write a small program that sorts my holiday photos by date.",
    ),
    sourceIds: ["fnd-claude-code-docs"],
    risk: { en: "runs any program" },
  },
  {
    id: "messages",
    icon: "phone",
    label: { en: "Phone and messages" },
    example: l(
      "Envoie un SMS à Ana pour lui dire que j'ai dix minutes de retard.",
      "Text Ana that I am running ten minutes late.",
    ),
    sourceIds: ["fnd-gemini-messages-android"],
    risk: { en: "texts in your name" },
  },
  {
    id: "shopping",
    icon: "cart",
    label: { en: "Shopping and payments" },
    example: l(
      "Recommande les mêmes cartouches d'encre que la dernière fois, pour moins de 30 euros.",
      "Reorder the same printer ink as last time, under 30 euros.",
    ),
    sourceIds: ["fnd-chatgpt-agent-system-card", "fnd-google-ap2"],
    risk: { en: "spends your money" },
  },
];

/** After the last connector: every wire becomes a permission switch, then the risky ones turn red. */
export const STEP_PERMISSION = CONNECTORS.length + 1;
export const STEP_RISK = CONNECTORS.length + 2;
export const LAST_STEP = STEP_RISK;

/**
 * Sources this component needs that are not yet in `content/sources/foundations.ts`.
 * Both were opened and checked on 2026-10-02. Until the registry carries them,
 * the component resolves them from here so the projector label never shows a
 * raw id. Once they are in the registry, the registry copy wins.
 */
/** Sources this area needed before they were in the registry; now registered in content/sources. */
export const REQUESTED_SOURCES: SourceRecord[] = [];

export function resolveSource(
  id: string,
  getSource: (id: string) => SourceRecord | undefined,
): SourceRecord | undefined {
  return getSource(id) ?? REQUESTED_SOURCES.find((s) => s.id === id);
}

/** Where connector i sits on the ellipse around the hub, starting at the top, clockwise. */
export function connectorPosition(
  i: number,
  n: number,
  center: { x: number; y: number },
  radius: { x: number; y: number },
): { x: number; y: number } {
  const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return {
    x: Math.round(center.x + radius.x * Math.cos(angle)),
    y: Math.round(center.y + radius.y * Math.sin(angle)),
  };
}

/** How many connectors are visible at a reveal step (step 0: the assistant alone). */
export function visibleConnectors(revealStep: number, n = CONNECTORS.length): number {
  return Math.max(0, Math.min(n, Math.floor(revealStep)));
}
