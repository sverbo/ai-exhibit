import { describe, expect, it } from "vitest";
import type { PresentationDefinition, SceneDefinition } from "./types.ts";
import { validatePresentation } from "./validate.ts";

const l = (s: string) => ({ fr: s, en: s });
function scene(over: Partial<SceneDefinition> = {}): SceneDefinition {
  return {
    id: "04-case", code: "case", chapter: "04", number: "4.2", title: l("t"), objective: l("o"), takeaway: l("k"),
    visual: { layout: "statement", text: l("x") }, interaction: "none",
    speakerNotes: l("n"), transitionIn: l("i"), transitionOut: l("o"), evidenceLevel: "none",
    sourceIds: [], runtimeClass: "A", artifacts: [], fallback: { kind: "none" },
    durationSec: 60, optional: false, ...over,
  };
}
function pres(scenes: SceneDefinition[]): PresentationDefinition {
  return {
    id: "p", title: l("p"), scenes, artifacts: [], sources: [],
    chapters: [{ id: "04", title: l("c"), summary: l("s") }],
    editions: [{ id: "e", locale: "fr", title: l("e"), targetMinutes: [0, 10], cut: "full" }],
  };
}

describe("validatePresentation", () => {
  it("accepts a well-formed scene", () => {
    expect(validatePresentation(pres([scene()])).filter((i) => i.level === "error")).toEqual([]);
  });

  it("flags long dashes, missing locales and unsourced evidence", () => {
    const bad = scene({
      title: { fr: "a — b", en: "" },
      evidenceLevel: "observed",
      visual: { layout: "cards", cards: [{ title: l("c"), sourceIds: ["nope"] }] },
    });
    const messages = validatePresentation(pres([bad])).map((i) => i.message);
    expect(messages.some((m) => m.includes("long dash"))).toBe(true);
    expect(messages.some((m) => m.includes('missing "en"'))).toBe(true);
    expect(messages.some((m) => m.includes("without sources"))).toBe(true);
    expect(messages.some((m) => m.includes('unknown source "nope" in visual'))).toBe(true);
  });

  it("checks scene codes: format, uniqueness across parked scenes, never a retired one", () => {
    const errors = (p: PresentationDefinition) => validatePresentation(p).filter((i) => i.level === "error").map((i) => i.message);
    for (const code of ["ab", "toolong", "Tokn", "to-k", ""]) {
      expect(errors(pres([scene({ code })])).some((m) => m.includes("4 or 5 lowercase"))).toBe(true);
    }
    expect(errors(pres([scene({ code: "tokn" }), scene({ id: "04-other", code: "race1" })]))).toEqual([]);
    expect(errors(pres([scene({ code: "tokn" }), scene({ id: "04-other", code: "tokn" })]))).toContain(
      'code "tokn" is already used by 04-case',
    );
    const parked = { ...pres([scene({ code: "tokn" })]), parkedScenes: [scene({ id: "04-parked", code: "tokn" })] };
    expect(errors(parked)).toContain('code "tokn" is already used by 04-case');
    const retired = { ...pres([scene({ code: "bomb" })]), retiredSceneCodes: ["bomb"] };
    expect(errors(retired).some((m) => m.includes("retired"))).toBe(true);
  });
});
