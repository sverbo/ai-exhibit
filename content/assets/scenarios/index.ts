/**
 * Agent run scenarios replayed by the AgentRunExplainer scene component.
 *
 * Every scenario here is an ILLUSTRATIVE RECONSTRUCTION written for the talk.
 * None is a recording of a real product, model or session: people, hotels,
 * prices, forecasts and outputs are invented to show the shape of an agent
 * run. Each scenario says so in `illustrative`, `provenance` and `disclaimer`,
 * and the component keeps the disclaimer on screen.
 */
import type { L10n } from "@ai-exhibit/presentation-core";
import { weekendTrip } from "./weekend-trip.ts";

/** Icons the component knows how to draw for tools. */
export type ScenarioToolIcon = "calendar" | "weather" | "hotel" | "map" | "booking" | "mail";

export interface ScenarioActor {
  id: string;
  kind: "person" | "assistant" | "helper";
  label: L10n;
  /** Short assignment shown under the label, e.g. "7-8 Nov" for a helper. */
  detail?: L10n;
}

export interface ScenarioTool {
  id: string;
  /** Plain name, e.g. "Weather forecast". */
  label: L10n;
  icon: ScenarioToolIcon;
}

export interface ToolCall {
  /** Actor that makes the call. */
  actor: string;
  tool: string;
  /** What the actor sends to the tool, in plain words. */
  input: L10n;
  /** What comes back. */
  output: L10n;
  outcome: "ok" | "failed";
  /** Spends money or acts in the user's name: only allowed after an approval step. */
  needsApproval?: boolean;
}

export type RunStepKind =
  | "request"
  | "plan"
  | "tool"
  | "spawn"
  | "parallel"
  | "merge"
  | "replan"
  | "approval"
  | "result";

export const RUN_STEP_KINDS: RunStepKind[] = [
  "request",
  "plan",
  "tool",
  "spawn",
  "parallel",
  "merge",
  "replan",
  "approval",
  "result",
];

export interface RunStep {
  kind: RunStepKind;
  /** Who acts at this step (for "parallel", the helpers are in `calls`). */
  actor: string;
  /** Plain-language caption: what is happening, for someone who never heard of tools. */
  caption: L10n;
  /** "tool": exactly one call. "parallel": one call per helper. */
  calls?: ToolCall[];
  /** "plan", "replan", "approval": list items. */
  items?: L10n[];
  /** "replan": the plan item that is dropped. */
  dropped?: L10n;
  /** "spawn": helpers started, with their assignment. */
  spawn?: { actor: string; task: L10n }[];
  /** "merge": what each helper reported, and which one wins. */
  merge?: { actor: string; summary: L10n; picked: boolean }[];
  /** "request": the request. "merge": the decision. "approval": the question. "result": the summary. */
  text?: L10n;
}

export interface AgentRunScenario {
  id: string;
  title: L10n;
  /** Always true: these are reconstructions, not recordings. */
  illustrative: true;
  /** English note on where the scenario comes from. */
  provenance: string;
  /** Shown on screen during the whole replay. */
  disclaimer: L10n;
  actors: ScenarioActor[];
  tools: ScenarioTool[];
  steps: RunStep[];
}

export const SCENARIOS: Record<string, AgentRunScenario> = {
  "weekend-trip": weekendTrip,
};

export function getScenario(id: string): AgentRunScenario | undefined {
  return SCENARIOS[id];
}

const hasBoth = (t: L10n | undefined) => Boolean(t?.fr?.trim() && t?.en?.trim());

/** Structural problems in a scenario (empty when valid). */
export function validateScenario(s: AgentRunScenario): string[] {
  const problems: string[] = [];
  const actors = new Set(s.actors.map((a) => a.id));
  const tools = new Set(s.tools.map((t) => t.id));
  const p = (i: number, msg: string) => problems.push(`${s.id}#${i}: ${msg}`);

  if (s.illustrative !== true) problems.push(`${s.id}: must be marked illustrative`);
  if (!hasBoth(s.disclaimer)) problems.push(`${s.id}: missing disclaimer`);
  if (!hasBoth(s.title)) problems.push(`${s.id}: missing title`);
  if (actors.size !== s.actors.length) problems.push(`${s.id}: duplicate actor ids`);
  if (s.actors.filter((a) => a.kind === "person").length !== 1) problems.push(`${s.id}: needs exactly one person`);
  if (s.actors.filter((a) => a.kind === "assistant").length !== 1) problems.push(`${s.id}: needs exactly one assistant`);
  for (const a of s.actors) if (!hasBoth(a.label)) problems.push(`${s.id}: actor ${a.id} label missing in a locale`);
  for (const t of s.tools) if (!hasBoth(t.label)) problems.push(`${s.id}: tool ${t.id} label missing in a locale`);
  if (s.steps[0]?.kind !== "request") problems.push(`${s.id}: must start with a request`);
  if (s.steps.at(-1)?.kind !== "result") problems.push(`${s.id}: must end with a result`);

  const spawned = new Set<string>();
  s.steps.forEach((step, i) => {
    if (!RUN_STEP_KINDS.includes(step.kind)) p(i, `unknown kind ${step.kind}`);
    if (!actors.has(step.actor)) p(i, `unknown actor ${step.actor}`);
    if (!hasBoth(step.caption)) p(i, "caption missing in a locale");
    for (const item of step.items ?? []) if (!hasBoth(item)) p(i, "item missing in a locale");
    for (const call of step.calls ?? []) {
      if (!actors.has(call.actor)) p(i, `call by unknown actor ${call.actor}`);
      if (!tools.has(call.tool)) p(i, `unknown tool ${call.tool}`);
      if (!hasBoth(call.input) || !hasBoth(call.output)) p(i, "call input/output missing in a locale");
      const kind = s.actors.find((a) => a.id === call.actor)?.kind;
      if (kind === "helper" && !spawned.has(call.actor)) p(i, `helper ${call.actor} used before it is started`);
      if (kind === "person") p(i, "the person does not call tools");
    }
    switch (step.kind) {
      case "request":
      case "result":
        if (!hasBoth(step.text)) p(i, `${step.kind} needs text`);
        break;
      case "plan":
        if (!step.items?.length) p(i, "plan needs items");
        break;
      case "replan":
        if (!step.items?.length || !hasBoth(step.dropped)) p(i, "replan needs items and a dropped item");
        if (s.steps[i - 1]?.calls?.some((c) => c.outcome === "failed") !== true) p(i, "replan must follow a failed call");
        break;
      case "tool":
        if (step.calls?.length !== 1) p(i, "tool needs exactly one call");
        else if (step.calls[0]!.actor !== step.actor) p(i, "tool call actor must be the step actor");
        break;
      case "parallel":
        if ((step.calls?.length ?? 0) < 2) p(i, "parallel needs at least two calls");
        if (new Set(step.calls?.map((c) => c.actor)).size !== step.calls?.length) p(i, "parallel calls need distinct actors");
        break;
      case "spawn":
        if ((step.spawn?.length ?? 0) < 2) p(i, "spawn needs at least two helpers");
        for (const h of step.spawn ?? []) {
          if (s.actors.find((a) => a.id === h.actor)?.kind !== "helper") p(i, `spawned ${h.actor} is not a helper`);
          if (!hasBoth(h.task)) p(i, "spawn task missing in a locale");
          spawned.add(h.actor);
        }
        break;
      case "merge":
        if (!step.merge?.length || !hasBoth(step.text)) p(i, "merge needs reports and a decision");
        if (step.merge && step.merge.filter((m) => m.picked).length !== 1) p(i, "merge must pick exactly one report");
        for (const m of step.merge ?? []) if (!spawned.has(m.actor)) p(i, `merge from helper ${m.actor} never started`);
        break;
      case "approval":
        if (!hasBoth(step.text) || !step.items?.length) p(i, "approval needs a question and items");
        if (s.actors.find((a) => a.id === step.actor)?.kind !== "person") p(i, "approval is given by the person");
        break;
    }
  });

  // Paying or writing in the user's name must come after an approval step.
  const firstApproval = s.steps.findIndex((st) => st.kind === "approval");
  s.steps.forEach((step, i) => {
    if (step.calls?.some((c) => c.needsApproval) && (firstApproval < 0 || i < firstApproval)) {
      p(i, "action that needs approval runs before the approval step");
    }
  });

  if (/[\u2013\u2014]/.test(JSON.stringify(s))) problems.push(`${s.id}: contains an en or em dash`);
  return problems;
}

/** Counters shown on screen, derived from the data so they always match it. */
export interface RunCounts {
  toolCalls: number;
  helpers: number;
  replans: number;
  approvals: number;
  failures: number;
}

export function countUpTo(s: AgentRunScenario, stepIndex: number): RunCounts {
  const c: RunCounts = { toolCalls: 0, helpers: 0, replans: 0, approvals: 0, failures: 0 };
  s.steps.slice(0, stepIndex + 1).forEach((step) => {
    c.toolCalls += step.calls?.length ?? 0;
    c.failures += step.calls?.filter((x) => x.outcome === "failed").length ?? 0;
    c.helpers += step.spawn?.length ?? 0;
    if (step.kind === "replan") c.replans += 1;
    if (step.kind === "approval") c.approvals += 1;
  });
  return c;
}
