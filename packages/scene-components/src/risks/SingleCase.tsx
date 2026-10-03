import { tr, type EvidenceLevel, type L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
import { EvidenceBadge } from "../primitives/EvidenceBadge.tsx";
import { Picture, type PictureId } from "./pictures.tsx";
import styles from "./SingleCase.module.css";

export interface SingleCaseProps {
  picture: PictureId;
  title: L10n;
  /** The one plain line that tells the case. */
  line: L10n;
  /** Shown next to the badge, e.g. "2015". */
  date?: string;
  evidence: EvidenceLevel;
  /** Revealed at step 1: what happened next. */
  outcome?: L10n;
}

/** Steps a scene using SingleCase declares: 1 with an outcome, else 0. */
export function singleCaseSteps(props: SingleCaseProps): number {
  return props.outcome ? 1 : 0;
}

/**
 * SingleCase {picture, title, line, date?, evidence, outcome?}: one documented
 * case, told as one picture and one line. Step 1 adds the outcome. No state:
 * the projector follows the step; preview shows everything, still.
 */
export function SingleCase({ props, ctx }: SceneComponentProps<SingleCaseProps>) {
  const { locale, role } = ctx;
  const still = role === "preview" || ctx.reducedMotion;
  const showOutcome = Boolean(props.outcome) && (role === "preview" || ctx.revealStep >= 1);

  return (
    <div className={`${styles.root} ${still ? styles.still : ""}`} data-outcome={showOutcome ? "" : undefined}>
      <div className={styles.picture}>
        <Picture id={props.picture} />
      </div>
      <div className={styles.text}>
        <p className={styles.meta}>
          {props.date ? <span className={styles.date}>{props.date}</span> : null}
          <EvidenceBadge level={props.evidence} locale={locale} size="sm" />
        </p>
        <h2 className={styles.title}>
          <Rich text={tr(props.title, locale)} />
        </h2>
        <p className={styles.line}>
          <Rich text={tr(props.line, locale)} />
        </p>
        {props.outcome ? (
          <p className={`${styles.outcome} ${showOutcome ? styles.shown : styles.hidden}`} aria-hidden={!showOutcome}>
            <Rich text={tr(props.outcome, locale)} />
          </p>
        ) : null}
      </div>
    </div>
  );
}
