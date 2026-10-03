import { afterEach, describe, expect, it } from "vitest";
import { checkCatalog, presentationTexts, registerPresentationTexts } from "./catalog.ts";
import { installCatalogs, pick, tr } from "./locales.ts";
import type { PresentationDefinition, SceneDefinition } from "./types.ts";

const shared = { en: "Shared prompt" };
function presentation(): PresentationDefinition {
  const scene = (id: string) =>
    ({
      id,
      title: { en: `Title ${id}` },
      visual: { layout: "component", component: "X", props: { prompt: shared, items: [{ en: "One" }, { en: "Two?" }] } },
    }) as unknown as SceneDefinition;
  return {
    id: "p",
    title: { en: "Talk" },
    chapters: [{ id: "01", title: { en: "Part" }, summary: { en: "Sum" } }],
    editions: [{ id: "full", title: { en: "Full" }, targetMinutes: [0, 1], cut: "full" }],
    locales: ["en", "fr"],
    scenes: [scene("01-a"), scene("01-b")],
    artifacts: [],
    sources: [],
  };
}

afterEach(() => installCatalogs({}));

describe("catalogs", () => {
  it("keys every text by where it lives; a shared text keeps its first key", () => {
    const keys = presentationTexts(presentation()).map((t) => t.key);
    expect(keys).toEqual([
      "presentation/title",
      "chapter:01/title",
      "chapter:01/summary",
      "edition:full/title",
      "01-a/title",
      "01-a/visual.props.prompt",
      "01-a/visual.props.items.0",
      "01-a/visual.props.items.1",
      "01-b/title",
      "01-b/visual.props.items.0",
      "01-b/visual.props.items.1",
    ]);
  });

  it("reads a registered text from the installed catalog, with typography for display only", () => {
    const p = presentation();
    registerPresentationTexts(p);
    installCatalogs({ fr: { "01-a/visual.props.items.1": { source: "Two?", text: "Deux ?" }, "01-a/visual.props.prompt": { source: "Shared prompt", text: "Consigne ?" } } });
    const items = (p.scenes[0]!.visual as unknown as { props: { items: { en: string }[] } }).props.items;
    expect(tr(items[1]!, "fr")).toBe("Deux ?");
    expect(pick(shared, "fr")).toBe("Consigne ?");
    expect(tr(items[0]!, "fr")).toBe("One");
    expect(tr(items[1]!, "en")).toBe("Two?");
  });

  it("reads unregistered copy by its English text, an inline value first", () => {
    installCatalogs({ fr: { "copy:Stop": { source: "Stop", text: "Arrêter" } } });
    expect(tr({ en: "Stop" }, "fr")).toBe("Arrêter");
    expect(tr({ en: "Stop", fr: "Halte" }, "fr")).toBe("Halte");
    expect(tr({ en: "Go" }, "fr")).toBe("Go");
  });

  it("reports missing, outdated and stale entries", () => {
    const texts = presentationTexts(presentation()).slice(0, 2);
    const issues = checkCatalog(
      texts,
      "fr",
      { "presentation/title": { source: "Old talk", text: "Conférence" }, gone: { source: "x", text: "y" } },
      { file: "fr.json", offered: true },
    );
    expect(issues.map((i) => [i.kind, i.level])).toEqual([
      ["outdated", "error"],
      ["missing", "error"],
      ["stale", "warning"],
    ]);
  });
});
