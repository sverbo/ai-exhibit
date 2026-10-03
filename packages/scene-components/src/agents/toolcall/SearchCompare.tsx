import { tr } from "@ai-exhibit/presentation-core";
import { Rich } from "../../primitives/Rich.tsx";
import { useMemo, type ReactNode } from "react";
import { Disclosure, SceneHeading, cx, l, type L10n, type Locale } from "../../learning/shared/ui.tsx";
import { Icon, type IconName } from "../shared/icons.tsx";
import { JsonBlock } from "./JsonBlock.tsx";
import { SEARCH_INLINE_MAX, SEARCH_STAGES, SEARCH_TEXT, searchJsonAt } from "./search.ts";
import styles from "./SearchCompare.module.css";

const TEXT = {
  heading: { en: "A chatbot, or an agent with a tool?" },
  illustrative: { en: "Illustrative example: match, sites and score are invented." },
  chatTitle: { en: "The model alone" },
  chatSub: { en: "text in, text out" },
  agentTitle: { en: "The same model, with a search tool" },
  agentSub: { en: "what actually travels, in JSON" },
  you: { en: "You" },
  model: { en: "The model" },
  software: { en: "The software" },
};

type Party = "you" | "model" | "software";
const ICON: Record<Party, IconName> = { you: "person", model: "chat", software: "server" };

export function SearchCompare({ step, locale, heading }: { step: number; locale: Locale; heading?: L10n }) {
  const t = (x: L10n) => tr(x, locale);
  const stage = SEARCH_STAGES.find((s) => s.step === step) ?? null;
  const json = useMemo(() => searchJsonAt(step, locale), [step, locale]);

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <SceneHeading><Rich text={t(heading ?? TEXT.heading)} /></SceneHeading>
        <Disclosure><Rich text={t(TEXT.illustrative)} /></Disclosure>
      </div>

      <div className={styles.cols}>
        <section className={styles.chat}>
          <h3 className={styles.colTitle}><Rich text={t(TEXT.chatTitle)} /></h3>
          <p className={styles.colSub}><Rich text={t(TEXT.chatSub)} /></p>
          <Bubble who={t(TEXT.you)} icon="person" side="user">
            <Rich text={t(SEARCH_TEXT.question)} />
          </Bubble>
          <div className={cx(styles.reveal, step >= 1 && styles.on)}>
            <Bubble who={t(TEXT.model)} icon="chat" side="model">
              <Rich text={t(SEARCH_TEXT.chatAnswer)} />
            </Bubble>
            <p className={styles.note}><Rich text={t(SEARCH_TEXT.chatNote)} /></p>
          </div>
        </section>

        <section className={styles.agent}>
          <h3 className={styles.colTitle}><Rich text={t(TEXT.agentTitle)} /></h3>
          <p className={styles.colSub}><Rich text={t(TEXT.agentSub)} /></p>
          <Bubble who={t(TEXT.you)} icon="person" side="user">
            <Rich text={t(SEARCH_TEXT.question)} />
          </Bubble>

          {/* The round trip is a sequence, so its stages are numbered. */}
          <ol className={styles.chips} aria-hidden={step < 2}>
            {SEARCH_STAGES.map((s, i) => (
              <li key={s.step} className={cx(styles.chip, step === s.step && styles.chipOn, step > s.step && styles.chipDone)}>
                <span className={styles.chipNum}>{i + 1}</span>
                <Rich text={t(s.chip)} />
              </li>
            ))}
          </ol>

          {stage && (
            <div className={styles.stage} key={step}>
              <div className={styles.flow}>
                <PartyTag party={stage.from} label={t(TEXT[stage.from])} />
                <span className={styles.arrow} aria-hidden="true" />
                <PartyTag party={stage.to} label={t(TEXT[stage.to])} />
                {stage.where && <code className={styles.where}>{stage.where}</code>}
              </div>
              {json && <JsonBlock value={json} highlights={stage.highlights} size={24} inlineMax={SEARCH_INLINE_MAX} />}
              {step >= 5 && (
                <Bubble who={t(TEXT.model)} icon="chat" side="model" strong>
                  <Rich text={t(SEARCH_TEXT.answer)} />
                </Bubble>
              )}
              <p className={cx(styles.caption, step === 3 && styles.insight)}><Rich text={t(stage.caption)} /></p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PartyTag({ party, label }: { party: Party; label: string }) {
  return (
    <span className={styles.party}>
      <Icon name={ICON[party]} size={24} />
      {label}
    </span>
  );
}

function Bubble({
  who,
  icon,
  side,
  strong,
  children,
}: {
  who: string;
  icon: IconName;
  side: "user" | "model";
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cx(styles.bubbleRow, side === "user" ? styles.userRow : styles.modelRow)}>
      <span className={styles.who}>
        <Icon name={icon} size={20} /> {who}
      </span>
      <p className={cx(styles.bubble, side === "user" ? styles.user : styles.model, strong && styles.strong)}>{children}</p>
    </div>
  );
}
