import { intlLocale, plainText, tr, type Locale } from "@ai-exhibit/presentation-core";
import type { CSSProperties } from "react";
import type { SceneComponentProps } from "../../contract.ts";
import { EvidenceBadge } from "../../primitives/EvidenceBadge.tsx";
import { Rich } from "../../primitives/Rich.tsx";
import {
  BOX_IDS,
  BOXES,
  FRUIT_STEPS,
  FRUITS,
  TEXT,
  WRONG_CONFIDENCE,
  boxShare,
  fruitPlacement,
  fruitView,
  type BoxId,
  type FruitKind,
} from "./fruit.ts";
import styles from "./ApplesAndPears.module.css";

/** Steps a scene using ApplesAndPears declares. */
export const APPLES_AND_PEARS_STEPS = FRUIT_STEPS;

function percent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { style: "percent", maximumFractionDigits: 0 }).format(value);
}

/**
 * ApplesAndPears (no props): the presenter's analogy for training, validation
 * and test sets, scripted click by click (see fruit.ts and the README). No
 * state and no model: every window draws the frame of `ctx.revealStep`; the
 * preview shows the last frame, still.
 */
export function ApplesAndPears({ ctx }: SceneComponentProps<Record<string, never>>) {
  const { locale, role } = ctx;
  const still = role === "preview" || ctx.reducedMotion;
  const view = fruitView(role === "preview" ? FRUIT_STEPS : ctx.revealStep);
  const dimBox = (id: BoxId): boolean =>
    (view.focus === "training" && id !== "training") ||
    (view.focus === "checks" && id === "training") ||
    view.focus === "world";

  return (
    <div className={`${styles.root} ${still ? styles.still : ""}`} data-step={view.step}>
      <div className={styles.captions}>
        {TEXT.captions.map((caption, i) => (
          <p
            key={i}
            className={`${styles.caption} ${i === view.step ? styles.shown : styles.hidden} ${i === TEXT.captions.length - 1 ? styles.lesson : ""}`}
            aria-hidden={i !== view.step}
          >
            <Rich text={tr(caption, locale)} />
          </p>
        ))}
      </div>
      <div className={styles.badge}>
        <EvidenceBadge level="thought-experiment" locale={locale} size="sm" />
      </div>

      {BOX_IDS.map((id) => {
        const r = BOXES[id];
        const checked = view.checked.includes(id);
        return (
          <section
            key={id}
            className={`${styles.box} ${view.split ? styles.shown : styles.hidden} ${dimBox(id) ? styles.dim : ""} ${view.focus === "training" && id === "training" ? styles.focus : ""}`}
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
            data-box={id}
            aria-hidden={!view.split}
          >
            <header className={styles.boxHeader}>
              <h2 className={styles.boxName}>
                <Rich text={tr(TEXT.boxes[id].name, locale)} />
                <span className={styles.share}>{percent(boxShare(id), locale)}</span>
              </h2>
              <p className={styles.boxRole}>
                <Rich text={tr(TEXT.boxes[id].role, locale)} />
              </p>
            </header>
            <p
              className={`${styles.check} ${checked ? styles.shown : styles.hidden}`}
              data-delay={id === "test" ? "" : undefined}
              aria-hidden={!checked}
              aria-label={`${plainText(tr(TEXT.passed, locale))} ${percent(1, locale)}`}
            >
              <Tick />
              <span>{percent(1, locale)}</span>
            </p>
          </section>
        );
      })}

      {BOX_IDS.map((id) => {
        const r = BOXES[id];
        return (
          <p
            key={id}
            className={`${styles.gap} ${view.lesson ? styles.shown : styles.hidden}`}
            style={{ left: r.x, width: r.w, top: r.y + r.h + 14 }}
            aria-hidden={!view.lesson}
          >
            <span className={styles.gapPill}>
              <FruitPicture kind="apple" tone="ghost" className={styles.gapFruit} />
              <span>{tr(TEXT.noGreenApple, locale)}</span>
            </span>
          </p>
        );
      })}

      {FRUITS.map((fruit, i) => {
        const p = fruitPlacement(fruit, view);
        const style: CSSProperties = {
          transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotate}deg) scale(${p.scale})`,
          transitionDelay: still ? undefined : `${i * 35}ms`,
        };
        return (
          <div
            key={fruit.id}
            className={`${styles.fruit} ${view.split && dimBox(fruit.box) ? styles.dim : ""}`}
            style={style} data-fruit={fruit.kind} data-box={view.split ? fruit.box : "pile"}>
            <FruitPicture kind={fruit.kind} tone={fruit.kind === "apple" ? "red" : "green"} className={styles.fruitPicture} />
            <span className={styles.label}>{tr(TEXT.kinds[fruit.kind], locale)}</span>
          </div>
        );
      })}

      <div className={`${styles.modelArea} ${view.model ? styles.shown : styles.hidden} ${view.lesson ? styles.dim : ""}`} aria-hidden={!view.model}>
        <svg className={styles.feed} viewBox="0 0 40 110" aria-hidden="true">
          <path d="M20 4 V92" className={styles.feedLine} />
          <path d="M8 82 L20 98 L32 82" className={styles.feedHead} />
        </svg>
        <div className={styles.model}>
          <Robot className={styles.robot} />
          <span className={styles.modelName}>{tr(TEXT.model, locale)}</span>
        </div>
        <div className={styles.rule}>
          <p className={styles.ruleHeading}>{tr(TEXT.ruleHeading, locale)}</p>
          <p className={styles.ruleRow}>
            <span className={`${styles.swatch} ${styles.swatchGreen}`} aria-hidden="true" />
            <Rich text={tr(TEXT.ruleGreen, locale)} />
          </p>
          <p className={styles.ruleRow}>
            <span className={`${styles.swatch} ${styles.swatchRed}`} aria-hidden="true" />
            <Rich text={tr(TEXT.ruleRed, locale)} />
          </p>
        </div>
      </div>

      <section className={`${styles.world} ${view.world ? styles.shown : styles.hidden}`} aria-hidden={!view.world}>
        <h2 className={styles.worldName}>{tr(TEXT.world, locale)}</h2>
        <div className={styles.worldRow}>
          <FruitPicture kind="apple" tone="green" className={styles.worldFruit} />
          <svg className={styles.worldArrow} viewBox="0 0 90 40" aria-hidden="true">
            <path d="M4 20 H80 M66 8 L82 20 L66 32" />
          </svg>
          <div className={styles.answer}>
            <Robot className={styles.answerRobot} />
            <p className={styles.answerText}>
              <span className={styles.answerWord}>{tr(TEXT.kinds.pear, locale)}</span>
              <span className={styles.answerSure}>{tr(TEXT.sure, locale).replace("{pct}", percent(WRONG_CONFIDENCE, locale))}</span>
            </p>
            <Cross label={plainText(tr(TEXT.wrong, locale))} />
          </div>
        </div>
      </section>
    </div>
  );
}

type Tone = "red" | "green" | "ghost";

/** An apple or a pear, flat, on a 100 x 100 grid. Shape tells them apart; color is the shortcut. */
function FruitPicture({ kind, tone, className }: { kind: FruitKind; tone: Tone; className?: string }) {
  const body =
    kind === "apple"
      ? "M50 30 C39 20 14 21 13 48 C12 72 29 93 42 91 C46 90 48 88 50 88 C52 88 54 90 58 91 C71 93 88 72 87 48 C86 21 61 20 50 30 Z"
      : "M50 13 C42 13 40 23 40 33 C40 44 23 52 21 68 C19 85 34 95 50 95 C66 95 81 85 79 68 C77 52 60 44 60 33 C60 23 58 13 50 13 Z";
  const stem = kind === "apple" ? "M50 31 C50 22 52 15 57 9" : "M50 14 C50 9 52 6 56 3";
  const leaf = kind === "apple" ? "M54 18 C60 8 72 8 76 12 C70 20 60 22 54 18 Z" : "M53 9 C58 2 67 2 71 5 C66 11 58 13 53 9 Z";
  const toneClass = tone === "red" ? styles.red : tone === "green" ? styles.green : styles.ghost;
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" data-kind={kind} data-tone={tone}>
      <path d={stem} className={styles.stem} />
      <path d={leaf} className={tone === "ghost" ? styles.ghostLeaf : styles.leaf} />
      <path d={body} className={toneClass} />
      {tone === "ghost" ? null : (
        <ellipse cx={kind === "apple" ? 31 : 36} cy={kind === "apple" ? 48 : 68} rx="6" ry="11" transform={`rotate(20 ${kind === "apple" ? 31 : 36} ${kind === "apple" ? 48 : 68})`} className={styles.shine} />
      )}
    </svg>
  );
}

/** The model: the same small robot as the other chapters' pictures. */
function Robot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 100" aria-hidden="true">
      <g className={styles.robotBody}>
        <rect x="13" y="0" width="34" height="27" rx="7" />
        <rect x="26" y="25" width="8" height="7" />
        <rect x="6" y="31" width="48" height="37" rx="9" />
        <rect x="11" y="62" width="16" height="38" rx="5" />
        <rect x="33" y="62" width="16" height="38" rx="5" />
      </g>
      <g className={styles.robotCut}>
        <circle cx="23" cy="13" r="4.2" />
        <circle cx="37" cy="13" r="4.2" />
        <rect x="22" y="41" width="16" height="16" rx="3" />
      </g>
    </svg>
  );
}

function Tick() {
  return (
    <svg className={styles.tick} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M9 21 L17 29 L31 12" />
    </svg>
  );
}

function Cross({ label }: { label: string }) {
  return (
    <svg className={styles.cross} viewBox="0 0 80 80" role="img" aria-label={label}>
      <circle cx="40" cy="40" r="37" />
      <path d="M26 26 L54 54 M54 26 L26 54" />
    </svg>
  );
}
