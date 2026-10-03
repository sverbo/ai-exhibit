import { tr } from "@ai-exhibit/presentation-core";
import { Rich } from "../../primitives/Rich.tsx";
import { useMemo } from "react";
import { Disclosure, SceneHeading, cx, l, type L10n, type Locale } from "../../learning/shared/ui.tsx";
import { Icon, type IconName } from "../shared/icons.tsx";
import { JsonBlock } from "./JsonBlock.tsx";
import { WEATHER_STAGES, WEATHER_TEXT, tomorrowIso, toolDefinition, toolResultBlock, toolUseBlock } from "./weather.ts";
import styles from "./WeatherWalkthrough.module.css";

const TEXT = {
  heading: { en: "What “calling a tool” really means" },
  illustrative: { en: "Illustrative data: no real weather service is queried." },
  you: { en: "You" },
  model: { en: "The model" },
  software: { en: "The software" },
  service: { en: "The weather service" },
  prompt: { en: "What happens between the question and the answer?" },
  only: { en: "text, nothing else" },
};

type Party = "you" | "model" | "software" | "service";
const PARTY_ICON: Record<Party, IconName> = { you: "person", model: "chat", software: "server", service: "globe" };

/** Who sends what to whom at each step (1 to 4). */
const FLOW: [Party, Party][] = [
  ["software", "model"],
  ["model", "software"],
  ["software", "model"],
  ["model", "you"],
];
/** Where each JSON sits in the real API exchange. */
const WHERE = ['"tools": [ … ]', '"content": [ … ]', '"content": [ … ]'];

export function WeatherWalkthrough({ step, locale, heading }: { step: number; locale: Locale; heading?: L10n }) {
  const t = (x: L10n) => tr(x, locale);
  const date = useMemo(() => tomorrowIso(), []);
  const blocks = useMemo(() => [toolDefinition(locale), toolUseBlock(date, locale), toolResultBlock(locale)], [locale, date]);
  const stage = step >= 1 ? WEATHER_STAGES[Math.min(4, step) - 1]! : null;
  const json = step >= 1 && step <= 3 ? blocks[step - 1]! : null;
  const party = (p: Party) => t(TEXT[p]);

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <SceneHeading><Rich text={t(heading ?? TEXT.heading)} /></SceneHeading>
        <Disclosure><Rich text={t(TEXT.illustrative)} /></Disclosure>
      </div>

      <p className={styles.question}>
        <span className={styles.who}>
          <Icon name="person" size={30} /> <Rich text={t(TEXT.you)} />
        </span>
        <Rich text={t(WEATHER_TEXT.question)} />
      </p>

      <div className={styles.body}>
        <ol className={styles.track}>
          {WEATHER_STAGES.map((s, i) => {
            const n = i + 1;
            return (
              <li key={n} className={cx(styles.stage, step === n && styles.current, step > n && styles.done)}>
                <span className={styles.num}>{step > n ? <Icon name="check" size={24} strokeWidth={2.6} /> : n}</span>
                <span className={styles.stageText}>
                  <span className={styles.stageTitle}><Rich text={t(s.title)} /></span>
                  <span className={styles.stageFlow}>
                    {party(FLOW[i]![0])} <span aria-hidden="true">→</span> {party(FLOW[i]![1])}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <section className={styles.panel} key={step}>
          {step === 0 && <p className={styles.prompt}><Rich text={t(TEXT.prompt)} /></p>}

          {stage && (
            <div className={styles.flowBar}>
              <Party icon={PARTY_ICON[FLOW[step - 1]![0]]} label={party(FLOW[step - 1]![0])} />
              <span className={styles.arrow} aria-hidden="true" />
              {step === 3 && (
                <>
                  <Party icon="globe" label={party("service")} />
                  <span className={cx(styles.arrow, styles.arrowBack)} aria-hidden="true" />
                </>
              )}
              <Party icon={PARTY_ICON[FLOW[step - 1]![1]]} label={party(FLOW[step - 1]![1])} />
              {json && <code className={styles.where}>{WHERE[step - 1]}</code>}
              {step === 2 && <code className={styles.where}>"stop_reason": "tool_use"</code>}
            </div>
          )}

          {json && stage && <JsonBlock value={json} highlights={stage.highlights} />}

          {step >= 4 && (
            <p className={styles.answer}>
              <span className={styles.who}>
                <Icon name="chat" size={30} /> <Rich text={t(TEXT.model)} />
              </span>
              <Rich text={t(WEATHER_TEXT.answer)} />
            </p>
          )}

          {stage && <p className={cx(styles.caption, step === 2 && styles.insight)}><Rich text={t(stage.caption)} /></p>}
        </section>
      </div>
    </div>
  );
}

function Party({ icon, label }: { icon: IconName; label: string }) {
  return (
    <span className={styles.party}>
      <Icon name={icon} size={30} />
      {label}
    </span>
  );
}
