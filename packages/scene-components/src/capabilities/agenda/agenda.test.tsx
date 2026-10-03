import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SceneContext } from "../../contract.ts";
import { Agenda } from "./Agenda.tsx";
import { resolveGlossaryUrl, qrPath } from "./glossaryUrl.ts";

describe("resolveGlossaryUrl", () => {
  it("uses the LAN glossary address when known", () => {
    expect(resolveGlossaryUrl("http://192.168.1.20:4317/glossary", "http://127.0.0.1:4317")).toBe("http://192.168.1.20:4317/glossary");
  });
  it("falls back to this page's origin, or nothing", () => {
    expect(resolveGlossaryUrl(null, "https://ai-exhibit.vercel.app")).toBe("https://ai-exhibit.vercel.app/glossary");
    expect(resolveGlossaryUrl(null, null)).toBeNull();
  });
  it("draws a square QR code", () => {
    const { size, d } = qrPath("https://ai-exhibit.vercel.app/glossary");
    expect(size).toBeGreaterThanOrEqual(21);
    expect(d.startsWith("M")).toBe(true);
  });
});

describe("Agenda", () => {
  const items = ["One", "Two", "Three", "Four", "Five"].map((s) => ({ en: s, fr: s }));
  const render = (revealStep: number, steps: number) =>
    renderToStaticMarkup(
      createElement(Agenda, {
        props: { heading: { en: "Today", fr: "Aujourd'hui" }, items },
        ctx: {
          scene: { id: "00-agenda", steps, visual: { layout: "component", component: "Agenda" } } as unknown as SceneDefinition,
          locale: "en",
          revealStep,
          role: "display",
          mode: "live",
          state: undefined,
          setState: () => {},
          getSource: () => undefined,
          reducedMotion: true,
          sendCommand: () => {},
          glossaryUrl: "http://192.168.1.20:4317/glossary",
        } satisfies SceneContext,
      }),
    );

  it("reveals one part per step and always shows the glossary code", () => {
    const html = render(2, 5);
    expect(html.match(/<li/g)?.length).toBe(5);
    expect(html).toContain("Glossary on your phone");
    expect(html).toContain("192.168.1.20:4317/glossary");
  });
});
