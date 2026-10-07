import { pick, plainText, tr } from "@ai-exhibit/presentation-core";
import { Rich } from "../../primitives/Rich.tsx";
import type { SceneComponentProps } from "../../contract.ts";
import { Disclosure, SceneHeading, cx, type L10n } from "../../learning/shared/ui.tsx";
import { Icon } from "../shared/icons.tsx";
import { FULL_STEP, LAST_STEP, STEP_SUB, WINDOW_FILL, stackAt, type StackBlock } from "./stack.ts";
import styles from "./ContextStack.module.css";

export interface ContextStackProps {
  heading?: L10n;
}

const TEXT = {
  heading: { en: "The model has no memory" },
  illustrative: { en: "Illustrative conversation" },
  frame: { en: "Context window: what the model receives" },
  model: { en: "The model" },
  frozen: { en: "Its numbers do not change while you chat" },
  sentFirst: { en: "Sent to the model" },
  sentAll: { en: "All of it, at every message" },
  hidden: { en: "hidden from you" },
  latest: { en: "new" },
  dropped: { en: "falls out" },
  full: { en: "full" },
  toolCall: { en: "tool call" },
};

/**
 * "No memory": a stack of what the app sends the model at each message,
 * inside a frame labelled as the context window. Steps in stack.ts; no state.
 */
export function ContextStack({ props, ctx }: SceneComponentProps<ContextStackProps>) {
  const { locale, role, reducedMotion } = ctx;
  const t = (x: L10n) => tr(x, locale);
  const step = Math.max(0, Math.min(LAST_STEP, ctx.revealStep));
  const blocks = stackAt(step);
  const still = reducedMotion || role === "preview";
  const full = step === FULL_STEP;

  return (
    <div className={cx(styles.root, still && styles.still)}>
      <div className={styles.top}>
        <SceneHeading sub={<Rich text={t(STEP_SUB[step]!)} />}>
          <Rich text={t(props.heading ?? TEXT.heading)} />
        </SceneHeading>
        <Disclosure><Rich text={t(TEXT.illustrative)} /></Disclosure>
      </div>

      <div className={styles.body}>
        <section className={cx(styles.frame, full && styles.frameFull)} aria-label={plainText(t(TEXT.frame))}>
          <span className={styles.frameTag}>
            <span><Rich text={t(TEXT.frame)} /></span>
            {full && (
              <span className={cx(styles.badge, styles.badgeOut)}>
                <span><Rich text={t(TEXT.full)} /></span>
              </span>
            )}
          </span>
          {/* How much of the window is used: a drawing, labelled "full" in words when it is. */}
          <span className={styles.gauge} aria-hidden="true">
            <span className={styles.gaugeFill} style={{ height: `${WINDOW_FILL[step]}%` }} />
          </span>
          <ol className={styles.stack}>
            {blocks.map((b) => (
              <Block key={b.id} block={b} t={t} query={pick(b.text, locale)} />
            ))}
          </ol>
        </section>

        <div className={styles.link} aria-hidden="true">
          <span className={styles.arrow} />
        </div>

        <aside className={styles.side}>
          <div className={styles.modelCard}>
            <Icon name="robot" size={96} strokeWidth={1.4} />
            <p className={styles.modelName}><Rich text={t(TEXT.model)} /></p>
            <p className={styles.frozen}>
              <Icon name="lock" size={34} />
              <span><Rich text={t(TEXT.frozen)} /></span>
            </p>
          </div>
          <p className={styles.sent}><Rich text={t(step === 0 ? TEXT.sentFirst : TEXT.sentAll)} /></p>
        </aside>
      </div>
    </div>
  );
}

function Block({ block, t, query }: { block: StackBlock; t: (x: L10n) => string; query: string }) {
  const b = block;
  return (
    <li
      className={cx(
        styles.block,
        styles[b.kind],
        b.hidden && styles.hidden,
        b.latest && styles.latest,
        b.dropped && styles.dropped,
      )}
    >
      {b.tag && <span className={styles.tag}><Rich text={t(b.tag)} /></span>}
      {b.kind === "call" ? (
        <code className={styles.json}>{`{ "name": "web_search", "input": { "query": "${query}" } }`}</code>
      ) : (
        <span className={styles.text}><Rich text={t(b.text)} /></span>
      )}
      {b.hidden && (
        <span className={styles.badge}>
          <Icon name="hidden" size={26} />
          <span><Rich text={t(TEXT.hidden)} /></span>
        </span>
      )}
      {b.latest && <span className={cx(styles.badge, styles.badgeNew)}><span><Rich text={t(TEXT.latest)} /></span></span>}
      {b.dropped && (
        <span className={cx(styles.badge, styles.badgeOut)}>
          <Icon name="cross" size={24} />
          <span><Rich text={t(TEXT.dropped)} /></span>
        </span>
      )}
      {b.kind === "call" && <span className={cx(styles.badge, styles.badgeCall)}><span><Rich text={t(TEXT.toolCall)} /></span></span>}
    </li>
  );
}
