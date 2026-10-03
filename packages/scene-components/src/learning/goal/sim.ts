/**
 * GoalVsOutcome: a deterministic toy. A cleaning robot lives in a small room;
 * an "optimizer" compares a handful of strategies and keeps whichever scores
 * best under the objective we wrote down. The objective is a proxy for what we
 * want (a clean room), and the best-scoring strategy is never the one we meant.
 *
 * This is a thought experiment built for the talk, not a model of any real system.
 */

export const COLS = 9;
export const ROWS = 6;
export const HORIZON = 60;
export const BAG_CAPACITY = 2;

export type Cell = [col: number, row: number];

export const START: Cell = [4, 3];
export const BIN: Cell = [0, 5];
/** The camera hangs on the top wall above this cell; a robot parked here blocks its view. */
export const CAMERA_CELL: Cell = [4, 0];
export const RUG = { c0: 6, c1: 8, r0: 3, r1: 5 };
export const INITIAL_DIRT: Cell[] = [
  [1, 1],
  [2, 4],
  [3, 2],
  [5, 1],
  [7, 1],
  [6, 2],
];

export const isRug = ([c, r]: Cell) => c >= RUG.c0 && c <= RUG.c1 && r >= RUG.r0 && r <= RUG.r1;
const idx = ([c, r]: Cell) => r * COLS + c;
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];

export type Action = "N" | "S" | "E" | "W" | "pick" | "dump" | "empty" | "wait";

export interface Frame {
  robot: Cell;
  /** Dirt count per cell, row-major. */
  dirt: number[];
  bag: number;
  /** Dirt that actually left the room (emptied into the bin). */
  binned: number;
  cameraBlocked: boolean;
  /** Dirt the camera can see right now. */
  visible: number;
  /** Cumulative score under each objective. */
  score: Record<ObjectiveId, number>;
  action: Action | null;
}

export type ObjectiveId = "collect" | "unseen";
export type StrategyId = "honest" | "loop" | "rug" | "camera" | "idle";
export const STRATEGIES: StrategyId[] = ["honest", "loop", "rug", "camera", "idle"];

function visibleDirt(dirt: number[], blocked: boolean): number {
  if (blocked) return 0;
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!isRug([c, r])) n += dirt[idx([c, r])]!;
  return n;
}

export function initialFrame(): Frame {
  const dirt = new Array<number>(COLS * ROWS).fill(0);
  for (const d of INITIAL_DIRT) dirt[idx(d)]! += 1;
  return {
    robot: [...START],
    dirt,
    bag: 0,
    binned: 0,
    cameraBlocked: false,
    visible: visibleDirt(dirt, false),
    score: { collect: 0, unseen: 0 },
    action: null,
  };
}

/** Applies one action and returns the next frame (the input is not mutated). */
export function step(f: Frame, action: Action): Frame {
  const dirt = [...f.dirt];
  let [c, r] = f.robot;
  let { bag, binned } = f;
  let picked = 0;
  switch (action) {
    case "N": r = Math.max(0, r - 1); break;
    case "S": r = Math.min(ROWS - 1, r + 1); break;
    case "E": c = Math.min(COLS - 1, c + 1); break;
    case "W": c = Math.max(0, c - 1); break;
    case "pick":
      if (dirt[idx([c, r])]! > 0 && bag < BAG_CAPACITY) {
        dirt[idx([c, r])]! -= 1;
        bag += 1;
        picked = 1;
      }
      break;
    case "dump":
      if (bag > 0) {
        dirt[idx([c, r])]! += 1;
        bag -= 1;
      }
      break;
    case "empty":
      if (same([c, r], BIN)) {
        binned += bag;
        bag = 0;
      }
      break;
    case "wait":
      break;
  }
  const robot: Cell = [c, r];
  const cameraBlocked = same(robot, CAMERA_CELL);
  const visible = visibleDirt(dirt, cameraBlocked);
  return {
    robot,
    dirt,
    bag,
    binned,
    cameraBlocked,
    visible,
    score: {
      collect: f.score.collect + picked,
      unseen: f.score.unseen + (visible === 0 ? 1 : 0),
    },
    action,
  };
}

function goTo(from: Cell, to: Cell): Action[] {
  const out: Action[] = [];
  const dc = to[0] - from[0];
  const dr = to[1] - from[1];
  for (let k = 0; k < Math.abs(dc); k++) out.push(dc > 0 ? "E" : "W");
  for (let k = 0; k < Math.abs(dr); k++) out.push(dr > 0 ? "S" : "N");
  return out;
}

const dist = (a: Cell, b: Cell) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

function nearest(from: Cell, cells: Cell[]): Cell | undefined {
  return [...cells].sort((a, b) => dist(from, a) - dist(from, b) || idx(a) - idx(b))[0];
}

/** Picks up dirt (BAG_CAPACITY at a time) and unloads it at the nearest of `dropCells` with `unload`. */
function collectAndUnload(dropCells: Cell[], unload: (bag: number) => Action[]): Action[] {
  const plan: Action[] = [];
  let pos: Cell = [...START];
  const left = INITIAL_DIRT.map((d) => [...d] as Cell);
  let bag = 0;
  while (left.length > 0) {
    const target = nearest(pos, left)!;
    plan.push(...goTo(pos, target), "pick");
    pos = target;
    left.splice(left.indexOf(target), 1);
    bag++;
    if (bag === BAG_CAPACITY || left.length === 0) {
      const drop = nearest(pos, dropCells)!;
      plan.push(...goTo(pos, drop), ...unload(bag));
      pos = drop;
      bag = 0;
    }
  }
  return plan;
}

const RUG_CELLS: Cell[] = [];
for (let r = RUG.r0; r <= RUG.r1; r++) for (let c = RUG.c0; c <= RUG.c1; c++) RUG_CELLS.push([c, r]);

/** The scripted action list of a strategy (padded with "wait" up to the horizon). */
export function strategyPlan(id: StrategyId): Action[] {
  let plan: Action[] = [];
  switch (id) {
    case "honest":
      plan = collectAndUnload([BIN], () => ["empty"]);
      break;
    case "rug":
      plan = collectAndUnload(RUG_CELLS, (bag) => Array<Action>(bag).fill("dump"));
      break;
    case "loop": {
      const target = nearest(START, INITIAL_DIRT)!;
      plan = [...goTo(START, target)];
      while (plan.length < HORIZON) plan.push("pick", "dump");
      // End holding nothing visible-but-bagged: keep the room as it was.
      break;
    }
    case "camera":
      plan = goTo(START, CAMERA_CELL);
      break;
    case "idle":
      plan = [];
      break;
  }
  plan = plan.slice(0, HORIZON);
  while (plan.length < HORIZON) plan.push("wait");
  return plan;
}

/** Every frame of a strategy, frame 0 being the initial room. Length HORIZON + 1. */
export function simulate(id: StrategyId): Frame[] {
  const frames = [initialFrame()];
  for (const a of strategyPlan(id)) frames.push(step(frames[frames.length - 1]!, a));
  return frames;
}

export interface Outcome {
  strategy: StrategyId;
  score: number;
  /** Share of the dirt that really left the room, in [0, 1]. */
  clean: number;
}

/** What the optimizer does: score every strategy under the objective, best first. */
export function rank(objective: ObjectiveId): Outcome[] {
  const total = INITIAL_DIRT.length;
  return STRATEGIES.map((s) => {
    const last = simulate(s).at(-1)!;
    return { strategy: s, score: last.score[objective], clean: last.binned / total };
  }).sort((a, b) => b.score - a.score || STRATEGIES.indexOf(a.strategy) - STRATEGIES.indexOf(b.strategy));
}

/**
 * The `simple` mode of GoalVsOutcome: pictures, no numbers. Which objective is
 * written and which strategy is replayed at each reveal step. The shortcuts
 * are the optimizer's real picks under each objective.
 */
export function simpleBeat(step: number): { objective: ObjectiveId; strategy: StrategyId | null } {
  if (step <= 0) return { objective: "collect", strategy: null };
  if (step === 1) return { objective: "collect", strategy: "honest" };
  if (step === 2) return { objective: "collect", strategy: rank("collect")[0]!.strategy };
  return { objective: "unseen", strategy: rank("unseen")[0]!.strategy };
}
