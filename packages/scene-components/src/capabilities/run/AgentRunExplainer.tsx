import { plainText, tr } from "@ai-exhibit/presentation-core";
import { Rich, RichTspans } from "../../primitives/Rich.tsx";
import { useEffect, useMemo } from "react";
import type { ScenarioToolIcon, ToolCall } from "@ai-exhibit/content/assets/scenarios/index.ts";
import { countUpTo } from "@ai-exhibit/content/assets/scenarios/index.ts";
import type { SceneComponentProps } from "../../contract.ts";
import { useSceneState } from "../../learning/shared/sceneState.ts";
import { ControlBar, Disclosure, SceneButton, Segmented, cx, l, type L10n, type Locale } from "../../learning/shared/ui.tsx";
import { CapIcon, CapIconG, type CapIconName } from "../shared/icons.tsx";
import {
  SPEEDS,
  autoplayMayLeave,
  buildScore,
  clampStep,
  getScenario,
  initialRunState,
  stepDuration,
  type AgentRunScenario,
  type RunSpeed,
  type RunState,
  type RunStep,
  type Score,
  type ScoreNode,
} from "./model.ts";
import styles from "./AgentRunExplainer.module.css";

export interface AgentRunExplainerProps {
  scenario: "weekend-trip";
}

const TEXT = {
  request: { en: "Your request" },
  missing: { en: "Scenario not found" },
  sent: { en: "Sends" },
  answer: { en: "Gets back" },
  approve: l("Accepter", "Approve"),
  decline: { en: "Decline" },
  play: { en: "Play" },
  pause: { en: "Pause" },
  restart: { en: "Restart" },
  next: { en: "Next step" },
  prev: { en: "Previous step" },
  speed: { en: "Speed" },
  waiting: { en: "Waiting for your OK" },
  legendYou: { en: "A square: you decide" },
  legendAct: { en: "A circle: the assistant does one thing" },
  legendNow: { en: "The shaded band: where we are now" },
  stepOf: (a: number, b: number): L10n => ({ fr: `Étape ${a} sur ${b}`, en: `Step ${a} of ${b}` }),
};

const SPEED_LABEL: Record<RunSpeed, L10n> = {
  0.6: { en: "Slow" },
  1: { en: "Normal" },
  1.6: { en: "Fast" },
};

const COUNTERS: { key: "toolCalls" | "helpers" | "replans" | "approvals"; one: L10n; many: L10n }[] = [
  { key: "toolCalls", one: { en: "tool call" }, many: { en: "tool calls" } },
  { key: "helpers", one: { en: "helper" }, many: { en: "helpers" } },
  { key: "replans", one: { en: "change of plan" }, many: { en: "changes of plan" } },
  { key: "approvals", one: { en: "approval asked" }, many: { en: "approvals asked" } },
];

const TAG: Record<RunStep["kind"], L10n> = {
  request: { en: "Your request" },
  plan: { en: "Makes a plan" },
  tool: { en: "Uses a tool" },
  spawn: { en: "Splits the work" },
  parallel: { en: "Helpers at work, all at once" },
  merge: { en: "Puts the answers together" },
  replan: { en: "Changes the plan" },
  approval: { en: "Asks you first" },
  result: { en: "Reports back" },
};
const FAILED_TAG = { en: "Something goes wrong" };

const KIND_ICON: Record<RunStep["kind"], CapIconName> = {
  request: "chat",
  plan: "plan",
  tool: "act",
  spawn: "split",
  parallel: "split",
  merge: "merge",
  replan: "replan",
  approval: "hand",
  result: "check",
};

const TOOL_ICON: Record<ScenarioToolIcon, CapIconName> = {
  calendar: "calendar",
  weather: "weather",
  hotel: "hotel",
  map: "pin",
  booking: "card",
  mail: "mail",
};

export function AgentRunExplainer({ props, ctx }: SceneComponentProps<AgentRunExplainerProps, RunState>) {
  const { locale, role, reducedMotion } = ctx;
  const isController = role === "controller";
  const t = (x: L10n) => tr(x, locale);
  const scenario = getScenario(props.scenario ?? "weekend-trip");
  const score = useMemo(() => (scenario ? buildScore(scenario) : null), [scenario]);
  const [state, setState] = useSceneState<RunState>(ctx, initialRunState);

  const step = scenario ? clampStep(ctx.revealStep, scenario) : 0;
  const last = scenario ? scenario.steps.length - 1 : 0;
  const goto = (n: number) => {
    if (!scenario) return;
    ctx.sendCommand({ type: "goto", sceneId: ctx.scene.id, revealStep: clampStep(n, scenario) });
  };

  // Controller clock: autoplay advances the session's reveal step, so every screen follows.
  const current = scenario?.steps[step];
  useEffect(() => {
    if (!isController || !state.playing || !current) return;
    if (step >= last || !autoplayMayLeave(current)) {
      setState((s) => ({ ...s, playing: false }));
      return;
    }
    const id = setTimeout(() => goto(step + 1), stepDuration(current, state.speed));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isController, state.playing, state.speed, step, last]);

  if (!scenario || !score || !current) {
    return (
      <div className={styles.root}>
        <p className={styles.missing}>
          <Rich text={t(TEXT.missing)} />: {String(props.scenario)}
        </p>
      </div>
    );
  }

  const animate = role !== "preview" && !reducedMotion;
  const counts = countUpTo(scenario, step);
  const failed = current.calls?.some((c) => c.outcome === "failed") ?? false;

  return (
    <div className={cx(styles.root, animate && styles.animate)}>
      <header className={styles.head}>
        <div className={cx(styles.request, step === 0 && styles.requestOn)}>
          <span className={styles.requestLabel}>
            <CapIcon name="person" size={24} />
            <Rich text={t(TEXT.request)} />
          </span>
          <p className={styles.requestText}><Rich text={t(scenario.steps[0]!.text!)} /></p>
        </div>
        <div className={styles.side}>
          <Disclosure><Rich text={t(scenario.disclaimer)} /></Disclosure>
          <ul className={styles.counters}>
            {COUNTERS.map((c) => {
              const n = counts[c.key];
              return (
                <li key={c.key} className={cx(styles.counter, n > 0 && styles.counterOn)}>
                  <span className={styles.counterN}>{n}</span>
                  <span className={styles.counterLabel}><Rich text={t(n === 1 ? c.one : c.many)} /></span>
                </li>
              );
            })}
          </ul>
        </div>
      </header>

      <ScoreView scenario={scenario} score={score} step={step} locale={locale} />

      <section className={styles.focus} key={step} aria-live="polite">
        <div className={styles.captionCol}>
          <span className={cx(styles.tag, failed && styles.tagFail)}>
            <CapIcon name={failed ? "cross" : stepIcon(scenario, current)} size={26} />
            <Rich text={t(failed ? FAILED_TAG : TAG[current.kind])} />
          </span>
          <p className={styles.caption}><Rich text={t(current.caption)} /></p>
        </div>
        <div className={styles.detailCol}>
          <Detail
            scenario={scenario}
            step={current}
            locale={locale}
            onApprove={isController ? () => goto(step + 1) : undefined}
          />
        </div>
      </section>

      {isController && (
        <div className={styles.controls}>
          <ControlBar>
            <SceneButton onClick={() => goto(step - 1)} disabled={step <= 0} title={t(TEXT.prev)}>
              <CapIcon name="back" size={22} />
            </SceneButton>
            <SceneButton
              variant="primary"
              onClick={() => {
                if (step >= last) {
                  goto(0);
                  setState((s) => ({ ...s, playing: true }));
                } else setState((s) => ({ ...s, playing: !s.playing }));
              }}
            >
              <span className={styles.btnInner}>
                <CapIcon name={state.playing ? "pause" : "play"} size={22} />
                <Rich text={t(state.playing ? TEXT.pause : step >= last ? TEXT.restart : TEXT.play)} />
              </span>
            </SceneButton>
            <SceneButton onClick={() => goto(step + 1)} disabled={step >= last} title={t(TEXT.next)}>
              <CapIcon name="step" size={22} />
            </SceneButton>
            <Segmented<RunSpeed>
              label={t(TEXT.speed)}
              value={state.speed}
              options={SPEEDS.map((s) => ({ value: s, label: t(SPEED_LABEL[s]) }))}
              onChange={(speed) => setState((s) => ({ ...s, speed }))}
            />
            <span className={styles.stepOf}><Rich text={t(TEXT.stepOf(step + 1, last + 1))} /></span>
          </ControlBar>
        </div>
      )}
    </div>
  );
}

function toolOf(scenario: AgentRunScenario, call: ToolCall) {
  return scenario.tools.find((x) => x.id === call.tool);
}

function stepIcon(scenario: AgentRunScenario, step: RunStep): CapIconName {
  if (step.kind === "tool" && step.calls?.[0]) {
    const tool = toolOf(scenario, step.calls[0]);
    if (tool) return TOOL_ICON[tool.icon];
  }
  return KIND_ICON[step.kind];
}

function nodeIcon(scenario: AgentRunScenario, node: ScoreNode): CapIconName {
  const step = scenario.steps[node.step]!;
  if (node.failed) return "cross";
  const call = node.call !== undefined ? step.calls?.[node.call] : undefined;
  if (call) {
    const tool = toolOf(scenario, call);
    if (tool) return TOOL_ICON[tool.icon];
  }
  return KIND_ICON[step.kind];
}

/* ---------- The score: one lane per actor, one column per step ---------- */

const W = 1792;
const LABEL_W = 236;
const ROW_H = 66;
const TOP = 8;

function ScoreView({ scenario, score, step, locale }: { scenario: AgentRunScenario; score: Score; step: number; locale: Locale }) {
  const n = scenario.steps.length;
  const colW = (W - LABEL_W - 24) / n;
  const H = TOP * 2 + score.rows.length * ROW_H;
  const x = (col: number) => LABEL_W + colW * (col + 0.5);
  const y = (row: number) => TOP + ROW_H * (row + 0.5);
  const radius = (row: number) => (score.rows[row]!.kind === "helper" ? 20 : 25);

  return (
    <svg className={styles.score} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={plainText(tr(scenario.title, locale))}>
      <rect
        className={styles.playhead}
        x={LABEL_W + colW * step + 3}
        y={2}
        width={colW - 6}
        height={H - 4}
        rx={14}
      />
      {score.rows.map((actor, r) => {
        const visible = step >= score.rowFrom[r]!;
        return (
          <g key={actor.id} className={cx(styles.lane, !visible && styles.laneHidden, styles[`lane_${actor.kind}`])}>
            <line x1={LABEL_W - 8} x2={W - 8} y1={y(r)} y2={y(r)} className={styles.laneLine} />
            <text x={0} y={y(r) - (actor.detail ? 4 : -8)} className={styles.laneLabel}>
              <RichTspans text={tr(actor.label, locale)} />
            </text>
            {actor.detail && (
              <text x={0} y={y(r) + 22} className={styles.laneDetail}>
                <RichTspans text={tr(actor.detail, locale)} />
              </text>
            )}
          </g>
        );
      })}

      {score.links.slice(1, step + 1).map((links, i) =>
        links.map((lk, k) => {
          const x1 = x(lk.from.step) + radius(lk.from.row);
          const y1 = y(lk.from.row);
          const x2 = x(lk.to.step) - radius(lk.to.row);
          const y2 = y(lk.to.row);
          const mx = (x1 + x2) / 2;
          const d = y1 === y2 ? `M${x1},${y1} L${x2},${y2}` : `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
          return (
            <path
              key={`${i}-${k}`}
              d={d}
              pathLength={1}
              className={cx(styles.link, lk.to.step === step && styles.linkNew)}
            />
          );
        }),
      )}

      {score.nodes.slice(0, step + 1).map((nodes) =>
        nodes.map((node) => {
          const cxp = x(node.step);
          const cyp = y(node.row);
          const r = radius(node.row);
          const person = score.rows[node.row]!.kind === "person";
          const isCurrent = node.step === step;
          return (
            <g
              key={`${node.step}-${node.row}`}
              className={cx(
                styles.node,
                isCurrent && styles.nodeCurrent,
                node.failed && styles.nodeFailed,
                isCurrent && styles.nodeNew,
              )}
            >
              {person ? (
                <rect x={cxp - r} y={cyp - r} width={r * 2} height={r * 2} rx={9} className={styles.nodeShape} />
              ) : (
                <circle cx={cxp} cy={cyp} r={r} className={styles.nodeShape} />
              )}
              <CapIconG name={nodeIcon(scenario, node)} x={cxp} y={cyp} size={r * 1.12} strokeWidth={2} className={styles.nodeIcon} />
            </g>
          );
        }),
      )}
    </svg>
  );
}

/* ---------- Detail of the current step ---------- */

function Detail({
  scenario,
  step,
  locale,
  onApprove,
}: {
  scenario: AgentRunScenario;
  step: RunStep;
  locale: Locale;
  onApprove?: () => void;
}) {
  const t = (x: L10n) => tr(x, locale);
  const actor = (id: string) => scenario.actors.find((a) => a.id === id);

  switch (step.kind) {
    case "request":
      return (
        <ul className={styles.legend}>
          <li>
            <svg viewBox="0 0 56 56" className={styles.legendMark} aria-hidden="true">
              <rect x="6" y="6" width="44" height="44" rx="9" className={styles.legendPerson} />
            </svg>
            <Rich text={t(TEXT.legendYou)} />
          </li>
          <li>
            <svg viewBox="0 0 56 56" className={styles.legendMark} aria-hidden="true">
              <circle cx="28" cy="28" r="22" className={styles.legendAct} />
            </svg>
            <Rich text={t(TEXT.legendAct)} />
          </li>
          <li>
            <svg viewBox="0 0 56 56" className={styles.legendMark} aria-hidden="true">
              <rect x="10" y="2" width="36" height="52" rx="10" className={styles.legendNow} />
            </svg>
            <Rich text={t(TEXT.legendNow)} />
          </li>
        </ul>
      );

    case "plan":
      return (
        <ol className={styles.plan}>
          {step.items!.map((item, i) => (
            <li key={i} className={styles.planItem} style={{ animationDelay: `${i * 260}ms` }}>
              <Rich text={t(item)} />
            </li>
          ))}
        </ol>
      );

    case "replan":
      return (
        <ul className={styles.plan}>
          <li className={cx(styles.planItem, styles.dropped)}><Rich text={t(step.dropped!)} /></li>
          {step.items!.map((item, i) => (
            <li key={i} className={cx(styles.planItem, styles.added)} style={{ animationDelay: `${500 + i * 260}ms` }}>
              <Rich text={t(item)} />
            </li>
          ))}
        </ul>
      );

    case "tool": {
      const call = step.calls![0]!;
      const tool = toolOf(scenario, call);
      return (
        <article className={cx(styles.call, call.outcome === "failed" && styles.callFailed)}>
          <header className={styles.callHead}>
            {tool && <CapIcon name={TOOL_ICON[tool.icon]} size={34} />}
            <span>{tool ? <Rich text={t(tool.label)} /> : call.tool}</span>
          </header>
          <div className={styles.io}>
            <span className={styles.ioLabel}><Rich text={t(TEXT.sent)} /></span>
            <p className={styles.input}><Rich text={t(call.input)} /></p>
            <span className={cx(styles.ioLabel, styles.reveal)}><Rich text={t(TEXT.answer)} /></span>
            <p className={cx(styles.output, styles.reveal)}>
              {call.outcome === "failed" && <CapIcon name="cross" size={28} className={styles.failIcon} />}
              <Rich text={t(call.output)} />
            </p>
          </div>
        </article>
      );
    }

    case "parallel":
      return (
        <div className={styles.lanes}>
          {step.calls!.map((call, i) => {
            const a = actor(call.actor);
            const tool = toolOf(scenario, call);
            return (
              <article key={i} className={styles.mini}>
                <header className={styles.miniHead}>
                  {tool && <CapIcon name={TOOL_ICON[tool.icon]} size={28} />}
                  <span>{a ? <Rich text={t(a.label)} /> : call.actor}</span>
                  {a?.detail && <span className={styles.miniDetail}><Rich text={t(a.detail)} /></span>}
                </header>
                <p className={styles.miniInput}><Rich text={t(call.input)} /></p>
                <p className={cx(styles.miniOutput, styles.reveal)} style={{ animationDelay: `${900 + i * 120}ms` }}>
                  <Rich text={t(call.output)} />
                </p>
              </article>
            );
          })}
        </div>
      );

    case "spawn":
      return (
        <div className={styles.lanes}>
          {step.spawn!.map((h, i) => {
            const a = actor(h.actor);
            return (
              <article key={h.actor} className={cx(styles.mini, styles.reveal)} style={{ animationDelay: `${i * 220}ms` }}>
                <header className={styles.miniHead}>
                  <CapIcon name="robot" size={28} />
                  <span>{a ? <Rich text={t(a.label)} /> : h.actor}</span>
                </header>
                <p className={styles.miniOutput}><Rich text={t(h.task)} /></p>
              </article>
            );
          })}
        </div>
      );

    case "merge":
      return (
        <div className={styles.merge}>
          <ul className={styles.reports}>
            {step.merge!.map((m) => {
              const a = actor(m.actor);
              return (
                <li key={m.actor} className={cx(styles.report, m.picked && styles.picked)}>
                  <span className={styles.reportWho}>{a ? <Rich text={t(a.detail ?? a.label)} /> : m.actor}</span>
                  <span className={styles.reportText}><Rich text={t(m.summary)} /></span>
                  {m.picked && <CapIcon name="check" size={30} className={styles.pickIcon} />}
                </li>
              );
            })}
          </ul>
          <p className={cx(styles.decision, styles.reveal)}><Rich text={t(step.text!)} /></p>
        </div>
      );

    case "approval":
      return (
        <article className={styles.approval}>
          <header className={styles.approvalHead}>
            <CapIcon name="lock" size={32} />
            <span><Rich text={t(step.text!)} /></span>
          </header>
          <ul className={styles.approvalItems}>
            {step.items!.map((item, i) => (
              <li key={i}><Rich text={t(item)} /></li>
            ))}
          </ul>
          <div className={styles.approvalButtons}>
            {onApprove ? (
              <SceneButton variant="primary" onClick={onApprove}>
                <span className={styles.btnInner}>
                  <CapIcon name="check" size={22} />
                  <Rich text={t(TEXT.approve)} />
                </span>
              </SceneButton>
            ) : (
              <span className={cx(styles.pill, styles.pillYes)}>
                <CapIcon name="check" size={22} />
                <Rich text={t(TEXT.approve)} />
              </span>
            )}
            <span className={styles.pill}>
              <CapIcon name="cross" size={22} />
              <Rich text={t(TEXT.decline)} />
            </span>
            <span className={styles.waiting}><Rich text={t(TEXT.waiting)} /></span>
          </div>
        </article>
      );

    case "result":
      return (
        <article className={styles.result}>
          <CapIcon name="check" size={40} className={styles.resultIcon} />
          <p className={styles.resultText}><Rich text={t(step.text!)} /></p>
        </article>
      );
  }
}
