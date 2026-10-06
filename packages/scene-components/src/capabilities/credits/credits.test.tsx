import { tr, type Locale, type SceneDefinition, type SourceRecord } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sources } from "../../../../../content/sources/index.ts";
import { credits } from "../../../../../presentations/canonical/src/credits.ts";
import { chapter01 } from "../../../../../presentations/canonical/src/scenes/01-capabilities.ts";
import { chapter05 } from "../../../../../presentations/canonical/src/scenes/05-closing.ts";
import type { SceneComponent, SceneContext, SceneRole } from "../../contract.ts";
import { HoldingSlide } from "../intro/HoldingSlide.tsx";
import { withName, type TalkCredits } from "./Byline.tsx";
import { CreditsSlide } from "./CreditsSlide.tsx";

const byId = new Map<string, SourceRecord>(sources.map((s) => [s.id, s]));
const roles: SceneRole[] = ["controller", "display", "preview"];
const locales: Locale[] = ["en", "fr"];

function ctx(role: SceneRole, locale: Locale): SceneContext {
  return {
    scene: { steps: 0 } as SceneDefinition,
    locale,
    revealStep: 0,
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

function propsOf(scenes: SceneDefinition[], id: string): Record<string, unknown> {
  const visual = scenes.find((s) => s.id === id)!.visual;
  if (visual.layout !== "component") throw new Error(`${id} is not a component scene`);
  return visual.props ?? {};
}

const render = (C: SceneComponent, props: Record<string, unknown>, c: SceneContext) => renderToStaticMarkup(createElement(C, { props, ctx: c }));
const fork: TalkCredits = { ...credits, fork: { name: "Ada Example", url: "https://example.org/talk" } };
const ORIGINAL_LINK = 'href="https://ai-exhibit.samverbo.com"';
const LINKEDIN = "https://www.linkedin.com/in/verboomensamuel";
const linkedinLabel = (locale: Locale) => tr({ en: "{name} on LinkedIn" }, locale).replace("{name}", "Samuel Verboomen");
const count = (html: string, s: string) => html.split(s).length - 1;

describe("credits", () => {
  it("the original talk has no fork, and both slides read credits.ts", () => {
    expect(credits.fork).toBeNull();
    expect(credits.original.linkedin).toBe(LINKEDIN);
    expect(propsOf(chapter01, "00-holding").credits).toBe(credits);
    expect(propsOf(chapter05, "05-credits").credits).toBe(credits);
  });

  it("the credits slide comes last, after the resources", () => {
    expect(chapter05.at(-1)?.id).toBe("05-credits");
    expect(chapter05.at(-2)?.id).toBe("05-resources");
  });

  for (const [name, C, id] of [
    ["HoldingSlide", HoldingSlide, "00-holding"],
    ["CreditsSlide", CreditsSlide, "05-credits"],
  ] as const) {
    const scenes = id === "00-holding" ? chapter01 : chapter05;
    it(`${name} shows the author, and in a fork the fork's line then the original with its link`, () => {
      const props = propsOf(scenes, id);
      for (const locale of locales) {
        for (const role of roles) {
          const own = render(C as SceneComponent, props, ctx(role, locale));
          expect(own).toContain("Samuel Verboomen");
          expect(own).not.toMatch(/[\u2013\u2014]/);
          expect(own).not.toContain(tr({ en: "Original presentation by {name}" }, locale).replace("{name}", ""));

          const forked = render(C as SceneComponent, { ...props, credits: fork }, ctx(role, locale));
          const at = (s: string) => forked.indexOf(s);
          expect(at("Ada Example")).toBeGreaterThan(-1);
          expect(at("Samuel Verboomen")).toBeGreaterThan(at("Ada Example"));
          expect(forked).toContain("ai-exhibit.samverbo.com");
          // A real link on the live screens, plain text in the preview.
          if (role === "preview") {
            expect(own).not.toContain("<a ");
            expect(forked).not.toContain("<a ");
            expect(own).not.toContain(LINKEDIN);
          } else {
            expect(forked).toContain(ORIGINAL_LINK);
            // The author's LinkedIn mark, once, in the original and in a fork (on the original line).
            for (const html of [own, forked]) {
              expect(count(html, `href="${LINKEDIN}"`)).toBe(1);
              expect(html).toContain(`aria-label="${linkedinLabel(locale)}"`);
              expect(html).toMatch(new RegExp(`<a [^>]*href="${LINKEDIN}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"`));
            }
            expect(forked.indexOf(LINKEDIN)).toBeGreaterThan(at("Samuel Verboomen"));
            expect(forked.indexOf(LINKEDIN)).toBeLessThan(forked.indexOf(ORIGINAL_LINK));
            // A fork's own LinkedIn gets its own mark, after the fork's name.
            const withOwn = { ...fork, fork: { ...fork.fork!, linkedin: "https://www.linkedin.com/in/ada-example" } };
            const both = render(C as SceneComponent, { ...props, credits: withOwn }, ctx(role, locale));
            expect(both.indexOf("linkedin.com/in/ada-example")).toBeGreaterThan(both.indexOf("Ada Example"));
            expect(both.indexOf("linkedin.com/in/ada-example")).toBeLessThan(both.indexOf(LINKEDIN));
          }
        }
      }
    });
  }

  it("the credits slide names its four works, each backed by a known source", () => {
    const scene = chapter05.find((s) => s.id === "05-credits")!;
    const items = propsOf(chapter05, "05-credits").items as { sourceIds: string[] }[];
    expect(items).toHaveLength(4);
    for (const item of items) for (const sid of item.sourceIds) expect(scene.sourceIds).toContain(sid);
    for (const sid of scene.sourceIds) expect(byId.get(sid)?.verification).toBe("verified");
  });

  it("elides French \"de\" before a name starting with a vowel", () => {
    expect(withName("Présentation de {name}", "Ada Example", "fr")).toBe("Présentation d'Ada Example");
    expect(withName("Présentation de {name}", "Samuel Verboomen", "fr")).toBe("Présentation de Samuel Verboomen");
    expect(withName("Presentation by {name}", "Ada Example", "en")).toBe("Presentation by Ada Example");
  });
});
