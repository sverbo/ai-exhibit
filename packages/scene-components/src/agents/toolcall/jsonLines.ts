/**
 * Pretty-prints a JSON value into lines of typed tokens so a component can
 * colour the syntax and highlight chosen fields. Small objects and arrays of
 * plain values stay on one line, which keeps projected JSON short.
 */

export type JsonTokenKind = "key" | "string" | "number" | "literal" | "punct";

export interface JsonToken {
  kind: JsonTokenKind;
  text: string;
}

export interface JsonLine {
  depth: number;
  /** Dotted path of the field this line belongs to ("" for the outer braces), e.g. "input.location". */
  path: string;
  tokens: JsonToken[];
}

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Default width (characters) under which a small object or array stays on one line. */
export const INLINE_MAX = 44;

const isPlain = (v: Json) => v === null || typeof v !== "object";

function scalar(v: Json): JsonToken {
  if (typeof v === "string") return { kind: "string", text: JSON.stringify(v) };
  if (typeof v === "number") return { kind: "number", text: String(v) };
  return { kind: "literal", text: String(v) };
}

/** One-line tokens for a value, or null when it should span several lines. */
function inline(v: Json, max: number): JsonToken[] | null {
  if (isPlain(v)) return [scalar(v)];
  const entries = Array.isArray(v) ? v.map((x) => [null, x] as const) : Object.entries(v);
  if (!entries.every(([, x]) => isPlain(x))) return null;
  const open: JsonToken = { kind: "punct", text: Array.isArray(v) ? "[" : "{ " };
  const close: JsonToken = { kind: "punct", text: Array.isArray(v) ? "]" : " }" };
  const out: JsonToken[] = [open];
  entries.forEach(([k, x], i) => {
    if (i > 0) out.push({ kind: "punct", text: ", " });
    if (k !== null) out.push({ kind: "key", text: JSON.stringify(k) }, { kind: "punct", text: ": " });
    out.push(scalar(x));
  });
  out.push(close);
  return out.reduce((n, t) => n + t.text.length, 0) <= max ? out : null;
}

export function jsonLines(value: Json, inlineMax: number = INLINE_MAX): JsonLine[] {
  const lines: JsonLine[] = [];
  const walk = (v: Json, depth: number, path: string, prefix: JsonToken[], suffix: string) => {
    const one = inline(v, inlineMax);
    if (one) {
      lines.push({ depth, path, tokens: [...prefix, ...one, ...(suffix ? [{ kind: "punct" as const, text: suffix }] : [])] });
      return;
    }
    const arr = Array.isArray(v);
    lines.push({ depth, path, tokens: [...prefix, { kind: "punct", text: arr ? "[" : "{" }] });
    const entries = arr ? (v as Json[]).map((x, i) => [String(i), x] as const) : Object.entries(v as object);
    entries.forEach(([k, x], i) => {
      const childPath = path ? `${path}.${k}` : k;
      const keyTokens: JsonToken[] = arr ? [] : [{ kind: "key", text: JSON.stringify(k) }, { kind: "punct", text: ": " }];
      walk(x as Json, depth + 1, childPath, keyTokens, i < entries.length - 1 ? "," : "");
    });
    lines.push({ depth, path, tokens: [{ kind: "punct", text: (arr ? "]" : "}") + suffix }] });
  };
  walk(value, 0, "", [], "");
  return lines;
}

/** True when `path` is one of `highlights` or lies inside one of them. */
export function isHighlighted(path: string, highlights: readonly string[]): boolean {
  return highlights.some((h) => path === h || path.startsWith(`${h}.`));
}
