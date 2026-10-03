import type { Progress } from "./progress.ts";
import styles from "./ProgressRail.module.css";

/** A quiet "where are we": the parts as segments and a cursor, no numbers. */
export function ProgressRail({ progress }: { progress: Progress }) {
  if (!progress.parts.length) return null;
  let start = 0;
  return (
    <div className={styles.rail} aria-hidden="true">
      {progress.parts.map((p) => {
        const from = start;
        start += p.share;
        const state = progress.at >= start ? styles.done : progress.at >= from ? styles.current : "";
        return <span key={p.id} className={`${styles.segment} ${state}`} style={{ flexGrow: p.share }} />;
      })}
      <span className={styles.cursor} style={{ left: `${progress.at * 100}%` }} />
    </div>
  );
}
