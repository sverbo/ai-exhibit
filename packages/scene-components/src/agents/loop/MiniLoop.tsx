import { tr } from "@ai-exhibit/presentation-core";
import { Rich } from "../../primitives/Rich.tsx";
import { cx, type L10n, type Locale } from "../../learning/shared/ui.tsx";
import { LoopRing, usePulse, type RingGeometry } from "./LoopRing.tsx";
import styles from "./MiniLoop.module.css";

/**
 * The agent loop in small, with who does what: the model plans (accent; planning
 * again is just the next turn), ordinary software acts and reads the result
 * (accent-2). A pulse goes round, so it reads as a loop. Drawn at the end of a
 * run (01-one-request) to name the pattern the run just followed.
 */

const G: RingGeometry = { cx: 330, cy: 320, r: 190, node: 64, goal: 78 };
/** Seconds per turn of the pulse. */
const TURN_S = 6;
const ROLE_R = G.r + G.node + 30;

/** Arc around the ring center, clockwise from angle a1 to a2 (degrees). */
function arcAround(r: number, a1: number, a2: number): string {
  const p = (a: number) => [G.cx + r * Math.cos((a * Math.PI) / 180), G.cy + r * Math.sin((a * Math.PI) / 180)];
  const [x1, y1] = p(a1);
  const [x2, y2] = p(a2);
  const large = (((a2 - a1) % 360) + 360) % 360 > 180 ? 1 : 0;
  return `M${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

const TEXT = {
  model: { en: "The model plans, then plans again" },
  software: { en: "Ordinary software acts and reads the result" },
  you: { en: "You give the goal" },
};

export function MiniLoop({ locale, animate, className }: { locale: Locale; animate: boolean; className?: string }) {
  const t = (x: L10n) => tr(x, locale);
  const pulse = usePulse(animate, TURN_S);
  return (
    <div className={cx(styles.root, className)}>
      <svg className={styles.svg} viewBox="0 0 660 620" aria-hidden="true">
        <LoopRing geometry={G} locale={locale} pulseAngle={pulse} />
        {/* Plan (top): the model. Act and observe (lower right, lower left): the software. */}
        <path d={arcAround(ROLE_R, -122, -58)} className={cx(styles.roleArc, styles.model)} />
        <path d={arcAround(ROLE_R, 2, 178)} className={cx(styles.roleArc, styles.software)} />
      </svg>
      <ul className={styles.legend}>
        <li className={styles.model}>
          <Rich text={t(TEXT.model)} />
        </li>
        <li className={styles.software}>
          <Rich text={t(TEXT.software)} />
        </li>
        <li className={styles.you}>
          <Rich text={t(TEXT.you)} />
        </li>
      </ul>
    </div>
  );
}
