/**
 * Speaker notes are a short markdown bullet list (storyboard v1): the concepts
 * to explain, in order, plus optional "**Ask:**" and "**Do:**" bullets. This
 * splits them into typed bullets so every view can show them its own way.
 * Anything that is not a list (older paragraph notes) comes back as `prose`.
 */
/** "personal": the presenter's own note (personal config), plain text, always first. */
export type NoteKind = "point" | "ask" | "do" | "personal";

export interface NoteBullet {
  kind: NoteKind;
  /** The cue word as written ("Ask", "Demander"...), without the colon; null for points. */
  cue: string | null;
  /** Inline markdown of the bullet, cue removed. */
  text: string;
  /** Indented sub-bullets, inline markdown. */
  sub: string[];
}

export interface ParsedNotes {
  bullets: NoteBullet[];
  /** Non-list markdown found around the bullets (kept, never dropped). */
  prose: string;
}

const CUES: Record<string, Exclude<NoteKind, "point" | "personal">> = {
  ask: "ask",
  question: "ask",
  demander: "ask",
  demandez: "ask",
  do: "do",
  action: "do",
  faire: "do",
  faites: "do",
  show: "do",
  montrer: "do",
  montrez: "do",
};

const BULLET = /^(\s*)[-*+]\s+(.*)$/;
// "**Ask:** text", "**Ask**: text", "Ask: text", French "**Demander :** text".
const CUE = /^(?:\*\*|__)?\s*([A-Za-zÀ-ÿ]+)\s*(?::\s*(?:\*\*|__)|(?:\*\*|__)\s*:|:)\s*(.*)$/;

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
      last = { ...cueOf(body), sub: [] };
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
  return { ...parsed, bullets: [{ kind: "personal", cue: null, text, sub: [] }, ...parsed.bullets] };
}

function cueOf(body: string): Pick<NoteBullet, "kind" | "cue" | "text"> {
  const m = CUE.exec(body);
  if (m) {
    const kind = CUES[m[1]!.toLowerCase()];
    if (kind) return { kind, cue: m[1]!, text: m[2]!.trim() };
  }
  return { kind: "point", cue: null, text: body };
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
