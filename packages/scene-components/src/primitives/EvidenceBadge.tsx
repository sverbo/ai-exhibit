import type { EvidenceLevel, Locale } from "@ai-exhibit/presentation-core";
import styles from "./EvidenceBadge.module.css";

const LABELS: Record<Exclude<EvidenceLevel, "none">, Record<Locale, string>> = {
  observed: { en: "Observed", fr: "Observé" },
  evaluation: { en: "Evaluation", fr: "Évaluation" },
  projection: { en: "Projection", fr: "Projection" },
  "thought-experiment": { en: "Thought experiment", fr: "Expérience de pensée" },
  contested: { en: "Contested", fr: "Contesté" },
};

/** Shape + text carry the category; color is never the only signal. */
const SHAPES: Record<Exclude<EvidenceLevel, "none">, string> = {
  observed: "●",
  evaluation: "▲",
  projection: "◆",
  "thought-experiment": "○",
  contested: "◐",
};

export function evidenceLabel(level: Exclude<EvidenceLevel, "none">, locale: Locale): string {
  return LABELS[level][locale];
}

export function EvidenceBadge({
  level,
  locale,
  size = "md",
}: {
  level: EvidenceLevel;
  locale: Locale;
  size?: "sm" | "md" | "lg";
}) {
  if (level === "none") return null;
  return (
    <span
      className={`${styles.badge} ${styles[size]}`}
      style={{ "--badge-color": `var(--color-evidence-${level})` } as React.CSSProperties}
    >
      <span aria-hidden="true">{SHAPES[level]}</span>
      {LABELS[level][locale]}
    </span>
  );
}
