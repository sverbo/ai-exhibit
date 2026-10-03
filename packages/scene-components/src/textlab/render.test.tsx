import type { Locale, SceneDefinition } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SceneComponent, SceneContext, SceneRole } from "../contract.ts";
import { simpleSelect } from "./data/simple.ts";
import { NET_FAIL } from "./data/examples.ts";
import { textNet } from "./data/net.ts";
import { TEXT_STEPS, TextClassifierLab, type TextStage } from "./TextClassifierLab.tsx";
import styles from "./TextClassifierLab.module.css";

function ctx(role: SceneRole, revealStep: number, locale: Locale, state?: unknown): SceneContext {
  return {
    scene: {} as SceneDefinition,
    locale,
    revealStep,
    role,
    mode: "live",
    state,
    setState: () => {},
    getSource: () => undefined,
    reducedMotion: false,
    sendCommand: () => {},
    glossaryUrl: null,
  };
}

const render = (stage: TextStage, role: SceneRole, step: number, locale: Locale, state?: unknown) =>
  renderToStaticMarkup(createElement(TextClassifierLab as SceneComponent, { props: { stage }, ctx: ctx(role, step, locale, state) }));

describe("TextClassifierLab renders in every stage, role, step and locale", () => {
  for (const stage of Object.keys(TEXT_STEPS) as TextStage[]) {
    it(stage, () => {
      for (const role of ["controller", "display", "preview"] as const) {
        for (const locale of ["fr", "en"] as const) {
          for (let step = 0; step <= TEXT_STEPS[stage] + 1; step++) {
            const html = render(stage, role, step, locale);
            expect(html.length).toBeGreaterThan(200);
            expect(html).not.toMatch(/[\u2013\u2014]/);
            expect(html).not.toContain("undefined");
            expect(html).not.toContain("NaN");
          }
        }
      }
    });
  }
});

describe("network diagram input words", () => {
  it("are separate list items, never one glued run of text", () => {
    for (const locale of ["en", "fr"] as const) {
      const net = textNet(locale);
      const words = simpleSelect(net, NET_FAIL[locale].text, locale).words.map((w) => w.label);
      for (const [stage, step] of [["network-fail", 0], ["network", 0], ["learning", 2]] as const) {
        for (const role of ["controller", "display", "preview"] as const) {
          const html = render(stage, role, step, locale);
          const items = [...html.matchAll(/<li[^>]*>([^<]*)<\/li>/g)].map((m) => m[1]);
          if (stage === "network-fail") for (const w of words) expect(items, `${locale} ${role}: ${w}`).toContain(w);
          expect(html).toMatch(/<ul[^>]*aria-label="[^"]+, [^"]+"/);
          if (stage === "network-fail") expect(html).not.toContain(words.slice(0, 2).join(""));
        }
      }
    }
  });

  it("the nudge labels the most-moved connections before and after", () => {
    for (const locale of ["en", "fr"] as const) {
      const html = render("learning", "display", 2, locale);
      expect((html.match(/\u2192|→/g) ?? []).length).toBeGreaterThanOrEqual(3);
      expect(html).toMatch(/[▲▼]/);
    }
  });
});

describe("tree-unseen", () => {
  it("poses the sentence as a question first, then reveals everything at once", () => {
    const marked = new RegExp(`class="[^"]*\\b${styles.marked}\\b[^"]*"[^>]*>(net|baskets)<`);
    const sentence = (html: string) => html.match(new RegExp(`<p class="[^"]*\\b${styles.sentence}\\b[^"]*">.*?</p>`))?.[0] ?? "";
    for (const locale of ["en", "fr"] as const) {
      for (const role of ["controller", "display"] as const) {
        const ask = render("tree-unseen", role, 0, locale);
        const reveal = render("tree-unseen", role, 1, locale);
        expect(ask).toContain(locale === "en" ? "What will the tree answer?" : "pondre l");
        expect(sentence(ask)).toContain(locale === "en" ? "net" : "baskets");
        // Step 0: no highlight, no path, no verdict, no "to us".
        expect(sentence(ask)).not.toMatch(marked);
        expect(ask).not.toContain(styles.edgeOn);
        expect(ask).not.toContain(styles.verdictWrong);
        expect(ask).not.toContain(styles.truth);
        expect(ask).not.toContain("aria-pressed");
        // Step 1: all of it, words clickable on the controller.
        expect(sentence(reveal)).toMatch(marked);
        expect(reveal).toContain(styles.edgeOn);
        expect(reveal).toContain(styles.verdictWrong);
        expect(reveal).toContain(styles.truth);
        expect(reveal.includes("aria-pressed")).toBe(role === "controller");
      }
    }
  });
});
