/**
 * Speaker notes are a markdown bullet list: the points to say, in order, with
 * bold words where they matter. Every bullet is a plain point (no special
 * "Ask" or "Do" bullets: a bold word inside the text says it). This splits
 * them into bullets so every view can show them its own way. Anything that is
 * not a list (older paragraph notes) comes back as `prose`.
 */
/** "personal": the presenter's own note (personal config), plain text, always first. */
export type NoteKind = "point" | "personal";

export interface NoteBullet {
  kind: NoteKind;
  /** Inline markdown of the bullet. */
  text: string;
  /** Indented sub-bullets, inline markdown. */
  sub: string[];
}

export interface ParsedNotes {
  bullets: NoteBullet[];
  /** Non-list markdown found around the bullets (kept, never dropped). */
  prose: string;
}

const BULLET = /^(\s*)[-*+]\s+(.*)$/;

export function parseNotes(markdown: string): ParsedNotes {
  const bullets: NoteBullet[] = [];
  const prose: string[] = [];
  let last: NoteBullet | null = null;
  let lastIndent = 0;
  for (const raw of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    if (!raw.trim()) continue;
    const m = BULLET.exec(raw);
    if (m) {
      const indent = m[1]!.replace(/\t/g, "  ").length;
      const body = m[2]!.trim();
      if (last && indent >= lastIndent + 2) {
        last.sub.push(body);
        continue;
      }
      last = { kind: "point", text: body, sub: [] };
      lastIndent = indent;
      bullets.push(last);
      continue;
    }
    // A wrapped continuation line belongs to the bullet above it.
    if (last && /^\s+\S/.test(raw)) {
      if (last.sub.length) last.sub[last.sub.length - 1] += ` ${raw.trim()}`;
      else last.text += ` ${raw.trim()}`;
      continue;
    }
    last = null;
    prose.push(raw);
  }
  return { bullets, prose: prose.join("\n").trim() };
}

/**
 * Puts the presenter's personal note first. Its text is plain (never parsed as
 * markdown): an imported config is not repository content. Blank notes add nothing.
 */
export function withPersonalNote(parsed: ParsedNotes, note: string | undefined): ParsedNotes {
  const text = note?.trim();
  if (!text) return parsed;
  return { ...parsed, bullets: [{ kind: "personal", text, sub: [] }, ...parsed.bullets] };
}

/** Plain text of inline markdown (bold, italics, code, links), for compact views. */
export function plainInline(markdown: string): string {
  return markdown
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, "$1$2")
    .replace(/\*([^*]+)\*|_([^_]+)_/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}
