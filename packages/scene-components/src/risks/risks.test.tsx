import { pick, tr, type L10n, type Locale, type SceneDefinition, type SourceRecord } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sources } from "../../../../content/sources/index.ts";
import { chapter04 } from "../../../../presentations/canonical/src/scenes/04-to-risks.ts";
import type { SceneComponent, SceneContext, SceneRole } from "../contract.ts";
import { INCIDENT_BEATS, INCIDENT_SHORT_BEATS, INCIDENT_STEPS, incidentBeats, incidentSteps, type IncidentVariant } from "./incident.ts";
import { IncidentStory, incidentBeatAt } from "./IncidentStory.tsx";
import { PictureCards, pictureCardsLayout, pictureCardsSteps, visiblePictureCards, type PictureCardsProps } from "./PictureCards.tsx";
import { chapter05 } from "../../../../presentations/canonical/src/scenes/05-closing.ts";
import { isPictureId, PICTURE_IDS, Picture } from "./pictures.tsx";
import { OpinionGap, opinionGapSteps, type OpinionGapProps } from "./OpinionGap.tsx";
import { ResourceList } from "./ResourceList.tsx";
import { resources } from "@ai-exhibit/content/glossary";
import { SingleCase, singleCaseSteps, type SingleCaseProps } from "./SingleCase.tsx";
import { chapter02 } from "../../../../presentations/canonical/src/scenes/02-how-it-works.ts";

const byId = new Map<string, SourceRecord>(sources.map((s) => [s.id, s]));
const DASHES = /[\u2013\u2014]/;
const roles: SceneRole[] = ["controller", "display", "preview"];
const locales: Locale[] = ["en", "fr"];

function expectL10n(value: L10n | undefined, where: string) {
  expect(value, `${where} is missing`).toBeDefined();
  for (const text of [value!.en, pick(value!, "fr")]) {
    expect(text.trim(), `${where} has an empty locale`).not.toBe("");
    expect(DASHES.test(text), `${where} contains an en or em dash: ${text}`).toBe(false);
  }
}

function expectSources(ids: string[] | undefined, where: string) {
  for (const id of ids ?? []) expect(byId.has(id), `${where} cites unknown source ${id}`).toBe(true);
}

function ctx(role: SceneRole, revealStep: number, locale: Locale, steps?: number): SceneContext {
  return {
    scene: { steps } as SceneDefinition,
    locale,
    revealStep,
    role,
    mode: "live",
    state: undefined,
    setState: () => {},
    getSource: (id) => byId.get(id),
    reducedMotion: false,
    sendCommand: () => {},
    glossaryUrl: null,
  };
}

function render(component: SceneComponent, props: object, c: SceneContext): string {
  return renderToStaticMarkup(createElement(component, { props, ctx: c }));
}

const pictureScenes = chapter04.filter(
  (s): s is SceneDefinition & { visual: { layout: "component"; component: string; props: PictureCardsProps } } =>
    s.visual.layout === "component" && s.visual.component === "PictureCards",
);

describe("pictures", () => {
  it("every id draws an svg", () => {
    for (const id of PICTURE_IDS) {
      const html = renderToStaticMarkup(createElement(Picture, { id }));
      expect(html).toContain(`data-picture="${id}"`);
      expect(html).toContain("<svg");
    }
  });
});

describe("incident story", () => {
  it("has one plain sentence per beat, sourced and localized", () => {
    expect(INCIDENT_STEPS).toBe(INCIDENT_BEATS.length - 1);
    for (const b of [...INCIDENT_BEATS, ...INCIDENT_SHORT_BEATS]) {
      expectL10n(b.line, b.id);
      expect(isPictureId(b.picture)).toBe(true);
      expect(b.sourceIds.length, `${b.id} has no source`).toBeGreaterThan(0);
      expectSources(b.sourceIds, b.id);
      // One idea per beat: short enough to read from the back of the room, no figures.
      expect(b.line.en.length, `${b.id} is too long`).toBeLessThanOrEqual(90);
      expect(/\d/.test(b.line.en), `${b.id} shows a figure`).toBe(false);
    }
  });

  it("matches the scene that uses it", () => {
    const scene = chapter04.find((s) => s.id === "04-hf-incident")!;
    expect(scene.visual).toMatchObject({ layout: "component", component: "IncidentStory" });
    const variant = ((scene.visual as unknown as { props?: { variant?: IncidentVariant } }).props?.variant ?? "full") as IncidentVariant;
    expect(scene.steps).toBe(incidentSteps(variant));
    for (const b of incidentBeats(variant)) for (const id of b.sourceIds) expect(scene.sourceIds).toContain(id);
  });

  it("shows the current beat, keeps told beats in the strip, hides the future", () => {
    for (const role of roles)
      for (const locale of locales)
        for (let step = 0; step <= INCIDENT_STEPS; step++) {
          const html = render(IncidentStory, {}, ctx(role, step, locale));
          const current = incidentBeatAt(step, role === "preview", "full");
          expect(html).toContain(tr(INCIDENT_BEATS[current]!.line, locale).replace(/'/g, "&#x27;"));
          expect(html.match(/data-state="past"/g)?.length ?? 0).toBe(current);
          expect(html.match(/data-state="future"/g)?.length ?? 0).toBe(INCIDENT_BEATS.length - 1 - current);
        }
  });
});

describe("PictureCards", () => {
  it("reveals one card per step after the heading, all of them in preview", () => {
    expect(visiblePictureCards(4, 4, 0, false)).toBe(0);
    expect(visiblePictureCards(4, 4, 2, false)).toBe(2);
    expect(visiblePictureCards(4, 4, 9, false)).toBe(4);
    expect(visiblePictureCards(4, 4, 0, true)).toBe(4);
    expect(visiblePictureCards(1, 0, 0, false)).toBe(1);
  });

  it("picks a layout from the card count", () => {
    const card = { picture: "code" as const, line: { en: "a", fr: "a" } };
    expect(pictureCardsLayout({ cards: [card] })).toBe("hero");
    expect(pictureCardsLayout({ cards: [card, card], center: "misuse" })).toBe("versus");
    expect(pictureCardsLayout({ cards: [card, card] })).toBe("row");
  });

  it("chapter 04 scenes use known pictures, both locales, short lines and no figures on screen", () => {
    expect(pictureScenes.length).toBeGreaterThanOrEqual(5);
    for (const scene of pictureScenes) {
      const p = scene.visual.props;
      if (p.heading) expectL10n(p.heading, `${scene.id} heading`);
      if (p.center) expect(isPictureId(p.center), `${scene.id} center`).toBe(true);
      expect(p.cards.length).toBeGreaterThan(0);
      expect(p.cards.length).toBeLessThanOrEqual(4);
      // One card per step (or a single card shown at once).
      expect(scene.steps, `${scene.id} steps`).toBe(p.cards.length === 1 ? 0 : p.cards.length);
      for (const [i, c] of p.cards.entries()) {
        const where = `${scene.id} card ${i}`;
        expect(isPictureId(c.picture), `${where} picture ${c.picture}`).toBe(true);
        expectL10n(c.line, where);
        if (c.title) expectL10n(c.title, `${where} title`);
        expect(c.line.en.length, `${where} line is too long`).toBeLessThanOrEqual(100);
        expect(/\d/.test(c.line.en), `${where} shows a figure`).toBe(false);
        expectSources(c.sourceIds, where);
        for (const id of c.sourceIds ?? []) expect(scene.sourceIds, `${where} source ${id} not on the scene`).toContain(id);
      }
    }
  });

  it("renders every chapter 04 use in every role, locale and step", () => {
    for (const scene of pictureScenes)
      for (const role of roles)
        for (const locale of locales)
          for (let step = 0; step <= (scene.steps ?? 0); step++) {
            const html = render(PictureCards, scene.visual.props, ctx(role, step, locale, scene.steps));
            const expected = role === "preview" ? scene.visual.props.cards.length : visiblePictureCards(scene.visual.props.cards.length, scene.steps ?? 0, step, false);
            expect(html.match(/data-shown=""/g)?.length ?? 0, `${scene.id} ${role} ${step}`).toBe(expected);
          }
  });
});

describe("chapter 04 notes", () => {
  // Storyboard rule: 3 to 7 bullets per scene. Checked on the scenes built with this area's components.
  const OWN = new Set(["PictureCards", "IncidentStory", "OpinionGap", "SingleCase"]);
  it("are 3 to 7 bullets in both locales, without dashes", () => {
    for (const scene of chapter04.filter((s) => s.visual.layout === "component" && OWN.has(s.visual.component)))
      for (const locale of locales) {
        const notes = pick(scene.speakerNotes, locale);
        const bullets = notes.split("\n").filter((l) => l.startsWith("- "));
        expect(bullets.length, `${scene.id} ${locale}`).toBeGreaterThanOrEqual(3);
        expect(bullets.length, `${scene.id} ${locale}`).toBeLessThanOrEqual(7);
        expect(DASHES.test(notes), `${scene.id} ${locale} notes contain a dash`).toBe(false);
      }
  });
});

describe("SingleCase", () => {
  const scene = chapter02.find((s) => s.id === "02-google-photos")!;
  const props = (scene.visual as unknown as { props: SingleCaseProps }).props;

  it("tells the Google Photos case as one picture and one line, sourced", () => {
    expect(scene.visual).toMatchObject({ layout: "component", component: "SingleCase" });
    expect(isPictureId(props.picture)).toBe(true);
    expectL10n(props.title, "title");
    expectL10n(props.line, "line");
    expectL10n(props.outcome, "outcome");
    expect(scene.steps).toBe(singleCaseSteps(props));
    expectSources(scene.sourceIds, scene.id);
  });

  it("adds the outcome at step 1, shows everything in preview", () => {
    for (const locale of locales) {
      expect(render(SingleCase, props, ctx("display", 0, locale))).not.toContain("data-outcome");
      expect(render(SingleCase, props, ctx("display", 1, locale))).toContain("data-outcome");
      expect(render(SingleCase, props, ctx("preview", 0, locale))).toContain("data-outcome");
    }
  });
});

describe("governance (05-governance)", () => {
  const scene = chapter05.find((s) => s.id === "05-governance")!;
  const props = (scene.visual as unknown as { props: PictureCardsProps }).props;

  it("has a card per step, then the organisations, then the takeaway", () => {
    expect(scene.visual).toMatchObject({ layout: "component", component: "PictureCards" });
    expect(scene.steps).toBe(pictureCardsSteps(props));
    expect(props.cards.length).toBeLessThanOrEqual(5);
    for (const [i, c] of props.cards.entries()) {
      expect(isPictureId(c.picture)).toBe(true);
      expectL10n(c.line, `card ${i}`);
      expect(/\d/.test(c.line.en), `card ${i} shows a figure`).toBe(false);
      for (const id of c.sourceIds ?? []) expect(scene.sourceIds).toContain(id);
    }
    expectL10n(props.orgs!.label, "orgs label");
    expectL10n(props.takeaway!.line, "takeaway");
    expectSources(scene.sourceIds, scene.id);
  });

  it("reveals the organisations and the takeaway last", () => {
    const n = props.cards.length;
    const at = (step: number) => render(PictureCards, props, ctx("display", step, "en", scene.steps));
    expect(at(n)).not.toContain("data-orgs");
    expect(at(n + 1)).toContain("data-orgs");
    expect(at(n + 1)).not.toContain("data-takeaway");
    expect(at(n + 2)).toContain("data-takeaway");
    expect(render(PictureCards, props, ctx("preview", 0, "en", scene.steps))).toContain("data-takeaway");
  });
});

describe("OpinionGap (04-opinions)", () => {
  const scene = chapter04.find((s) => s.id === "04-opinions")!;
  const props = (scene.visual as unknown as { props: OpinionGapProps }).props;

  it("is sourced, localized, on a 0 to 100 scale, one row per step", () => {
    expect(scene.visual).toMatchObject({ layout: "component", component: "OpinionGap" });
    expect(scene.steps).toBe(opinionGapSteps(props));
    expectSources(scene.sourceIds, scene.id);
    for (const row of props.rows) {
      expectL10n(row.question, "question");
      expectL10n(row.source, "source");
      for (const b of row.bars) {
        expectL10n(b.who, "who");
        expect(b.value).toBeGreaterThanOrEqual(0);
        expect(b.upTo ?? b.value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("reveals one row per step, all in preview", () => {
    for (let step = 0; step <= (scene.steps ?? 0); step++) {
      const html = render(OpinionGap, props, ctx("display", step, "en"));
      expect(html.match(/data-shown=""/g)?.length ?? 0).toBe(step + 1);
    }
    expect(render(OpinionGap, props, ctx("preview", 0, "fr")).match(/data-shown=""/g)?.length).toBe(props.rows.length);
  });
});

describe("ResourceList (05-resources)", () => {
  it("renders every entry of the shared resources list, with the glossary code", () => {
    const scene = chapter05.find((s) => s.id === "05-resources")!;
    expect(scene.visual).toMatchObject({ layout: "component", component: "ResourceList" });
    for (const locale of locales) {
      const c = { ...ctx("display", 0, locale), glossaryUrl: "http://192.168.1.20:4317/glossary" };
      const html = render(ResourceList, {}, c);
      expect(resources.length).toBeGreaterThan(0);
      for (const r of resources) {
        expect(html).toContain(r.title);
        expect(html).toContain(tr(r.by, locale).replace(/'/g, "&#x27;"));
      }
      expect(html.match(/data-kind=/g)?.length).toBe(resources.length);
      expect(html).toContain("192.168.1.20:4317/glossary");
    }
  });
});
