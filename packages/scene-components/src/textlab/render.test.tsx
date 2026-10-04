import { tr, type Locale, type SceneDefinition } from "@ai-exhibit/presentation-core";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SceneComponent, SceneContext, SceneRole } from "../contract.ts";
import { simpleSelect } from "./data/simple.ts";
import { NET_FAIL } from "./data/examples.ts";
import { textNet } from "./data/net.ts";
import { textTree } from "./data/examples.ts";
import { SMALL_SET, TREE_EXAMPLE } from "./data/small.ts";
import { tokenize, wordSet } from "./data/text.ts";
import { treePath } from "./data/tree.ts";
import { TEXT_STEPS, TextClassifierLab, TreeStage, type TextStage } from "./TextClassifierLab.tsx";
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

describe("tree", () => {
  const sentence = (html: string) => html.match(new RegExp(`<p class="[^"]*\\b${styles.bigSentence}\\b[^"]*">.*?</p>`))?.[0] ?? "";
  const markedWords = (html: string) =>
    [...sentence(html).matchAll(new RegExp(`<span class="[^"]*\\b${styles.marked}\\b[^"]*">([^<]*)</span>`, "g"))].map((m) => m[1]);
  const plain = (html: string) =>
    html.replace(/<[^>]*>/g, "").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const count = (html: string, cls: string | undefined) => {
    expect(cls).toBeTruthy();
    return (html.match(new RegExp(`\\b${cls}\\b`, "g")) ?? []).length;
  };

  it("step 1 shows the learned tree alone: no sentence, no path, no verdict, no example controls", () => {
    for (const locale of ["en", "fr"] as const) {
      for (const role of ["controller", "display"] as const) {
        const html = render("tree", role, 1, locale, { example: 5 });
        expect(html).toContain(styles.tree);
        expect(html).toContain(styles.treeRead);
        expect(sentence(html)).toBe("");
        expect(html).not.toContain("data-example");
        for (const cls of [styles.edgeOn, styles.splitOn, styles.leafOn, styles.faded, styles.verdict, styles.truth]) expect(count(html, cls), cls).toBe(0);
        expect(html).not.toContain("<button");
      }
    }
  });

  it("step 2 shows, for every example, its own sentence, path and verdict, on the controller and on the display", () => {
    for (const locale of ["en", "fr"] as const) {
      const set = SMALL_SET[locale];
      const tree = textTree(locale);
      for (let example = -1; example <= set.length; example++) {
        const i = ((example % set.length) + set.length) % set.length;
        const s = set[i]!;
        const { steps, verdict } = treePath(tree, wordSet(s.text, locale));
        const found = new Set(steps.filter((x) => x.answer).map((x) => x.node.word));
        const expected = tokenize(s.text, locale)
          .filter((tok) => !tok.stop && found.has(tok.word))
          .map((tok) => tok.surface);
        const verdictName = verdict === "football" ? "Football" : locale === "en" ? "Basketball" : "Basket";
        const shown: string[] = [];
        for (const role of ["controller", "display"] as const) {
          const html = render("tree", role, 2, locale, { example });
          const label = `${locale} ${role} example ${example}`;
          expect(html, label).toContain(`data-example="${i}"`);
          expect(plain(sentence(html)), label).toBe(s.text);
          expect(markedWords(html), label).toEqual(expected);
          expect(count(html, styles.leafOn), label).toBe(1);
          expect(count(html, styles.leafWrong), label).toBe(verdict === s.label ? 0 : 1);
          expect(count(html, styles.verdictWrong), label).toBe(verdict === s.label ? 0 : 1);
          expect(html, label).toMatch(new RegExp(`${styles.verdictAnswer}[^"]*"><span[^>]*>.*?</span>${verdictName}<`));
          expect(html.includes("<button"), label).toBe(role === "controller");
          shown.push(html.replace(/<div class="[^"]*\bcontrols\b.*$/, ""));
        }
        // The display draws exactly what the presenter sees, minus the buttons.
        expect(shown[1]!.slice(0, 2000), `${locale} ${example}`).toBe(shown[0]!.slice(0, 2000));
      }
    }
  });

  it("a new example mounts afresh, so no highlight or lit leaf carries over from the previous one", () => {
    for (const locale of ["en", "fr"] as const) {
      const t = (x: Parameters<typeof tr>[0]) => tr(x, locale) as string;
      const keyOf = (step: number, example: number) => (TreeStage({ step, t, locale, example }) as ReactElement).key;
      const keys = SMALL_SET[locale].map((_, i) => keyOf(2, i));
      expect(new Set(keys).size).toBe(SMALL_SET[locale].length);
      // From the tree alone to the first walk, the DOM is kept (the path lights up smoothly).
      expect(keyOf(1, TREE_EXAMPLE)).toBe(keyOf(2, TREE_EXAMPLE));
    }
  });
});
