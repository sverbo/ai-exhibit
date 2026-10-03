import type { SourceRecord } from "@ai-exhibit/presentation-core";

/**
 * Short label for a source on the projector, e.g. "OECD, 2024".
 * Falls back to the first author's surname, then a truncated title.
 */
export function shortSourceLabel(source: SourceRecord, maxTitle = 32): string {
  const year = source.date?.slice(0, 4);
  let who = source.publisher?.trim();
  if (!who && source.authors?.length) {
    const first = source.authors[0]!.trim();
    const surname = first.split(/\s+/).pop() ?? first;
    who = source.authors.length > 1 ? `${surname} et al.` : surname;
  }
  if (!who) {
    who = source.title.length > maxTitle ? `${source.title.slice(0, maxTitle - 1).trimEnd()}…` : source.title;
  }
  return year ? `${who}, ${year}` : who;
}
