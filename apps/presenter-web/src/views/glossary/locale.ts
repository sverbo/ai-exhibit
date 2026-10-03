import type { Locale } from "@ai-exhibit/presentation-core";

/** Language of the glossary before the reader picks one: the phone's own preference. */
export function guessLocale(languages: readonly string[] | undefined): Locale {
  for (const l of languages ?? []) {
    const short = l.slice(0, 2).toLowerCase();
    if (short === "fr" || short === "en") return short;
  }
  return "fr";
}
