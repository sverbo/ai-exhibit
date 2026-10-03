import { plainText, tr } from "@ai-exhibit/presentation-core";
import type { ReactNode } from "react";
import type { SceneComponentProps } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
import { ENVELOPES, type Envelope } from "./data.ts";
import styles from "./AIEnvelopes.module.css";

/** Steps a scene should declare: step 0 shows AI, each step adds the next ring inward. */
export const ENVELOPE_STEPS = ENVELOPES.length - 1;

/**
 * AI contains machine learning, which contains neural networks, which contain
 * large language models. Nested rooms, revealed from the outside in, each with
 * a definition and one everyday example. No state: everything follows the step.
 */
export function AIEnvelopes({ ctx }: SceneComponentProps<Record<string, never>>) {
  const { locale, role } = ctx;
  const shown = role === "preview" ? ENVELOPES.length : Math.min(ENVELOPES.length, Math.max(0, ctx.revealStep) + 1);
  const still = role === "preview" || ctx.reducedMotion;

  const ring = (index: number): ReactNode => {
    const env: Envelope | undefined = ENVELOPES[index];
    if (!env) return null;
    const visible = index < shown;
    const current = index === shown - 1;
    return (
      <section
        className={`${styles.ring} ${visible ? styles.shown : styles.hidden} ${current ? styles.current : ""}`}
        data-level={index}
        aria-hidden={!visible}
        aria-label={plainText(tr(env.name, locale))}
      >
        <header className={styles.band}>
          <div className={styles.what}>
            <h2 className={styles.name}><Rich text={tr(env.name, locale)} /></h2>
            <p className={styles.definition}><Rich text={tr(env.definition, locale)} /></p>
          </div>
          <p className={styles.example}>
            <span className={styles.glyph} aria-hidden="true">
              {env.glyph}
            </span>
            <span>
              <Rich text={tr(env.example, locale)} />
            </span>
          </p>
        </header>
        {index < ENVELOPES.length - 1 ? <div className={styles.inside}>{ring(index + 1)}</div> : null}
      </section>
    );
  };

  return <div className={`${styles.root} ${still ? styles.still : ""}`}>{ring(0)}</div>;
}
