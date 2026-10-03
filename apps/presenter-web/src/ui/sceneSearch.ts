import type { Locale, SceneDefinition } from "@ai-exhibit/presentation-core";

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Filters scenes for the go-to palette: an exact scene code first, then number
 * prefix ("3.2"), ID, code prefix or title words. Keeps the given order otherwise.
 */
export function filterScenes(scenes: SceneDefinition[], query: string, locale: Locale): SceneDefinition[] {
  const q = normalize(query.trim());
  if (!q) return scenes;
  const exact = scenes.filter((s) => s.code === q);
  const rest = scenes.filter((s) => {
    if (s.code === q) return false;
    if (s.number.startsWith(q) || s.id.includes(q) || s.code.startsWith(q)) return true;
    const title = normalize(`${s.title[locale]} ${s.title.en}`);
    return q.split(/\s+/).every((w) => title.includes(w));
  });
  return [...exact, ...rest];
}
