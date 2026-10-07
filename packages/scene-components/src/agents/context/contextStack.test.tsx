import { tr, type Locale, type SceneDefinition } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import "../../../../../presentations/canonical/src/index.ts";
import type { SceneComponent, SceneContext, SceneRole } from "../../contract.ts";
import { SEARCH_TEXT } from "../toolcall/search.ts";
import { ContextStack } from "./ContextStack.tsx";
import { LAST_STEP, STEP_SUB, stackAt } from "./stack.ts";

function ctx(role: SceneRole, revealStep: number, locale: Locale, reducedMotion = false): SceneContext {
  return {
    scene: { id: "01-no-memory" } as SceneDefinition,
    locale,
    revealStep,
    role,
    mode: "live",
    state: undefined,
    setState: () => {},
    getSource: () => undefined,
    reducedMotion,
    sendCommand: () => {},
    glossaryUrl: null,
  };
}

const render = (step: number, locale: Locale = "en", role: SceneRole = "display", reducedMotion = false) =>
  renderToStaticMarkup(createElement(ContextStack as SceneComponent, { props: {}, ctx: ctx(role, step, locale, reducedMotion) }));

describe("ContextStack steps", () => {
  it("has one line under the heading per step", () => {
    expect(STEP_SUB).toHaveLength(LAST_STEP + 1);
  });

  it("grows with each message, then drops the start of a full window", () => {
    expect(stackAt(0).map((b) => b.id)).toEqual(["you1"]);
    expect(stackAt(1).map((b) => b.id)).toEqual(["you1", "model1", "you2"]);
    const full = stackAt(2);
    expect(full).toHaveLength(6);
    expect(full.map((b) => b.kind)).toContain("more");
    expect(full[0]).toMatchObject({ id: "you1", dropped: true });
    expect(full.filter((b) => b.dropped)).toHaveLength(1);
  });

  it("replaces the old part with a summary and a saved note", () => {
    const ids = stackAt(3).map((b) => b.id);
    expect(ids).toContain("summary");
    expect(ids).toContain("note");
    expect(ids).not.toContain("you1");
  });

  it("adds the hidden system prompt and tool descriptions on top", () => {
    const s = stackAt(4);
    expect(s.slice(0, 2).map((b) => [b.id, b.hidden])).toEqual([
      ["system", true],
      ["tools", true],
    ]);
    expect(s.filter((b) => b.hidden)).toHaveLength(2);
  });

  it("ends on the tool call of the next slide, after its question", () => {
    const s = stackAt(LAST_STEP);
    expect(s.at(-1)!.kind).toBe("call");
    expect(s.at(-2)!.text).toBe(SEARCH_TEXT.question);
    expect(stackAt(LAST_STEP + 3)).toEqual(s);
    expect(stackAt(-1)).toEqual(stackAt(0));
  });

  it("marks exactly one message as the latest until the model answers", () => {
    for (let step = 0; step < LAST_STEP; step++) expect(stackAt(step).filter((b) => b.latest)).toHaveLength(1);
    expect(stackAt(LAST_STEP).filter((b) => b.latest)).toHaveLength(0);
  });
});

describe("ContextStack render", () => {
  it("renders every role, step and locale without long dashes or raw term markup", () => {
    for (const role of ["controller", "display", "preview"] as const) {
      for (const locale of ["en", "fr"] as const) {
        for (let step = 0; step <= LAST_STEP; step++) {
          const html = render(step, locale, role);
          expect(html).not.toMatch(/[\u2013\u2014]/);
          expect(html).not.toMatch(/\(\*|\*\)/);
          expect(html).toContain(tr({ en: "Illustrative conversation" }, locale));
        }
      }
    }
  });

  it("labels hidden text in words, not by color alone", () => {
    expect(render(3)).not.toContain("hidden from you");
    expect(render(4).match(/hidden from you/g)).toHaveLength(2);
  });

  it("shows the tool call as JSON with the next slide's query", () => {
    const html = render(LAST_STEP);
    expect(html).toContain("web_search");
    expect(html).toContain(SEARCH_TEXT.query.en);
    expect(render(LAST_STEP, "fr")).toContain("Barcelone");
  });

  it("keeps previews and reduced motion still", () => {
    const still = /class="[^"]*still/;
    expect(render(2, "en", "preview")).toMatch(still);
    expect(render(2, "en", "display", true)).toMatch(still);
    expect(render(2, "en", "display", false)).not.toMatch(still);
  });
});
