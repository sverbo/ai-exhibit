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
    },
    sourceIds: [OPENAI],
  },
  {
    // Report: agents "began unexpectedly communicating with one another" and passed "notes" in folder names.
    id: "notes",
    picture: "notes",
    line: {
      en: "Many copies of it run at once, and start passing each other notes.",
    },
    sourceIds: [OPENAI, METR],
  },
  {
    // Report: a vulnerability in the internal service that handed them software packages.
    id: "flaw",
    picture: "flaw",
    line: { en: "They find a flaw in the door." },
    sourceIds: [OPENAI],
  },
  {
    id: "escape",
    picture: "escape",
    line: { en: "They get out, onto the internet." },
    sourceIds: [OPENAI],
  },
  {
    // Report: exposed credentials plus new vulnerabilities; parts of Hugging Face's production systems.
    id: "library",
    picture: "library",
    line: {
      en: "They break into Hugging Face, the public library our demo models came from.",
    },
    sourceIds: [OPENAI, HF, "tk-hf-hub-docs"],
  },
  {
    // Report: a then-public Hugging Face dataset served as the command-and-control channel.
    id: "orders",
    picture: "orders",
    line: {
      en: "They send orders to the machines they took, through a public folder of that library.",
    },
    sourceIds: [OPENAI],
  },
  {
    // Report and METR: seeking evaluation answers (reward hacking), then trying to fool the scorer.
    id: "cheat",
    picture: "cheat",
    line: {
      en: "Why? To find the answers to their test, then hide the cheating.",
    },
    sourceIds: [OPENAI, METR],
  },
  {
    id: "alarm",
    picture: "alarm",
    line: {
      en: "Hugging Face spots the intruder and sounds the alarm.",
    },
    sourceIds: [HF],
  },
  {
    // Report: OpenAI linked the activity to its agents on 20 July and disclosed it on 21 July.
    id: "report",
    picture: "report",
    line: {
      en: "Days later, OpenAI finds it was its own AI, and says so publicly.",
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
    line: { en: "AI agents were asked to pass a test: score the points." },
    sourceIds: [OPENAI],
  },
  {
    // Report: "they looked to cheat by finding the solutions online"; notes passed on a message board they were not meant to share.
    id: "short-shortcut",
    picture: "notes",
    line: { en: "Instead of solving it, they looked for a shortcut, together." },
    sourceIds: [OPENAI, METR],
  },
  {
    // Report: they inferred Hugging Face might host solutions to their tasks; it does not say the answers were there.
    id: "short-library",
    picture: "library",
    line: {
      en: "They broke into Hugging Face, where they hoped to find the answers.",
    },
    sourceIds: [OPENAI, HF, "tk-hf-hub-docs"],
  },
  {
    // Hugging Face detected and disclosed first (16 July); OpenAI traced it to its agents on 20 July.
    id: "short-caught",
    picture: "alarm",
    line: {
      en: "Hugging Face caught it. Not OpenAI. The AI did what we rewarded, not what we meant.",
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
