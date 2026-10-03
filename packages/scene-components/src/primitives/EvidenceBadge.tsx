import { tr, type EvidenceLevel, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import styles from "./EvidenceBadge.module.css";

const LABELS: Record<Exclude<EvidenceLevel, "none">, L10n> = {
  observed: { en: "Observed" },
  evaluation: { en: "Evaluation" },
  projection: { en: "Projection" },
  "thought-experiment": { en: "Thought experiment" },
  contested: { en: "Contested" },
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
  return tr(LABELS[level], locale);
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
      {tr(LABELS[level], locale)}
    </span>
  );
}
