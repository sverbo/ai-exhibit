import { stepCount, type Locale, type SourceRecord } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { canonical } from "../../../presentations/canonical/src/index.ts";
import "./registerAll.ts";
import type { SceneContext, SceneRole } from "./contract.ts";
import { SceneRenderer } from "./renderer/SceneRenderer.tsx";

const byId = new Map<string, SourceRecord>(canonical.sources.map((s) => [s.id, s]));
const roles: SceneRole[] = ["controller", "display", "preview"];

function ctx(sceneIndex: number, role: SceneRole, revealStep: number, locale: Locale): SceneContext {
  return {
    scene: canonical.scenes[sceneIndex]!,
    locale,
    revealStep,
    role,
    mode: "live",
    state: undefined,
    setState: () => {},
    getSource: (id) => byId.get(id),
    reducedMotion: true,
    sendCommand: () => {},
    glossaryUrl: null,
  };
}

/** Text the audience would read: tags and attribute values, entities decoded enough for markers. */
function visibleText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
}

describe("every canonical scene, in every offered locale", () => {
  for (const locale of canonical.locales) {
    it(`renders term markup as italics, never raw (${locale})`, () => {
      const raw: string[] = [];
      canonical.scenes.forEach((scene, i) => {
        for (const role of roles) {
          for (let step = 0; step <= stepCount(scene); step++) {
            const html = renderToStaticMarkup(createElement(SceneRenderer, { scene, ctx: ctx(i, role, step, locale) }));
            // Attributes (aria-label, title) must use plainText(): look at the whole markup.
            const m = /\(\*|\*\)/.exec(html);
            if (m) raw.push(`${scene.id} ${role}@${step}: ...${visibleText(html.slice(Math.max(0, m.index - 80), m.index + 40)).trim()}...`);
          }
        }
      });
      expect([...new Set(raw)]).toEqual([]);
    });
  }
});
