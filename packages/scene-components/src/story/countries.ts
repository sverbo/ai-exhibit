import type { L10n } from "@ai-exhibit/presentation-core";

/** Headquarters countries shown as small flags next to company logos. */
export type CountryCode = "us" | "gb" | "cn" | "fr" | "nl" | "jp" | "kr" | "tw";

export const COUNTRY_NAMES: Record<CountryCode, L10n> = {
  us: { en: "United States", fr: "États-Unis" },
  gb: { en: "United Kingdom", fr: "Royaume-Uni" },
  cn: { en: "China", fr: "Chine" },
  fr: { en: "France", fr: "France" },
  nl: { en: "Netherlands", fr: "Pays-Bas" },
  jp: { en: "Japan", fr: "Japon" },
  kr: { en: "South Korea", fr: "Corée du Sud" },
  tw: { en: "Taiwan", fr: "Taïwan" },
};

export interface Headquarters {
  countries: CountryCode[];
  /** Sources that state the headquarters (or the parent's, for a division). */
  sourceIds: string[];
}

/**
 * Keyed by actor ID in IndustryStack. Google DeepMind shows two
 * flags: its lab is in London and its parent, Alphabet, is American.
 */
export const HEADQUARTERS: Record<string, Headquarters> = {
  "google-deepmind": { countries: ["gb", "us"], sourceIds: ["sc-wiki-google-deepmind", "st-wiki-google"] },
  openai: { countries: ["us"], sourceIds: ["sc-wiki-openai"] },
  anthropic: { countries: ["us"], sourceIds: ["sc-wiki-anthropic"] },
  xai: { countries: ["us"], sourceIds: ["sc-wiki-xai"] },
  meta: { countries: ["us"], sourceIds: ["sc-wiki-meta-ai"] },
  mistral: { countries: ["fr"], sourceIds: ["sc-wiki-mistral"] },
  deepseek: { countries: ["cn"], sourceIds: ["sc-wiki-deepseek"] },
  qwen: { countries: ["cn"], sourceIds: ["sc-wiki-qwen", "sc-wiki-alibaba-cloud"] },
  "moonshot-ai": { countries: ["cn"], sourceIds: ["st-wiki-moonshot-ai"] },
  zai: { countries: ["cn"], sourceIds: ["st-wiki-zai"] },
  aws: { countries: ["us"], sourceIds: ["st-wiki-aws", "st-wiki-amazon"] },
  "microsoft-azure": { countries: ["us"], sourceIds: ["st-wiki-microsoft"] },
  "google-cloud": { countries: ["us"], sourceIds: ["st-wiki-google"] },
  oracle: { countries: ["us"], sourceIds: ["st-wiki-oracle"] },
  coreweave: { countries: ["us"], sourceIds: ["st-wiki-coreweave"] },
  "alibaba-cloud": { countries: ["cn"], sourceIds: ["sc-wiki-alibaba-cloud"] },
  nvidia: { countries: ["us"], sourceIds: ["sc-wiki-nvidia"] },
  amd: { countries: ["us"], sourceIds: ["sc-wiki-amd"] },
  "google-tpu": { countries: ["us"], sourceIds: ["st-wiki-google"] },
  huawei: { countries: ["cn"], sourceIds: ["sc-wiki-hisilicon"] },
  tsmc: { countries: ["tw"], sourceIds: ["sc-tsmc-2025-annual-report"] },
  samsung: { countries: ["kr"], sourceIds: ["sc-wiki-samsung-electronics"] },
  intel: { countries: ["us"], sourceIds: ["sc-wiki-intel"] },
  smic: { countries: ["cn"], sourceIds: ["sc-smic-about"] },
  asml: { countries: ["nl"], sourceIds: ["sc-asml-about"] },
  "applied-materials": { countries: ["us"], sourceIds: ["sc-wiki-applied-materials"] },
  "lam-research": { countries: ["us"], sourceIds: ["sc-lam-investor"] },
  "tokyo-electron": { countries: ["jp"], sourceIds: ["sc-wiki-tokyo-electron"] },
  kla: { countries: ["us"], sourceIds: ["sc-wiki-kla"] },
};

/** Flag image ID in credits.ts. */
export function flagImageId(code: CountryCode): string {
  return `flag-${code}`;
}
