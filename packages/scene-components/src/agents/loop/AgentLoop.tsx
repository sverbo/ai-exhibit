import { plainText, tr } from "@ai-exhibit/presentation-core";
import { Rich, RichTspans } from "../../primitives/Rich.tsx";
import type { SceneComponentProps } from "../../contract.ts";
import { SceneHeading, cx, l, type L10n } from "../../learning/shared/ui.tsx";
import { IconG, type IconName } from "../shared/icons.tsx";
import { LoopRing, STAGE_GLOSS, STAGE_LABEL, stagePos, usePulse, type LoopStage, type RingGeometry } from "./LoopRing.tsx";
import styles from "./AgentLoop.module.css";

export type AgentLoopVariant = "intro" | "tools" | "high-stakes";

export interface AgentLoopProps {
  variant?: AgentLoopVariant;
  heading?: L10n;
  /** Optional example goal shown under the center (e.g. "Organize my weekend in Lyon"). */
  goal?: L10n;
}

const G: RingGeometry = { cx: 640, cy: 630, r: 290, node: 84, goal: 102 };

/** SVG arc around the ring center, clockwise from angle a1 to a2 (degrees). */
function arcAround(r: number, a1: number, a2: number): string {
  const p = (a: number) => [G.cx + r * Math.cos((a * Math.PI) / 180), G.cy + r * Math.sin((a * Math.PI) / 180)];
  const [x1, y1] = p(a1);
  const [x2, y2] = p(a2);
  const large = (((a2 - a1) % 360) + 360) % 360 > 180 ? 1 : 0;
  return `M${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

const TEXT = {
  heading: {
    intro: { en: "A loop, not an answer" },
    tools: { en: "Tools inside the loop" },
    "high-stakes": { en: "The same loop, with real levers" },
  } satisfies Record<AgentLoopVariant, L10n>,
  introSub: [
    { en: "It is given a goal." },
    { en: "It decides on a first step." },
    { en: "It acts." },
    { en: "It looks at what happened." },
    { en: "It adjusts its plan, and the loop goes around again until the goal is met." },
    { en: "An agent: a model placed inside a loop, with tools and a memory of what has happened so far." },
  ],
  toolsSub: [
    { en: "The loop from the start." },
    { en: "“Act” means picking a tool and using it." },
  ],
  stakesSub: [
    { en: "The same loop." },
    { en: "But this time, with broad access." },
    { en: "Every turn of the loop can change something in the world." },
  ],
  role: {
    you: { en: "you" },
    model: { en: "the model" },
    software: { en: "the software" },
  },
  access: { en: "Access" },
  world: { en: "In the real world" },
};

interface Satellite {
  icon: IconName;
  label: L10n;
}

const TOOLS: Satellite[] = [
  { icon: "search", label: { en: "Web search" } },
  { icon: "browser", label: { en: "Browser" } },
  { icon: "code", label: { en: "Run code" } },
  { icon: "file", label: { en: "Files" } },
  { icon: "calculator", label: { en: "Calculator" } },
];

const ACCESS: Satellite[] = [
  { icon: "money", label: { en: "Bank account" } },
  { icon: "mail", label: l("Messagerie", "Email") },
  { icon: "terminal", label: { en: "Terminal" } },
  { icon: "server", label: { en: "Production servers" } },
  { icon: "globe", label: { en: "The internet" } },
];

const EFFECTS: L10n[] = [
  { en: "Payments sent" },
  { en: "Emails in your name" },
  { en: "Files deleted" },
  { en: "Services changed" },
  { en: "Posts published" },
];

const LEGEND: LoopStage[] = ["goal", "plan", "act", "observe", "replan"];
const ROLE: Record<LoopStage, "you" | "model" | "software"> = {
  goal: "you",
  plan: "model",
  act: "software",
  observe: "software",
  replan: "model",
};

const FAN_R = 236;
const FAN_ANGLES = [-62, -31, 0, 31, 62];

export function AgentLoop({ props, ctx }: SceneComponentProps<AgentLoopProps>) {
  const variant: AgentLoopVariant =
    props.variant === "tools" || props.variant === "high-stakes" ? props.variant : "intro";
  const { locale, revealStep, role, reducedMotion } = ctx;
  const t = (x: L10n) => tr(x, locale);

  const step = Math.max(0, revealStep);
  const revealed = variant === "intro" ? Math.min(5, step + 1) : 5;
  const cycling = variant === "intro" ? step >= 4 : true;
  const fast = variant === "high-stakes" && step >= 2;
  const pulse = usePulse(cycling && role !== "preview" && !reducedMotion, fast ? 3.6 : 7);

  const subs = variant === "intro" ? TEXT.introSub : variant === "tools" ? TEXT.toolsSub : TEXT.stakesSub;
  const sub = subs[Math.min(subs.length - 1, step)]!;

  const satellites = variant === "tools" ? TOOLS : variant === "high-stakes" ? ACCESS : [];
  const showSatellites = variant !== "intro" && step >= 1;
  const showEffects = variant === "high-stakes" && step >= 2;
  const showRoles = variant === "intro" && step >= 5;

  const [ax, ay] = stagePos(G, "act");
  const fan = FAN_ANGLES.map((deg) => {
    const a = (deg * Math.PI) / 180;
    return [ax + FAN_R * Math.cos(a), ay + FAN_R * Math.sin(a)] as const;
  });

  return (
    <div className={cx(styles.root, variant === "high-stakes" && styles.stakes)}>
      <div className={styles.head}>
        <SceneHeading sub={<Rich text={t(sub)} />}>
          <Rich text={t(props.heading ?? TEXT.heading[variant])} />
        </SceneHeading>
      </div>

      <svg className={styles.svg} viewBox="0 0 1920 1080" role="img" aria-label={plainText(t(props.heading ?? TEXT.heading[variant]))}>
        {/* Satellites around "Act": tools, or broad access. */}
        <g className={cx(styles.fade, showSatellites && styles.on)}>
          {satellites.map((s, i) => {
            const [x, y] = fan[i]!;
            return (
              <g key={i}>
                <line x1={ax + G.node + 6} y1={ay} x2={x - 46} y2={y} className={cx(styles.spoke, variant === "high-stakes" && styles.spokeHot)} />
                <circle cx={x} cy={y} r={44} className={cx(styles.sat, variant === "high-stakes" && styles.satHot)} />
                <IconG name={s.icon} x={x} y={y} size={44} className={styles.satIcon} />
                <text x={x + 62} y={y + 10} className={styles.satLabel}>
                  <RichTspans text={t(s.label)} />
                </text>
              </g>
            );
          })}
        </g>

        {/* Real-world effects. */}
        <g className={cx(styles.fade, showEffects && styles.on)}>
          <line x1={1536} y1={300} x2={1536} y2={300 + EFFECTS.length * 108 - 38} className={styles.worldBar} />
          <text x={1560} y={270} className={styles.worldTitle}>
            <RichTspans text={t(TEXT.world)} />
          </text>
          {EFFECTS.map((e, i) => (
            <text key={i} x={1560} y={340 + i * 108} className={styles.effectText}>
              <RichTspans text={t(e)} />
            </text>
          ))}
        </g>

        <LoopRing
          geometry={G}
          locale={locale}
          revealed={revealed}
          pulseAngle={pulse}
          glosses={false}
          goalText={props.goal ? t(props.goal) : undefined}
        />

        {/* Who does what: the model decides, the software acts. */}
        <g className={cx(styles.fade, showRoles && styles.on)}>
          <path d={arcAround(G.r + G.node + 40, 168, 282)} className={styles.roleArc} />
          <path d={arcAround(G.r + G.node + 40, -12, 102)} className={cx(styles.roleArc, styles.roleArc2)} />
        </g>

        {/* Intro: the stages explained in plain words, on the right. */}
        {variant === "intro" &&
          LEGEND.map((stage, i) => {
            const y = 330 + i * 124;
            const role = ROLE[stage];
            return (
              <g key={stage} className={cx(styles.fade, i < revealed && styles.on)}>
                <circle cx={1220} cy={y} r={34} className={styles.legendDisc} />
                <IconG name={stage === "act" ? "act" : stage} x={1220} y={y} size={34} className={styles.legendIcon} />
                <text x={1280} y={y - 4} className={styles.legendLabel}>
                  <RichTspans text={t(STAGE_LABEL[stage])} />
                  {showRoles && (
                    <tspan dx={18} className={cx(styles.roleTag, styles[`role_${role}`])}>
                      <RichTspans text={t(TEXT.role[role])} />
                    </tspan>
                  )}
                </text>
                <text x={1280} y={y + 34} className={styles.legendGloss}>
                  <RichTspans text={t(STAGE_GLOSS[stage])} />
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
}
