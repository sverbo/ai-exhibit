import { installCatalogs, registerPresentationTexts, type PresentationDefinition } from "@ai-exhibit/presentation-core";
import { sources } from "@ai-exhibit/content/sources";
import { catalogs } from "../locales/index.ts";
import { artifacts } from "./artifacts.ts";
import { chapters } from "./chapters.ts";
import { editions } from "./editions.ts";
import { chapter01 } from "./scenes/01-capabilities.ts";
import { chapter02 } from "./scenes/02-how-it-works.ts";
import { chapter03 } from "./scenes/03-builders.ts";
import { chapter04 } from "./scenes/04-to-risks.ts";
import { chapter05 } from "./scenes/05-closing.ts";

export const canonical: PresentationDefinition = {
  id: "canonical",
  title: {
    en: "What AI can do today, how it works, and its risks",
  },
  chapters,
  scenes: [...chapter01, ...chapter02, ...chapter03, ...chapter04, ...chapter05],
  editions,
  // The launcher offers these, default first (docs/specs/2026-10-03-locales.md).
  locales: ["en", "fr"],
  artifacts,
  sources,
  // Codes of removed scenes: never reuse them (personal configs may still name them).
  retiredSceneCodes: ["open"],
};

// Texts are written in English; each language's catalog (locales/<lang>.json)
// translates them by key. See docs/authoring/content-guide.md, "Languages".
registerPresentationTexts(canonical);
installCatalogs(catalogs);

export { catalogs };
export default canonical;
