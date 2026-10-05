import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pick, tr, type L10n, type Locale, type SceneDefinition, type SourceRecord } from "@ai-exhibit/presentation-core";
import { STORY_IMAGES } from "@ai-exhibit/content/assets/media/story/credits.ts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sources } from "../../../../content/sources/index.ts";
import { storySources } from "../../../../content/sources/story.ts";
import type { SceneComponent, SceneContext, SceneRole } from "../contract.ts";
import { AIEnvelopes, ENVELOPE_STEPS } from "./AIEnvelopes.tsx";
import { AITimeline, focusedMilestone, timelineStepMap, timelineSteps } from "./AITimeline.tsx";
import { creditLine } from "./Credits.tsx";
import { BOMBE_TICKS, bombeFrame, BombeDemo, FOUND_SETTING, REJECTED_BEFORE_STOP, SEARCH_TICKS } from "./BombeDemo.tsx";
import { candidateAt, DEMO_CIPHERTEXT, DEMO_CRIB, DEMO_PLAINTEXT, DEMO_SETTINGS, enigma, searchCrib } from "./enigma.ts";
import { AI_MILESTONES, ENVELOPES, logoBox } from "./data.ts";
import { INDUSTRY_STEPS, LAYERS, MOVES, PEOPLE, placementsAt } from "./industry.ts";
import { COUNTRY_NAMES, flagImageId, HEADQUARTERS } from "./countries.ts";
import { IndustryStack, layoutActors, personX } from "./IndustryStack.tsx";
import { CAMERAS, CROWD, CROWD_STEP, CROWD_TRAITS, FIGURES, INTELLIGENCE_STEPS, IntelligenceScale, LOOP_CAPTION, LOOP_GROWTH, LOOP_NAME, LOOP_NODES, LOOP_STEP, screenX } from "./IntelligenceScale.tsx";

const byId = new Map<string, SourceRecord>(sources.map((s) => [s.id, s]));
const imageIds = new Set(STORY_IMAGES.map((i) => i.id));
const DASHES = /[\u2013\u2014]/;
const mediaDir = fileURLToPath(new URL("../../../../content/assets/media/story/", import.meta.url));

function l10nValues(value: L10n): string[] {
  return [value.en, pick(value, "fr")];
}

function expectL10n(value: L10n, where: string) {
  for (const text of l10nValues(value)) {
    expect(text.trim(), `${where} has an empty locale`).not.toBe("");
    expect(DASHES.test(text), `${where} contains an en or em dash: ${text}`).toBe(false);
  }
}

function expectSources(ids: string[], where: string) {
  for (const id of ids) expect(byId.has(id), `${where} cites unknown source ${id}`).toBe(true);
}

describe("story sources", () => {
  it("use the st- prefix, unique IDs and no dashes", () => {
    const ids = storySources.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of storySources) {
      expect(s.id.startsWith("st-")).toBe(true);
      for (const text of [s.title, s.claim, s.notes ?? "", s.publisher ?? ""]) expect(DASHES.test(text), `${s.id}: ${text}`).toBe(false);
      if (s.verification === "verified") expect(s.retrieved ?? "", `${s.id} verified without retrieved date`).toMatch(/^2026-10-0[2-9]$/);
    }
  });

  it("are registered in the source index", () => {
    for (const s of storySources) expect(byId.get(s.id)).toBe(s);
  });
});

describe("story data", () => {
  it("envelopes have both locales, no dashes and known sources", () => {
    expect(ENVELOPES.map((e) => e.id)).toEqual(["ai", "ml", "nn", "llm"]);
    for (const e of ENVELOPES) {
      expectL10n(e.name, e.id);
      expectL10n(e.definition, e.id);
      expectL10n(e.example, e.id);
      expectSources(e.sourceIds, e.id);
    }
  });

  it("AI milestones are sourced, localized and free of company names", () => {
    expect(AI_MILESTONES.map((m) => [m.id, m.track])).toEqual([
      ["turing-1936", "promise"],
      ["enigma-1939", "promise"],
      ["dartmouth-1956", "promise"],
      ["perceptron-1958", "promise"],
      ["ai-winters", "setback"],
      ["deep-blue-1997", "promise"],
      ["deep-learning-2012", "promise"],
      ["alphago-2016", "promise"],
      ["transformer-2017", "promise"],
      ["gpt2-2019", "promise"],
      ["gpt3-2020", "promise"],
    ]);
    // One winter, drawn as a period, keeping the sources of the setbacks it replaces.
    const winter = AI_MILESTONES.find((m) => m.id === "ai-winters")!;
    expect(winter.period).toBe(true);
    expect(winter.sourceIds).toEqual(expect.arrayContaining(["st-lighthill-1973-report", "st-wiki-perceptrons-book", "st-wiki-expert-system", "st-wiki-ai-winter"]));
    expect(AI_MILESTONES.find((m) => m.id === "deep-learning-2012")!.text.en).toContain("CNN");
    // Ten milestones after the first, plus one for the Bombe: shown still, then run.
    expect(timelineSteps()).toBe(11);
    // Go contrasts with chess: learned from games, not rules written by people.
    expect(AI_MILESTONES.find((m) => m.id === "alphago-2016")!.text.en).toContain("against itself");
    expect(AI_MILESTONES.find((m) => m.id === "enigma-1939")!.demo).toBe("bombe");
    const companies = /openai|google|deepmind|microsoft|anthropic|meta\b|nvidia|amazon|\bibm\b/i;
    for (const m of AI_MILESTONES) {
      expect(m.sourceIds.length, `${m.id} has no source`).toBeGreaterThan(0);
      expectSources(m.sourceIds, m.id);
      for (const field of [m.when, m.short, m.title, m.text]) {
        expectL10n(field, m.id);
        for (const text of l10nValues(field)) expect(companies.test(text), `${m.id} names a company: ${text}`).toBe(false);
      }
    }
  });

});

describe("story images", () => {
  it("every credited file exists, with complete license metadata", () => {
    for (const image of STORY_IMAGES) {
      const path = fileURLToPath(image.url);
      expect(existsSync(path), `${image.file} is missing`).toBe(true);
      expect(path.endsWith(image.file)).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(0);
      for (const field of [image.subject, image.sourcePage, image.author, image.license, image.licenseUrl]) {
        expect(field.trim()).not.toBe("");
        expect(DASHES.test(field), `${image.id}: ${field}`).toBe(false);
      }
      expect(image.sourcePage).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(image.licenseUrl).toMatch(/^https?:\/\//);
      expect(image.aspect).toBeGreaterThan(0);
    }
  });

  it("every image file in the folder is credited, and the folder stays small", () => {
    const credited = new Set(STORY_IMAGES.map((i) => i.file));
    let total = 0;
    for (const file of readdirSync(mediaDir)) {
      if (file.endsWith(".ts")) continue;
      expect(credited.has(file), `${file} has no credit record`).toBe(true);
      total += statSync(`${mediaDir}${file}`).size;
    }
    expect(total).toBeLessThan(2 * 1024 * 1024);
  });
});

describe("helpers", () => {
  it("logoBox keeps equal area within bounds", () => {
    const wide = logoBox(8, 20000, 1000, 200);
    expect(wide.w * wide.h).toBeGreaterThan(19000);
    const square = logoBox(1, 20000, 1000, 100);
    expect(square).toEqual({ w: 100, h: 100 });
  });

  it("focusedMilestone follows the step unless the controller picked an earlier one at this step", () => {
    expect(focusedMilestone(4, 3, undefined)).toBe(3);
    expect(focusedMilestone(4, 3, { focus: 1, atStep: 3 })).toBe(1);
    expect(focusedMilestone(5, 4, { focus: 1, atStep: 3 })).toBe(4);
    expect(focusedMilestone(4, 3, { focus: 9, atStep: 3 })).toBe(3);
  });

  it("creditLine names photo authors and the trademark note", () => {
    const line = creditLine(STORY_IMAGES.filter((i) => i.id === "sam-altman" || i.id === "openai"), "en");
    expect(line).toContain("Steve Jurvetson (CC BY 2.0)");
    expect(line).toContain("trademarks");
    expect(DASHES.test(line)).toBe(false);
  });
});

function ctx(role: SceneRole, revealStep: number, locale: Locale, state?: unknown): SceneContext {
  return {
    scene: {} as SceneDefinition,
    locale,
    revealStep,
    role,
    mode: "live",
    state,
    setState: () => {},
    getSource: (id) => byId.get(id),
    reducedMotion: false,
    sendCommand: () => {},
    glossaryUrl: null,
  };
}

function render(component: SceneComponent, props: Record<string, unknown>, c: SceneContext): string {
  return renderToStaticMarkup(createElement(component, { props, ctx: c }));
}

describe("rendering", () => {
  const roles: SceneRole[] = ["controller", "display", "preview"];
  const locales: Locale[] = ["en", "fr"];

  it("AIEnvelopes reveals one ring per step", () => {
    expect(ENVELOPE_STEPS).toBe(3);
    for (const role of roles)
      for (const locale of locales)
        for (let step = 0; step <= ENVELOPE_STEPS; step++) {
          const html = render(AIEnvelopes, {}, ctx(role, step, locale));
          expect(html).toContain(tr(ENVELOPES[0]!.name, locale));
          expect(DASHES.test(html)).toBe(false);
        }
    const hiddenRings = (step: number) =>
      (render(AIEnvelopes, {}, ctx("display", step, "en")).match(/<section[^>]*aria-hidden="true"/g) ?? []).length;
    expect([0, 1, 2, 3].map(hiddenRings)).toEqual([3, 2, 1, 0]);
  });

  it("AITimeline shows the newest milestone and follows controller focus", () => {
    expect(timelineSteps("ai")).toBe(AI_MILESTONES.length);
    for (const role of roles)
      for (const locale of locales)
        for (let step = 0; step <= timelineSteps(); step++) {
          const html = render(AITimeline, { range: "ai" }, ctx(role, step, locale));
          const expected = role === "preview" ? AI_MILESTONES.at(-1)! : AI_MILESTONES[timelineStepMap()[step]!.index]!;
          expect(html).toContain(tr(expected.title, locale).replace(/'/g, "&#x27;").replace(/\(\*([^*]+)\*\)/g, "(<em>$1</em>)"));
        }
    const focused = render(AITimeline, { range: "ai" }, ctx("display", 5, "en", { focus: 0, atStep: 5 }));
    // The Bombe takes two steps: the machine still, then running.
    const bombe = AI_MILESTONES.findIndex((m) => m.id === "enigma-1939");
    expect(timelineStepMap().filter((st) => st.index === bombe).map((st) => st.run)).toEqual([false, true]);
    expect(focused).toContain(AI_MILESTONES[0]!.text.en.slice(0, 20));
  });

});

describe("IndustryStack", () => {
  const actors = LAYERS.flatMap((l) => l.actors);

  it("has five layers, known images and sources, both locales", () => {
    expect(LAYERS.map((l) => l.id)).toEqual(["labs", "cloud", "chips", "foundries", "equipment"]);
    const ids = actors.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const layer of LAYERS) expectL10n(layer.name, layer.id);
    for (const a of actors) {
      expectL10n(a.label, a.id);
      expect(imageIds.has(a.image), `${a.id} uses unknown image ${a.image}`).toBe(true);
      expect(a.sourceIds.length).toBeGreaterThan(0);
      expectSources(a.sourceIds, a.id);
    }
    for (const p of PEOPLE) expect(imageIds.has(p.image)).toBe(true);
  });

  it("shows the products people know under their labs: Gemini, ChatGPT, Claude, Grok", () => {
    const products = actors.filter((a) => a.product).map((a) => [a.id, a.product!.name, a.product!.image]);
    expect(products).toEqual([
      ["google-deepmind", "Gemini", "gemini"],
      ["openai", "ChatGPT", "chatgpt"],
      ["anthropic", "Claude", "claude"],
      ["xai", "Grok", "grok"],
    ]);
    for (const [, , image] of products) expect(imageIds.has(image!)).toBe(true);
    const html = render(IndustryStack, {}, ctx("display", 5, "en"));
    expect(html).toContain("ChatGPT");
    expect(html).toContain("Claude");
  });

  it("lights entries in the briefed order", () => {
    const lit = (step: number) => actors.filter((a) => a.lightAt === step).map((a) => a.id);
    expect(INDUSTRY_STEPS).toBe(13);
    expect(lit(1)).toEqual(["google-deepmind"]);
    expect(lit(2)).toEqual([]);
    expect(lit(3)).toEqual(["openai"]);
    expect(lit(4)).toEqual([]);
    expect(lit(5)).toEqual([]);
    expect(lit(6)).toEqual(["anthropic"]);
    expect(lit(7)).toEqual(["xai"]);
    expect(lit(8)).toEqual(["meta"]);
    expect(lit(9)).toEqual(["mistral"]);
    expect(lit(10)).toEqual(["deepseek", "qwen", "moonshot-ai", "zai"]);
    expect(lit(11)).toEqual(["nvidia"]);
    expect(lit(12)).toEqual(["tsmc"]);
    expect(lit(13)).toEqual(["asml"]);
  });

  it("shows market shares for the near-monopolies, beside their logo once lit", () => {
    const shares = actors.filter((a) => a.share);
    expect(shares.map((a) => [a.id, a.share!.value.en])).toEqual([
      ["nvidia", "~92%"],
      ["tsmc", "~72%"],
      ["asml", "100%"],
    ]);
    for (const a of shares) {
      expectL10n(a.share!.value, `${a.id} share`);
      expectL10n(a.share!.what, `${a.id} share`);
      expectSources(a.share!.sourceIds, `${a.id} share`);
      expect(a.share!.sourceIds.every((id) => byId.get(id)?.verification === "verified"), a.id).toBe(true);
    }
    // Every share is sourced.
    expect(shares.filter((a) => a.share!.sourceIds.length === 0).map((a) => a.id)).toEqual([]);
    expect(actors.find((a) => a.id === "nvidia")!.share!.what.en).toContain("est.");
    const shown = (step: number) => [...render(IndustryStack, {}, ctx("display", step, "en")).matchAll(/data-share="([^"]+)"/g)].map((m) => m[1]);
    expect(shown(10)).toEqual([]);
    expect(shown(11)).toEqual(["nvidia"]);
    expect(shown(12)).toEqual(["nvidia", "tsmc"]);
    expect(shown(13)).toEqual(["nvidia", "tsmc", "asml"]);
    expect(render(IndustryStack, {}, ctx("display", 13, "fr"))).toContain("100 %");
  });

  it("tags the Chinese labs as open weights when they light, citing their model cards", () => {
    const open = actors.filter((a) => a.openWeights);
    expect(open.map((a) => a.id)).toEqual(["deepseek", "qwen", "moonshot-ai", "zai"]);
    for (const a of open) {
      expect(a.openWeights!.sourceIds.length).toBeGreaterThan(0);
      expectSources(a.openWeights!.sourceIds, `${a.id} open weights`);
      expect(a.openWeights!.sourceIds.every((id) => byId.get(id)?.verification === "verified"), a.id).toBe(true);
    }
    const tagged = (step: number) => [...render(IndustryStack, {}, ctx("display", step, "en")).matchAll(/data-open-weights="([^"]+)"/g)].map((m) => m[1]);
    expect(tagged(9)).toEqual([]);
    expect(tagged(10)).toEqual(["deepseek", "qwen", "moonshot-ai", "zai"]);
    expect(tagged(13)).toEqual(["deepseek", "qwen", "moonshot-ai", "zai"]);
    expect(render(IndustryStack, {}, ctx("display", 10, "fr"))).toContain("poids ouverts");
  });

  it("every move is sourced, localized and points at a known lab", () => {
    for (const m of MOVES) {
      expectL10n(m.what, `${m.person}@${m.step}`);
      expect(m.sourceIds.length).toBeGreaterThan(0);
      expectSources(m.sourceIds, `${m.person}@${m.step}`);
      // At least one source behind each move was opened and checked.
      expect(m.sourceIds.some((id) => byId.get(id)?.verification === "verified"), `${m.person}@${m.step}`).toBe(true);
      if (m.org) {
        const actor = actors.find((a) => a.id === m.org);
        expect(actor, m.org).toBeDefined();
      }
    }
    expect(placementsAt(1).size).toBe(0);
    expect(placementsAt(2).get("elon-musk")?.org).toBe("openai");
    expect(placementsAt(3).get("elon-musk")?.org).toBe("openai");
    expect(placementsAt(4).get("elon-musk")?.org).toBeNull();
    expect(placementsAt(4).has("dario-amodei")).toBe(false);
    expect(placementsAt(5).get("dario-amodei")?.org).toBe("openai");
    expect(placementsAt(6).get("dario-amodei")?.org).toBe("anthropic");
    expect(placementsAt(6).get("elon-musk")?.org).toBeNull();
    expect(placementsAt(7).get("elon-musk")?.org).toBe("xai");
    expect(placementsAt(8).has("arthur-mensch")).toBe(false);
    expect(placementsAt(9).get("arthur-mensch")?.org).toBe("mistral");
    expect(placementsAt(10).has("jensen-huang")).toBe(false);
    expect(placementsAt(11).get("jensen-huang")).toMatchObject({ org: "nvidia", inline: true });
  });

  it("shows Musk and Altman alone first, then their lines with OpenAI", () => {
    const links = (step: number) => [...render(IndustryStack, {}, ctx("display", step, "en")).matchAll(/data-link="([^"]+)"/g)].map((m) => m[1]);
    expect(links(2)).toEqual([]);
    expect(links(3).sort()).toEqual(["elon-musk-openai", "sam-altman-openai"]);
  });

  it("changes one thing per click: a person appears or moves only on its own step or with the lab it joins", () => {
    // A lab never lights on the same click as a move to another organisation.
    for (let step = 1; step <= INDUSTRY_STEPS; step++) {
      const lit = actors.filter((a) => a.lightAt === step).map((a) => a.id);
      const moves = MOVES.filter((m) => m.step === step);
      if (lit.length) for (const m of moves) expect(m.org === null || lit.includes(m.org), `step ${step}`).toBe(true);
      expect(lit.length + moves.length, `step ${step} changes nothing`).toBeGreaterThan(0);
    }
    // Arthur Mensch simply appears at Mistral when Mistral lights: no earlier place.
    expect(MOVES.filter((m) => m.person === "arthur-mensch").map((m) => [m.step, m.org])).toEqual([[9, "mistral"]]);
  });

  it("only the current place of each person is visible: no travel, no hop, no staged drawing", () => {
    for (let step = 0; step <= INDUSTRY_STEPS; step++) {
      const html = render(IndustryStack, {}, ctx("display", step, "en"));
      const shown = [...html.matchAll(/data-person="([^"]+)" data-org="([^"]+)"/g)].map((m) => `${m[1]}:${m[2]}`);
      const expected = [...placementsAt(step).values()].map((m) => `${m.person}:${m.org ?? "none"}`);
      expect(shown.sort(), `step ${step}`).toEqual(expected.sort());
      const links = [...html.matchAll(/data-link="([^"]+)"/g)].map((m) => m[1]);
      const litIds = new Set(actors.filter((a) => a.lightAt !== undefined && a.lightAt <= step).map((a) => a.id));
      const linked = [...placementsAt(step).values()].filter((m) => m.org !== null && litIds.has(m.org));
      expect(links.sort(), `step ${step}`).toEqual(linked.map((m) => `${m.person}-${m.org}`).sort());
      expect(html).not.toMatch(/<marker|industry-hop/);
    }
    const css = readFileSync(new URL("./IndustryStack.module.css", import.meta.url), "utf8");
    expect(css).not.toMatch(/animation-delay|\d+ms both|transition:\s*transform/);
  });

  it("portraits never overlap and logos stay inside the stage", () => {
    for (let step = 0; step <= INDUSTRY_STEPS; step++) {
      const xs = [...placementsAt(step).values()].filter((m) => !m.inline).map(personX).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!, `step ${step}`).toBeGreaterThanOrEqual(130);
    }
    for (const p of layoutActors().values()) {
      expect(p.x - p.w / 2).toBeGreaterThan(360);
      expect(p.x + p.w / 2).toBeLessThan(1860);
    }
  });

  it("renders every step in every role", () => {
    for (const role of ["controller", "display", "preview"] as SceneRole[])
      for (const locale of ["en", "fr"] as Locale[])
        for (let step = 0; step <= INDUSTRY_STEPS; step++) {
          const html = render(IndustryStack, {}, ctx(role, step, locale));
          const lit = (html.match(/data-lit="true"/g) ?? []).length;
          const s = role === "preview" ? INDUSTRY_STEPS : step;
          expect(lit).toBe(actors.filter((a) => a.lightAt !== undefined && a.lightAt <= s).length);
          expect(DASHES.test(html)).toBe(false);
        }
  });
});

describe("headquarters flags", () => {
  it("every company in IndustryStack has a sourced country with a bundled flag", () => {
    const ids = new Set(LAYERS.flatMap((l) => l.actors.map((a) => a.id)));
    for (const id of ids) {
      const hq = HEADQUARTERS[id];
      expect(hq, `${id} has no headquarters entry`).toBeDefined();
      expect(hq!.countries.length).toBeGreaterThan(0);
      expectSources(hq!.sourceIds, id);
      for (const c of hq!.countries) {
        expectL10n(COUNTRY_NAMES[c], c);
        expect(imageIds.has(flagImageId(c)), `missing flag for ${c}`).toBe(true);
      }
    }
    expect(HEADQUARTERS["google-deepmind"]!.countries).toEqual(["gb", "us"]);
  });

  it("flags dim and light with their logo", () => {
    const html = render(IndustryStack, {}, ctx("display", 1, "en"));
    expect(html).toContain('aria-label="United Kingdom, United States"');
    const gb = html.match(/<img[^>]*flag-gb\.svg[^>]*>/g) ?? [];
    expect(gb.length).toBe(1);
  });

  it("every SVG has a viewBox so it scales in every browser", () => {
    for (const file of readdirSync(mediaDir).filter((f) => f.endsWith(".svg"))) {
      const text = readFileSync(`${mediaDir}${file}`, "utf8");
      expect(/<svg\b[^>]*viewBox=/s.test(text), `${file} has no viewBox`).toBe(true);
    }
  });
});

describe("IntelligenceScale", () => {
  it("has 5 steps: ant, human, one AGI, the AGI crowd, the self-improvement loop, ASI", () => {
    expect(INTELLIGENCE_STEPS).toBe(5);
    expect(CROWD_STEP).toBe(3);
    expect(LOOP_STEP).toBe(4);
    expect(FIGURES.map((f) => [f.id, f.step])).toEqual([["ant", 0], ["human", 1], ["agi", 2], ["asi", 5]]);
    for (const n of [...LOOP_NODES, LOOP_CAPTION, LOOP_NAME]) expectL10n(n, n.en);
    expect(pick(LOOP_NAME, "fr")).toBe("RSI : auto-amélioration récursive");
    for (let i = 1; i < LOOP_GROWTH.length; i++) expect(LOOP_GROWTH[i]!).toBeGreaterThan(LOOP_GROWTH[i - 1]!);
    for (const f of FIGURES) {
      expectL10n(f.name, f.id);
      if (f.sub) expectL10n(f.sub, f.id);
    }
    expect(CROWD_TRAITS.map((t) => pick(t, "fr"))).toEqual(["des copies sans limite", "jamais fatiguée, ne dort jamais", "niveau expert dans tous les domaines"]);
    for (const t of CROWD_TRAITS) expectL10n(t, t.en);
  });

  it("the crowd runs past the right edge of the frame and stays clear of the human", () => {
    const front = CROWD.filter((c) => c.row === "front").map((c) => screenX(c.x, CROWD_STEP));
    expect(Math.max(...front)).toBeGreaterThan(1920);
    const human = FIGURES.find((f) => f.id === "human")!;
    for (const c of CROWD) expect(c.x - 100 * c.scale).toBeGreaterThan(human.x + human.w / 2);
  });

  it("AGI is about human-sized and ASI overflows the frame on purpose", () => {
    const [ant, human, agi, asi] = FIGURES;
    expect(human!.h / ant!.h).toBeGreaterThan(20);
    expect(Math.abs(agi!.h - human!.h) / human!.h).toBeLessThan(0.1);
    const last = CAMERAS[5]!;
    expect(CAMERAS[5]).toEqual({ zoom: 0.62, cx: 90 }); // the ASI framing is unchanged
    expect(asi!.h * last.zoom).toBeGreaterThan(860); // taller than the space above the ground
  });

  it("labels of visible figures do not overlap at any step", () => {
    for (let step = 0; step <= INTELLIGENCE_STEPS; step++) {
      const xs = FIGURES.filter((f) => f.step <= step).map((f) => screenX(f.x, step));
      for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!, `step ${step}`).toBeGreaterThan(220);
      for (const x of xs) expect(x).toBeGreaterThan(100);
    }
  });

  it("renders the thought-experiment badge and hides future figures", () => {
    for (const role of ["controller", "display", "preview"] as SceneRole[])
      for (const locale of ["en", "fr"] as Locale[])
        for (let step = 0; step <= 5; step++) {
          const html = render(IntelligenceScale, {}, ctx(role, step, locale));
          expect(html).toContain(locale === "fr" ? "Expérience de pensée" : "Thought experiment");
          expect(html).toContain(locale === "fr" ? "pas une mesure" : "not a measurement");
          const s = role === "preview" ? 5 : step;
          if (s === LOOP_STEP) {
            expect(html).toContain(tr(LOOP_NODES[0]!, locale).replace(/'/g, "&#x27;"));
            expect(html).toContain(tr(LOOP_NAME, locale));
          }
          expect(html.includes('aria-hidden="false"') || s !== CROWD_STEP).toBe(true);
          expect(html).toContain(`data-step="${s}"`);
          expect(DASHES.test(html)).toBe(false);
        }
  });
});

describe("Enigma and the Bombe demo", () => {
  it("matches the classic Enigma I test vector", () => {
    expect(enigma("AAAAA", { rotors: ["I", "II", "III"], rings: "AAA", start: "AAA" })).toBe("BDZGO");
  });

  it("is its own inverse, never maps a letter to itself, and the ciphertext decrypts to the plaintext", () => {
    expect(enigma(DEMO_CIPHERTEXT, DEMO_SETTINGS)).toBe(DEMO_PLAINTEXT);
    for (let i = 0; i < DEMO_PLAINTEXT.length; i++) expect(DEMO_CIPHERTEXT[i]).not.toBe(DEMO_PLAINTEXT[i]);
    expect(DEMO_PLAINTEXT.startsWith(DEMO_CRIB)).toBe(true);
    expect(DEMO_CRIB.length).toBeGreaterThanOrEqual(12);
  });

  it("the crib search genuinely finds the one setting that was used", () => {
    const result = searchCrib(DEMO_CIPHERTEXT, DEMO_CRIB, { rotors: DEMO_SETTINGS.rotors, rings: DEMO_SETTINGS.rings });
    expect(result.stops).toEqual([DEMO_SETTINGS.start]);
    expect(candidateAt(result.firstIndex)).toBe(DEMO_SETTINGS.start);
    expect(FOUND_SETTING).toBe(DEMO_SETTINGS.start);
    expect(REJECTED_BEFORE_STOP).toBe(result.firstIndex);
    // Decrypting the whole message with the found setting gives the plaintext.
    expect(enigma(DEMO_CIPHERTEXT, { ...DEMO_SETTINGS, start: FOUND_SETTING })).toBe(DEMO_PLAINTEXT);
  });

  it("frames go search, stop, decrypt, ending fully decoded", () => {
    expect(bombeFrame(0)).toMatchObject({ phase: "search", tried: 0, decoded: 0 });
    expect(bombeFrame(SEARCH_TICKS - 1).phase).toBe("search");
    expect(bombeFrame(SEARCH_TICKS)).toMatchObject({ phase: "stop", tried: REJECTED_BEFORE_STOP + 1 });
    expect(bombeFrame(BOMBE_TICKS)).toMatchObject({ phase: "decrypt", decoded: DEMO_PLAINTEXT.length });
    let last = -1;
    for (let t = 0; t <= BOMBE_TICKS; t++) {
      const f = bombeFrame(t);
      expect(f.tried + f.decoded).toBeGreaterThanOrEqual(last);
      last = f.tried + f.decoded;
    }
  });

  it("renders a 108-drum cabinet and the decoded message at the end", () => {
    for (const locale of ["en", "fr"] as Locale[]) {
      const html = renderToStaticMarkup(createElement(BombeDemo, { tick: BOMBE_TICKS, locale }));
      expect((html.match(/data-row="/g) ?? []).length).toBe(108);
      expect(html).toContain(locale === "fr" ? "pluie ce soir" : "rain this evening");
      expect(DASHES.test(html)).toBe(false);
    }
  });

  it("the timeline shows the demo when the Enigma milestone is on stage", () => {
    const index = AI_MILESTONES.findIndex((m) => m.id === "enigma-1939");
    const html = render(AITimeline, { range: "ai" }, ctx("display", index, "en"));
    expect(html).toContain("searched for the settings itself");
    expect((html.match(/data-row="/g) ?? []).length).toBe(108);
  });
});
