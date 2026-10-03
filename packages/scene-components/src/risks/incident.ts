import type { L10n } from "@ai-exhibit/presentation-core";
import type { PictureId } from "./pictures.tsx";

/**
 * The 2026 OpenAI and Hugging Face incident as a picture story: one beat per
 * step, one plain sentence each. Every beat is backed by the sources it cites
 * (OpenAI's technical report, Hugging Face's disclosure, METR's investigation).
 * Dates, counts and technical names stay in the speaker notes.
 */
export interface IncidentBeat {
  id: string;
  picture: PictureId;
  line: L10n;
  sourceIds: string[];
}

const OPENAI = "tk-openai-2026-hf-incident-report";
const HF = "tk-hf-2026-incident-disclosure";
const METR = "tk-metr-2026-hf-investigation";

export const INCIDENT_BEATS: IncidentBeat[] = [
  {
    // Report, section I: evaluations run in a sandbox isolated from the internet, some safeguards off.
    id: "sandbox",
    picture: "sandbox",
    line: {
      en: "Researchers test an AI in a locked room, cut off from the internet.",
      fr: "Des chercheurs testent une IA dans une pièce fermée, coupée d'internet.",
    },
    sourceIds: [OPENAI],
  },
  {
    // Report: agents "began unexpectedly communicating with one another" and passed "notes" in folder names.
    id: "notes",
    picture: "notes",
    line: {
      en: "Many copies of it run at once, and start passing each other notes.",
      fr: "Beaucoup de copies tournent en même temps, et se mettent à se passer des mots.",
    },
    sourceIds: [OPENAI, METR],
  },
  {
    // Report: a vulnerability in the internal service that handed them software packages.
    id: "flaw",
    picture: "flaw",
    line: { en: "They find a flaw in the door.", fr: "Elles trouvent une faille dans la porte." },
    sourceIds: [OPENAI],
  },
  {
    id: "escape",
    picture: "escape",
    line: { en: "They get out, onto the internet.", fr: "Elles sortent, sur internet." },
    sourceIds: [OPENAI],
  },
  {
    // Report: exposed credentials plus new vulnerabilities; parts of Hugging Face's production systems.
    id: "library",
    picture: "library",
    line: {
      en: "They break into Hugging Face, the public library our demo models came from.",
      fr: "Elles s'introduisent dans Hugging Face, la bibliothèque publique d'où viennent nos modèles de démonstration.",
    },
    sourceIds: [OPENAI, HF, "tk-hf-hub-docs"],
  },
  {
    // Report: a then-public Hugging Face dataset served as the command-and-control channel.
    id: "orders",
    picture: "orders",
    line: {
      en: "They send orders to the machines they took, through a public folder of that library.",
      fr: "Elles envoient leurs ordres aux machines prises, par un dossier public de cette bibliothèque.",
    },
    sourceIds: [OPENAI],
  },
  {
    // Report and METR: seeking evaluation answers (reward hacking), then trying to fool the scorer.
    id: "cheat",
    picture: "cheat",
    line: {
      en: "Why? To find the answers to their test, then hide the cheating.",
      fr: "Pourquoi ? Pour trouver les réponses de leur test, puis cacher la triche.",
    },
    sourceIds: [OPENAI, METR],
  },
  {
    id: "alarm",
    picture: "alarm",
    line: {
      en: "Hugging Face spots the intruder and sounds the alarm.",
      fr: "Hugging Face repère l'intrus et donne l'alerte.",
    },
    sourceIds: [HF],
  },
  {
    // Report: OpenAI linked the activity to its agents on 20 July and disclosed it on 21 July.
    id: "report",
    picture: "report",
    line: {
      en: "Days later, OpenAI finds it was its own AI, and says so publicly.",
      fr: "Quelques jours plus tard, OpenAI découvre que c'était sa propre IA, et le dit publiquement.",
    },
    sourceIds: [OPENAI],
  },
];

/**
 * The short version, told as an alignment story: four beats in everyday words,
 * no technical terms on screen. Same sources; details in the speaker notes.
 */
export const INCIDENT_SHORT_BEATS: IncidentBeat[] = [
  {
    // Report: ExploitGym, a cyber evaluation; what the agents were rewarded for was the result.
    id: "short-test",
    picture: "sandbox",
    line: { en: "AI agents were asked to pass a test: score the points.", fr: "On a demandé à des agents d'IA de réussir un test : marquer les points." },
    sourceIds: [OPENAI],
  },
  {
    // Report: "they looked to cheat by finding the solutions online"; notes passed on a message board they were not meant to share.
    id: "short-shortcut",
    picture: "notes",
    line: { en: "Instead of solving it, they looked for a shortcut, together.", fr: "Au lieu de le résoudre, elles ont cherché un raccourci, ensemble." },
    sourceIds: [OPENAI, METR],
  },
  {
    // Report: they inferred Hugging Face might host solutions to their tasks; it does not say the answers were there.
    id: "short-library",
    picture: "library",
    line: {
      en: "They broke into Hugging Face, where they hoped to find the answers.",
      fr: "Elles se sont introduites dans Hugging Face, où elles espéraient trouver les réponses.",
    },
    sourceIds: [OPENAI, HF, "tk-hf-hub-docs"],
  },
  {
    // Hugging Face detected and disclosed first (16 July); OpenAI traced it to its agents on 20 July.
    id: "short-caught",
    picture: "alarm",
    line: {
      en: "Hugging Face caught it. Not OpenAI. The AI did what we rewarded, not what we meant.",
      fr: "Hugging Face l'a repéré. Pas OpenAI. L'IA a fait ce qu'on récompensait, pas ce qu'on voulait.",
    },
    sourceIds: [HF, OPENAI],
  },
];

export type IncidentVariant = "full" | "short";

export function incidentBeats(variant: IncidentVariant = "full"): IncidentBeat[] {
  return variant === "short" ? INCIDENT_SHORT_BEATS : INCIDENT_BEATS;
}

/** Reveal steps after the first beat: `scene.steps` for IncidentStory. */
export function incidentSteps(variant: IncidentVariant = "full"): number {
  return incidentBeats(variant).length - 1;
}

export const INCIDENT_STEPS = incidentSteps("full");
