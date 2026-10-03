import type { PresentationDefinition } from "@ai-exhibit/presentation-core";
import { sources } from "@ai-exhibit/content/sources";
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
    fr: "Ce que l'IA sait faire aujourd'hui, comment elle fonctionne, et ses risques",
  },
  chapters,
  scenes: [...chapter01, ...chapter02, ...chapter03, ...chapter04, ...chapter05],
  editions,
  artifacts,
  sources,
};

export default canonical;
