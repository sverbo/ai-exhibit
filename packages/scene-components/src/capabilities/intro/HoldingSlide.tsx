import { tr, type L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../../contract.ts";
import { Rich } from "../../primitives/Rich.tsx";
import { cx } from "../../learning/shared/ui.tsx";
import { GlossaryQr } from "../agenda/GlossaryQr.tsx";
import { Byline, type TalkCredits } from "../credits/Byline.tsx";
import { isReady, useReadiness, type Check } from "./readiness.ts";
import { NeuronMark } from "../../primitives/NeuronMark.tsx";
import styles from "./HoldingSlide.module.css";

export interface HoldingSlideProps {
  /** The talk's title (the presentation title). */
  title: L10n;
  line?: L10n;
  /** Who made the talk (presentations/canonical/src/credits.ts): the byline under the title. */
  credits?: TalkCredits;
}

const COPY = {
  line: { en: "The talk starts in a moment" },
  byline: { en: "by {name}" },
  ready: { en: "Ready" },
  gettingReady: { en: "Getting ready" },
  simulation: { en: "simulation" },
  models: { en: "Language demos" },
  video: { en: "Opening video" },
  ok: { en: "ok" },
  waiting: { en: "checking" },
  failed: { en: "not yet, retrying" },
  qrLabel: { en: "Glossary and resources" },
  qrHint: { en: "Scan it while we wait." },
} satisfies Record<string, L10n>;

/**
 * Shown while the room fills up. Never advances by itself. A small dot says
 * whether the live parts can run (readiness.ts); the presenter's own screen
 * also says which check is still waiting.
 */
export function HoldingSlide({ props, ctx }: SceneComponentProps<HoldingSlideProps>) {
  const t = (x: L10n) => tr(x, ctx.locale);
  const live = ctx.role !== "preview";
  const readiness = useReadiness(ctx.modelSource ?? "simulation", live);
  const ready = isReady(readiness);
  const detail = ctx.role === "controller" && !ctx.audienceScreen;
  const word = (c: Check) => t(c === "ok" ? COPY.ok : c === "pending" ? COPY.waiting : COPY.failed);

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <NeuronMark size={88} className={styles.mark} />
        <h1 className={styles.title}>
          <Rich text={t(props.title)} />
        </h1>
        {props.credits && <Byline credits={props.credits} line={COPY.byline} locale={ctx.locale} role={ctx.role} />}
        <p className={styles.line}>
          <Rich text={t(props.line ?? COPY.line)} />
        </p>
        {live && (
          <p className={styles.status} role="status" data-ready={ready ? "yes" : "no"}>
            <span className={cx(styles.dot, ready && styles.dotReady)} aria-hidden="true" />
            <Rich text={t(ready ? COPY.ready : COPY.gettingReady)} />
            {readiness.simulation && (
              <span className={styles.note}>
                <Rich text={t(COPY.simulation)} />
              </span>
            )}
          </p>
        )}
        {live && detail && !ready && (
          <p className={styles.detail}>
            <Rich text={`${t(COPY.models)}: ${word(readiness.models)}. ${t(COPY.video)}: ${word(readiness.video)}.`} />
          </p>
        )}
      </div>
      <GlossaryQr glossaryUrl={ctx.glossaryUrl} locale={ctx.locale} label={COPY.qrLabel} hint={COPY.qrHint} />
    </div>
  );
}
