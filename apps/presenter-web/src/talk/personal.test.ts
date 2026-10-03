import { describe, expect, it } from "vitest";
import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { navCommand } from "../control/navigation.ts";
import { computePace } from "../control/pace.ts";
import {
  EMPTY_CONFIG,
  NOTE_MAX,
  forgetUnknown,
  moveScene,
  navigableScenes,
  parseConfig,
  personalSequence,
  serializeConfig,
  setHidden,
  setNote,
  timingScenes,
  type PersonalConfig,
} from "./personal.ts";

/** Scene `x` has code `cx..` (4 chars), chapter from the second argument, 60 s by default. */
const scene = (name: string, chapter = "01", durationSec = 60, steps = 0): SceneDefinition =>
  ({ id: `${chapter}-${name}`, code: `c${name}`.padEnd(4, "0"), chapter, number: name, title: { en: name, fr: name }, durationSec, steps }) as unknown as SceneDefinition;

const A = scene("a");
const B = scene("b");
const C = scene("c", "02");
const D = scene("d", "02");
const DEFAULT = [A, B, C, D];
const code = (s: SceneDefinition) => s.code;
const ids = (list: SceneDefinition[]) => list.map((s) => s.id.slice(3));
const config = (over: Partial<PersonalConfig>): PersonalConfig => ({ ...EMPTY_CONFIG, ...over });

describe("personalSequence", () => {
  it("keeps the default order for an empty config, or one that only hides or annotates", () => {
    expect(ids(personalSequence(DEFAULT, EMPTY_CONFIG).ordered)).toEqual(["a", "b", "c", "d"]);
    const seq = personalSequence(DEFAULT, config({ hidden: [code(B)], notes: { [code(C)]: " say hi " } }));
    expect(ids(seq.ordered)).toEqual(["a", "b", "c", "d"]);
    expect(ids(seq.visible)).toEqual(["a", "c", "d"]);
    expect(seq.hiddenIds).toEqual(new Set([B.id]));
    expect(seq.notes.get(C.id)).toBe("say hi");
  });

  it("applies the order by code, dropping duplicates", () => {
    const seq = personalSequence(DEFAULT, config({ order: ["cd00", "ca00", "cd00", "cc00", "cb00"] }));
    expect(ids(seq.ordered)).toEqual(["d", "a", "c", "b"]);
  });

  it("inserts scenes the config does not know after their nearest placed predecessor, visible", () => {
    // The config was saved when the talk was [a, c]; the author then added b and d.
    const seq = personalSequence(DEFAULT, config({ order: ["cc00", "ca00"], hidden: ["ca00"] }));
    expect(ids(seq.ordered)).toEqual(["c", "d", "a", "b"]);
    expect(ids(seq.visible)).toEqual(["c", "d", "b"]);
  });

  it("puts new scenes with no placed predecessor first, keeping their default order", () => {
    const seq = personalSequence(DEFAULT, config({ order: ["cd00", "cc00"] }));
    expect(ids(seq.ordered)).toEqual(["a", "b", "d", "c"]);
  });

  it("ignores codes that no longer exist and reports them once", () => {
    const seq = personalSequence(
      DEFAULT,
      config({ order: ["gone", "cb00", "ca00"], hidden: ["gone", "old1"], notes: { old1: "x", ca00: "y" } }),
      new Set(DEFAULT.map(code)),
    );
    // c and d are unplaced: their nearest placed predecessor in the default order is b.
    expect(ids(seq.ordered)).toEqual(["b", "c", "d", "a"]);
    expect(seq.unknownCodes).toEqual(["gone", "old1"]);
    expect(seq.hiddenIds.size).toBe(0);
  });

  it("ignores silently the codes of talk scenes outside this edition", () => {
    const seq = personalSequence([A, B], config({ order: ["cc00", "cb00", "ca00"], hidden: ["cd00"] }), new Set(DEFAULT.map(code)));
    expect(ids(seq.ordered)).toEqual(["b", "a"]);
    expect(seq.unknownCodes).toEqual([]);
  });
});

describe("navigation over the personal sequence", () => {
  const seq = personalSequence(DEFAULT, config({ order: ["cc00", "ca00", "cb00", "cd00"], hidden: ["ca00"] }));

  it("skips hidden scenes", () => {
    const nav = navigableScenes(seq, C.id);
    expect(ids(nav)).toEqual(["c", "b", "d"]);
    expect(navCommand(nav, { sceneId: C.id, revealStep: 0 }, "next")).toEqual({ type: "goto", sceneId: B.id, revealStep: 0 });
    expect(navCommand(nav, { sceneId: B.id, revealStep: 0 }, "prev")).toEqual({ type: "goto", sceneId: C.id, revealStep: 0 });
  });

  it("stays on a hidden current scene, then leaves it in personal order", () => {
    const nav = navigableScenes(seq, A.id);
    expect(ids(nav)).toEqual(["c", "a", "b", "d"]);
    expect(navCommand(nav, { sceneId: A.id, revealStep: 0 }, "next")).toEqual({ type: "goto", sceneId: B.id, revealStep: 0 });
    expect(navCommand(nav, { sceneId: A.id, revealStep: 0 }, "prev")).toEqual({ type: "goto", sceneId: C.id, revealStep: 0 });
    // Once away, the hidden scene is no longer reachable by next/prev.
    const away = navigableScenes(seq, B.id);
    expect(navCommand(away, { sceneId: B.id, revealStep: 0 }, "prev")).toEqual({ type: "goto", sceneId: C.id, revealStep: 0 });
  });
});

describe("timing", () => {
  const scenes = [scene("a", "01", 120), scene("b", "01", 300), scene("c", "02", 60), scene("d", "02", 600)];

  it("excludes hidden scenes from the planned total and respects the personal order", () => {
    const seq = personalSequence(scenes, config({ order: ["cc00", "ca00", "cb00", "cd00"], hidden: ["cd00"] }));
    const timed = timingScenes(navigableScenes(seq, "01-a"), seq.hiddenIds);
    const pace = computePace(timed, "01-a", 0, [5, 10]);
    expect(pace.plannedTotalSec).toBe(480);
    expect(pace.plannedSceneStartSec).toBe(60); // c comes first now
    expect(pace.chapters.map((c) => c.id)).toEqual(["02", "01"]);
  });

  it("counts a hidden current scene as zero seconds at its place", () => {
    const seq = personalSequence(scenes, config({ hidden: ["cb00"] }));
    const timed = timingScenes(navigableScenes(seq, "01-b"), seq.hiddenIds);
    const pace = computePace(timed, "01-b", 150_000, [5, 10]);
    expect(pace.plannedTotalSec).toBe(780);
    expect(pace.plannedSceneStartSec).toBe(120);
    expect(pace.plannedSceneEndSec).toBe(120);
    expect(pace.deltaSec).toBe(30);
  });
});

describe("editing", () => {
  const ordered = personalSequence(DEFAULT, EMPTY_CONFIG).ordered;

  it("moves a scene and stores the full order, keeping unknown codes at the end", () => {
    const moved = moveScene(config({ order: ["gone"] }), ordered, "cd00", 0);
    expect(moved.order).toEqual(["cd00", "ca00", "cb00", "cc00", "gone"]);
    expect(moveScene(EMPTY_CONFIG, ordered, "ca00", -3).order).toEqual([]);
    expect(moveScene(EMPTY_CONFIG, ordered, "ca00", 99).order).toEqual(["cb00", "cc00", "cd00", "ca00"]);
  });

  it("hides, shows and annotates by code", () => {
    let c = setHidden(EMPTY_CONFIG, "cb00", true);
    expect(c.hidden).toEqual(["cb00"]);
    c = setHidden(c, "cb00", false);
    expect(c.hidden).toEqual([]);
    c = setNote(c, "ca00", "Hello");
    expect(c.notes).toEqual({ ca00: "Hello" });
    expect(setNote(c, "ca00", "   ").notes).toEqual({});
    expect(setNote(c, "ca00", "x".repeat(NOTE_MAX + 10)).notes.ca00).toHaveLength(NOTE_MAX);
  });

  it("forgets unknown codes on request", () => {
    const known = new Set(DEFAULT.map(code));
    expect(forgetUnknown(config({ order: ["ca00", "gone"], hidden: ["gone"], notes: { gone: "x", cb00: "y" } }), known)).toEqual({
      order: ["ca00"],
      hidden: [],
      notes: { cb00: "y" },
    });
  });
});

describe("file format", () => {
  const known = new Set(DEFAULT.map(code));

  it("round-trips through export and import, with a readable legend", () => {
    const c = config({ order: ["cb00", "ca00"], hidden: ["cc00"], notes: { cd00: "Mine" } });
    const text = serializeConfig(c, "canonical", personalSequence(DEFAULT, c).ordered);
    const json = JSON.parse(text);
    expect(json).toMatchObject({ schema: 1, talk: "canonical", order: ["cb00", "ca00"], hidden: ["cc00"], notes: { cd00: "Mine" } });
    expect(json.titles).toMatchObject({ cb00: "b b" });
    expect(text).toContain('\n  "order"');
    const back = parseConfig(text, "canonical", known);
    expect(back).toEqual({ ok: true, config: c, dropped: 0, unknownCodes: [] });
  });

  it("refuses what is not a config of this talk, without throwing", () => {
    expect(parseConfig("{ nope", "canonical", known)).toEqual({ ok: false, error: "json" });
    expect(parseConfig("[]", "canonical", known)).toEqual({ ok: false, error: "shape" });
    expect(parseConfig("null", "canonical", known)).toEqual({ ok: false, error: "shape" });
    expect(parseConfig('{"schema": 2}', "canonical", known)).toEqual({ ok: false, error: "schema" });
    expect(parseConfig('{"schema": "1"}', "canonical", known)).toEqual({ ok: false, error: "schema" });
    expect(parseConfig('{"talk": "other"}', "canonical", known)).toEqual({ ok: false, error: "talk" });
  });

  it("drops entries of the wrong type, normalises codes and reports unknown ones", () => {
    const text = JSON.stringify({
      schema: 1,
      talk: "canonical",
      order: ["CA00", " cb00 ", 3, null, "ca00", "gone"],
      hidden: "cb00",
      notes: { cc00: "ok", cd00: 42, "": "x", blank: "  " },
    });
    const result = parseConfig(text, "canonical", known);
    expect(result).toEqual({
      ok: true,
      config: { order: ["ca00", "cb00", "gone"], hidden: [], notes: { cc00: "ok" } },
      dropped: 5,
      unknownCodes: ["gone"],
    });
  });

  it("accepts a hand-written file with only some fields", () => {
    expect(parseConfig('{"hidden": ["cb00"]}', "canonical", known)).toEqual({
      ok: true,
      config: { order: [], hidden: ["cb00"], notes: {} },
      dropped: 0,
      unknownCodes: [],
    });
  });
});
