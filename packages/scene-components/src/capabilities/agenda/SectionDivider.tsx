import type { L10n, Locale } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../../contract.ts";
import layout from "../../layouts/layouts.module.css";
import styles from "./SectionDivider.module.css";

export interface SectionDividerProps {
  /** The parts of the talk, as on the agenda slide (same list, same order). */
  items: L10n[];
  /** Index of the part that starts here (0-based). */
  current: number;
}

const PART: Record<Locale, string> = { en: "Part", fr: "Partie" };

/**
 * Opens a part of the talk: its number and title, large, over the agenda with
 * this part highlighted, the parts already covered muted and the next ones dim.
 * Static: no steps, no state.
 */
export function SectionDivider({ props, ctx }: SceneComponentProps<SectionDividerProps>) {
  const items = props.items ?? [];
  const current = Math.max(0, Math.min(items.length - 1, props.current ?? 0));
  const title = items[current]?.[ctx.locale] ?? "";

  return (
    <div className={`${layout.frame} ${styles.divider}`}>
      <div className={styles.head}>
        <p className={styles.kicker}>
          {PART[ctx.locale]} {current + 1}
          <span className={styles.of}> / {items.length}</span>
        </p>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <ol className={styles.plan}>
        {items.map((item, i) => (
          <li key={i} className={i === current ? styles.current : i < current ? styles.done : styles.next}>
            <span className={styles.num}>{i + 1}</span>
            {item[ctx.locale]}
          </li>
        ))}
      </ol>
    </div>
  );
}
