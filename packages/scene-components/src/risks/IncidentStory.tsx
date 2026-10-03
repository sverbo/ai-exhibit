import type { CSSProperties } from "react";
import type { L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../contract.ts";
import { EvidenceBadge } from "../primitives/EvidenceBadge.tsx";
import { SourceLabels } from "../primitives/SourceLabel.tsx";
import { incidentBeats, incidentSteps, type IncidentVariant } from "./incident.ts";
import { Picture } from "./pictures.tsx";
import styles from "./IncidentStory.module.css";

export interface IncidentStoryProps {
  heading?: L10n;
  /** "short": four beats in everyday words; "full" (default): nine beats. */
  variant?: IncidentVariant;
}

const COPY = {
  heading: { en: "A real case, summer 2026", fr: "Un cas réel, été 2026" },
  strip: { en: "The story so far", fr: "L'histoire jusqu'ici" },
} as const;

/** The beat shown at a reveal step; preview shows the last beat with the whole strip. */
export function incidentBeatAt(revealStep: number, preview: boolean, variant: IncidentVariant = "full"): number {
  const last = incidentSteps(variant);
  if (preview) return last;
  return Math.max(0, Math.min(last, revealStep));
}

/**
 * IncidentStory {heading?, variant?}: the incident told as a picture story. The current
 * beat fills the stage (big pictogram, one sentence); a strip below keeps the
 * beats already told, so the room never loses the thread. Future beats stay
 * blank. No state: the projector follows the step.
 */
export function IncidentStory({ props, ctx }: SceneComponentProps<IncidentStoryProps>) {
  const { locale, role } = ctx;
  const preview = role === "preview";
  const still = preview || ctx.reducedMotion;
  const beats = incidentBeats(props.variant);
  const current = incidentBeatAt(ctx.revealStep, preview, props.variant);
  const beat = beats[current]!;

  return (
    <div className={`${styles.root} ${still ? styles.still : ""}`} data-beat={beat.id} data-variant={props.variant ?? "full"}>
      <header className={styles.head}>
        <h2 className={styles.heading}>{(props.heading ?? COPY.heading)[locale]}</h2>
        <EvidenceBadge level="observed" locale={locale} size="sm" />
      </header>

      <div className={styles.now} key={beat.id}>
        <div className={styles.picture}>
          <Picture id={beat.picture} />
        </div>
        <div className={styles.text}>
          <p className={styles.line}>{beat.line[locale]}</p>
          <SourceLabels ids={beat.sourceIds} getSource={ctx.getSource} className={styles.sources} />
        </div>
      </div>

      <ol className={styles.strip} aria-label={COPY.strip[locale]} style={{ "--frames": beats.length } as CSSProperties}>
        {beats.map((b, i) => {
          const state = i < current ? "past" : i === current ? "current" : "future";
          return (
            <li key={b.id} className={styles.frame} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              {state === "future" ? null : <Picture id={b.picture} className={styles.mini} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
