import { tr } from "@ai-exhibit/presentation-core";
import { RichTspans } from "../../primitives/Rich.tsx";
import { useEffect, useState } from "react";
import { cx, l, type L10n, type Locale } from "../../learning/shared/ui.tsx";
import { IconG, type IconName } from "../shared/icons.tsx";
import styles from "./LoopRing.module.css";

/**
 * The agent loop, drawn once and reused everywhere (0.5, 5.3, 8.1 and the trace
 * replays): a goal at the center, four stages on a ring. Labels never change
 * between uses, so the audience recognises the same diagram each time.
 */

export type LoopStage = "goal" | "plan" | "act" | "observe" | "replan";
export const RING_STAGES: Exclude<LoopStage, "goal">[] = ["plan", "act", "observe", "replan"];

export const STAGE_LABEL: Record<LoopStage, L10n> = {
  goal: { en: "Goal" },
  plan: { en: "Plan" },
  act: { en: "Act" },
  observe: { en: "Observe" },
  replan: { en: "Re-plan" },
};

export const STAGE_GLOSS: Record<LoopStage, L10n> = {
  goal: { en: "what it was asked to do" },
  plan: { en: "decide the next step" },
  act: { en: "use a tool" },
  observe: { en: "read the result" },
  replan: { en: "adjust the plan" },
};

const ICON: Record<LoopStage, IconName> = {
  goal: "goal",
  plan: "plan",
  act: "act",
  observe: "observe",
  replan: "replan",
};

/** Ring angle of each stage, in degrees, clockwise from the right. */
const ANGLE: Record<Exclude<LoopStage, "goal">, number> = { plan: -90, act: 0, observe: 90, replan: 180 };

export interface RingGeometry {
  cx: number;
  cy: number;
  r: number;
  node: number;
  goal: number;
}

export function stagePos(g: RingGeometry, s: LoopStage): [number, number] {
  if (s === "goal") return [g.cx, g.cy];
  const a = (ANGLE[s] * Math.PI) / 180;
  return [g.cx + g.r * Math.cos(a), g.cy + g.r * Math.sin(a)];
}

/** Drives the travelling pulse: returns the pulse angle in degrees, or null when still. */
export function usePulse(active: boolean, secondsPerTurn: number): number | null {
  const [angle, setAngle] = useState<number | null>(null);
  useEffect(() => {
    if (!active) {
      setAngle(null);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const turns = (now - t0) / 1000 / secondsPerTurn;
      setAngle(-90 + (turns % 1) * 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, secondsPerTurn]);
  return angle;
}

/** Which ring stage the pulse is passing, if any. */
function stageAt(angle: number | null): LoopStage | null {
  if (angle === null) return null;
  for (const s of RING_STAGES) {
    const d = Math.abs(((angle - ANGLE[s] + 540) % 360) - 180);
    if (d < 26) return s;
  }
  return null;
}

export function LoopRing({
  geometry: g,
  locale,
  revealed = 5,
  pulseAngle = null,
  highlight = null,
  glosses = false,
  dimOthers = false,
  goalText,
}: {
  geometry: RingGeometry;
  locale: Locale;
  /** How many stages are visible, in order goal, plan, act, observe, replan (0..5). */
  revealed?: number;
  /** Angle of the travelling pulse (see usePulse); null = no pulse. */
  pulseAngle?: number | null;
  /** A stage to light up (trace replays). */
  highlight?: LoopStage | null;
  glosses?: boolean;
  /** Fade stages that are not highlighted. */
  dimOthers?: boolean;
  goalText?: string;
}) {
  const t = (x: L10n) => tr(x, locale);
  const order: LoopStage[] = ["goal", ...RING_STAGES];
  const visible = (s: LoopStage) => order.indexOf(s) < revealed;
  const lit = highlight ?? stageAt(pulseAngle);
  const ringClosed = revealed >= 5;

  // Arcs between consecutive ring stages (the last one closes the loop).
  const gap = (g.node + 14) / g.r; // radians kept clear around each node
  const arc = (from: Exclude<LoopStage, "goal">, to: Exclude<LoopStage, "goal">) => {
    const a1 = (ANGLE[from] * Math.PI) / 180 + gap;
    let a2 = (ANGLE[to] * Math.PI) / 180 - gap;
    if (a2 < a1) a2 += Math.PI * 2;
    const p1 = [g.cx + g.r * Math.cos(a1), g.cy + g.r * Math.sin(a1)];
    const p2 = [g.cx + g.r * Math.cos(a2), g.cy + g.r * Math.sin(a2)];
    return `M${p1[0]} ${p1[1]} A ${g.r} ${g.r} 0 0 1 ${p2[0]} ${p2[1]}`;
  };
  const arcs: [Exclude<LoopStage, "goal">, Exclude<LoopStage, "goal">, boolean][] = [
    ["plan", "act", visible("act")],
    ["act", "observe", visible("observe")],
    ["observe", "replan", visible("replan")],
    ["replan", "plan", ringClosed],
  ];

  const [px, py] = stagePos(g, "plan");
  const markerId = `loop-arrow-${Math.round(g.r)}`;
  const pulse =
    pulseAngle === null
      ? null
      : [g.cx + g.r * Math.cos((pulseAngle * Math.PI) / 180), g.cy + g.r * Math.sin((pulseAngle * Math.PI) / 180)];

  return (
    <g className={styles.ring}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className={styles.arrowHead} />
        </marker>
      </defs>

      <circle cx={g.cx} cy={g.cy} r={g.r} className={cx(styles.track, ringClosed && styles.trackOn)} />

      {arcs.map(([a, b, on]) => (
        <path key={`${a}-${b}`} d={arc(a, b)} className={cx(styles.arc, on && styles.on)} markerEnd={`url(#${markerId})`} />
      ))}

      {/* Goal feeds the first plan. */}
      <line
        x1={g.cx}
        y1={g.cy - g.goal - 8}
        x2={px}
        y2={py + g.node + 12}
        className={cx(styles.arc, visible("plan") && styles.on)}
        markerEnd={`url(#${markerId})`}
      />

      {pulse && <circle cx={pulse[0]} cy={pulse[1]} r={14} className={styles.pulse} />}

      {order.map((s) => {
        const [x, y] = stagePos(g, s);
        const r = s === "goal" ? g.goal : g.node;
        const isLit = lit === s;
        return (
          <g
            key={s}
            className={cx(
              styles.stage,
              s === "goal" && styles.goal,
              visible(s) && styles.on,
              isLit && styles.lit,
              dimOthers && lit && !isLit && styles.dim,
            )}
          >
            <circle cx={x} cy={y} r={r} className={styles.disc} />
            <IconG name={ICON[s]} x={x} y={y - r * 0.22} size={r * 0.6} strokeWidth={1.7} className={styles.icon} />
            <text x={x} y={y + r * 0.42} className={styles.label} style={{ fontSize: Math.round(r * 0.3) }}>
              <RichTspans text={t(STAGE_LABEL[s])} />
            </text>
            {glosses && s !== "goal" && (
              <text
                x={x + (s === "act" ? r + 24 : s === "replan" ? -r - 24 : 0)}
                y={y + (s === "plan" ? -r - 22 : s === "observe" ? r + 44 : 10)}
                className={cx(styles.gloss, s === "act" && styles.glossStart, s === "replan" && styles.glossEnd)}
              >
                <RichTspans text={t(STAGE_GLOSS[s])} />
              </text>
            )}
            {s === "goal" && goalText && (
              <text x={x} y={y + r + 46} className={styles.goalText}>
                <RichTspans text={goalText} />
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
