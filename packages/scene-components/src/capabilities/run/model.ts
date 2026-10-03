import {
  getScenario,
  type AgentRunScenario,
  type RunStep,
  type ScenarioActor,
} from "@ai-exhibit/content/assets/scenarios/index.ts";

export type { AgentRunScenario, RunStep, ScenarioActor };
export { getScenario };

/** Shared state: small, owned by the controller. The step index itself is the session's reveal step. */
export interface RunState {
  playing: boolean;
  speed: RunSpeed;
}
export type RunSpeed = 0.6 | 1 | 1.6;
export const SPEEDS: RunSpeed[] = [0.6, 1, 1.6];

export const initialRunState = (): RunState => ({ playing: false, speed: 1 });

/** One mark on the score: a step seen in one actor's lane. */
export interface ScoreNode {
  step: number;
  row: number;
  /** Index of the call this node stands for, when the step has calls. */
  call?: number;
  failed: boolean;
}

export interface ScoreLink {
  from: ScoreNode;
  to: ScoreNode;
}

export interface Score {
  rows: ScenarioActor[];
  /** First step at which each row is visible (helpers appear when started). */
  rowFrom: number[];
  nodes: ScoreNode[][];
  /** links[i]: links arriving at step i. */
  links: ScoreLink[][];
}

/** Lane order: the person, the assistant, then helpers in their declared order. */
export function laneOrder(s: AgentRunScenario): ScenarioActor[] {
  const rank = { person: 0, assistant: 1, helper: 2 } as const;
  return [...s.actors].sort((a, b) => rank[a.kind] - rank[b.kind]);
}

/** Lays the run out as a score: one lane per actor, one column per step. */
export function buildScore(s: AgentRunScenario): Score {
  const rows = laneOrder(s);
  const rowOf = (id: string) => Math.max(0, rows.findIndex((a) => a.id === id));
  const person = rows.findIndex((a) => a.kind === "person");

  const nodes: ScoreNode[][] = s.steps.map((step, i) => {
    if (step.kind === "request" || step.kind === "approval" || step.kind === "result") {
      return [{ step: i, row: person, failed: false }];
    }
    if (step.calls?.length) {
      return step.calls.map((c, k) => ({ step: i, row: rowOf(c.actor), call: k, failed: c.outcome === "failed" }));
    }
    return [{ step: i, row: rowOf(step.actor), failed: false }];
  });

  const links: ScoreLink[][] = nodes.map((cur, i) => {
    if (i === 0) return [];
    const prev = nodes[i - 1]!;
    if (prev.length > 1 && cur.length > 1) {
      return cur.flatMap((to) => {
        const from = prev.find((p) => p.row === to.row);
        return from ? [{ from, to }] : [];
      });
    }
    return prev.flatMap((from) => cur.map((to) => ({ from, to })));
  });

  const rowFrom = rows.map((a) => {
    if (a.kind !== "helper") return 0;
    const at = s.steps.findIndex((st) => st.spawn?.some((h) => h.actor === a.id));
    return at < 0 ? 0 : at;
  });

  return { rows, rowFrom, nodes, links };
}

/** Clamps a reveal step to the scenario. */
export function clampStep(step: number, s: AgentRunScenario): number {
  return Math.max(0, Math.min(s.steps.length - 1, Math.floor(step)));
}

/** How long autoplay stays on a step, in ms. Long enough to read the caption aloud. */
export function stepDuration(step: RunStep, speed: RunSpeed): number {
  const caption = Math.max(...Object.values(step.caption).map((c) => c?.length ?? 0));
  const extra = step.calls ? 1600 : step.kind === "result" ? 2500 : 0;
  return Math.round((2600 + Math.min(5200, caption * 40) + extra) / speed);
}

/**
 * Autoplay stops before leaving a step that waits for the person: the approval
 * gate is a human decision, so the presenter has to click it through.
 */
export function autoplayMayLeave(step: RunStep): boolean {
  return step.kind !== "approval";
}
