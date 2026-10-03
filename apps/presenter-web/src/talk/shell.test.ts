import { createInitialState, applyCommand } from "@ai-exhibit/session-protocol";
import { describe, expect, it } from "vitest";
import { contentDecision, contentHash, freezeCommands, projectorView, shellState, themeDecision } from "./shell.ts";

const init = () => createInitialState({ presentationId: "p", editionId: "e", locale: "fr", sceneId: "a" });

describe("projector view", () => {
  it("is live by default", () => {
    expect(projectorView(init())).toEqual({ kind: "live", sceneId: "a", revealStep: 0 });
  });

  it("holds the frozen position while the presenter moves on", () => {
    let s = init();
    for (const c of freezeCommands(s, true)) s = applyCommand(s, c, "presenter");
    s = applyCommand(s, { type: "goto", sceneId: "b", revealStep: 2 }, "presenter");
    expect(projectorView(s)).toEqual({ kind: "frozen", sceneId: "a", revealStep: 0 });
    for (const c of freezeCommands(s, false)) s = applyCommand(s, c, "presenter");
    expect(projectorView(s)).toEqual({ kind: "live", sceneId: "b", revealStep: 2 });
  });

  it("blackout wins over everything", () => {
    const s = applyCommand(init(), { type: "setBlackout", on: true }, "presenter");
    expect(projectorView(s).kind).toBe("blackout");
  });

  it("reads missing shell state as empty", () => {
    expect(shellState(null)).toEqual({});
  });
});

describe("theme sync", () => {
  it("keeps the default when nobody chose a theme", () => {
    expect(themeDecision({}, { theme: "light", at: 0 })).toBeNull();
  });

  it("publishes a local choice the session does not have yet", () => {
    expect(themeDecision({}, { theme: "dark", at: 5 })).toBe("publish");
    expect(themeDecision({ theme: "light", themeAt: 3 }, { theme: "dark", at: 5 })).toBe("publish");
  });

  it("adopts a newer session choice", () => {
    expect(themeDecision({ theme: "dark", themeAt: 9 }, { theme: "light", at: 5 })).toBe("adopt");
  });

  it("settles once both sides agree", () => {
    expect(themeDecision({ theme: "dark", themeAt: 9 }, { theme: "dark", at: 9 })).toBeNull();
  });

  it("ignores a malformed session theme", () => {
    expect(themeDecision({ theme: "neon" as never, themeAt: 9 }, { theme: "light", at: 0 })).toBeNull();
  });
});

describe("content version", () => {
  const a = contentHash("en", [{ id: "01-a", steps: 0 }, { id: "01-b", steps: 2 }]);
  const b = contentHash("en", [{ id: "01-a", steps: 0 }, { id: "01-new", steps: 0 }, { id: "01-b", steps: 2 }]);

  it("changes when scenes are inserted or steps change", () => {
    expect(a).not.toBe(b);
    expect(contentHash("en", [{ id: "01-a", steps: 0 }, { id: "01-b", steps: 3 }])).not.toBe(a);
    expect(contentHash("en", [{ id: "01-a", steps: 0 }, { id: "01-b", steps: 2 }])).toBe(a);
  });

  it("publishes when the session has no stamp for this edition", () => {
    expect(contentDecision({}, { editionId: "en", hash: a, loadedAt: 1 })).toBe("publish");
    expect(contentDecision({ content: { editionId: "fr", hash: a, loadedAt: 9 } }, { editionId: "en", hash: a, loadedAt: 1 })).toBe("publish");
  });

  it("flags a window loaded before the content that drives the session", () => {
    const shell = { content: { editionId: "en", hash: b, loadedAt: 200 } };
    expect(contentDecision(shell, { editionId: "en", hash: a, loadedAt: 100 })).toBe("stale");
  });

  it("lets a freshly loaded window take over with newer content", () => {
    const shell = { content: { editionId: "en", hash: a, loadedAt: 100 } };
    expect(contentDecision(shell, { editionId: "en", hash: b, loadedAt: 200 })).toBe("publish");
  });

  it("agrees when both run the same content", () => {
    const shell = { content: { editionId: "en", hash: a, loadedAt: 100 } };
    expect(contentDecision(shell, { editionId: "en", hash: a, loadedAt: 50 })).toBe("ok");
  });
});

describe("modelSourceOf", () => {
  it("defaults to Simulation (or the host's default) and accepts only known sources", async () => {
    const { modelSourceOf } = await import("./shell.ts");
    expect(modelSourceOf({})).toBe("simulation");
    expect(modelSourceOf({}, "hf")).toBe("hf");
    expect(modelSourceOf({ modelSource: "simulation" }, "hf")).toBe("simulation");
    // A session saved before "local" was removed falls back to the default.
    expect(modelSourceOf({ modelSource: "local" as never }, "hf")).toBe("hf");
    expect(modelSourceOf({ modelSource: "nope" as never })).toBe("simulation");
  });
});
