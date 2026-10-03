import type { SourceRecord } from "@ai-exhibit/presentation-core";
import { shortSourceLabel } from "./sourceLabel.ts";
import styles from "./SourceLabel.module.css";

/** Projector-side citation: short and quiet. Full records live in Presenter View and /handout. */
export function SourceLabels({
  ids,
  getSource,
  className,
}: {
  ids: string[] | undefined;
  getSource: (id: string) => SourceRecord | undefined;
  className?: string;
}) {
  if (!ids?.length) return null;
  const labels = ids.map((id) => {
    const source = getSource(id);
    return { id, text: source ? shortSourceLabel(source) : id };
  });
  return (
    <span className={`${styles.sources} ${className ?? ""}`}>
      {labels.map((l) => (
        <span key={l.id} className={styles.source}>
          {l.text}
        </span>
      ))}
    </span>
  );
}
