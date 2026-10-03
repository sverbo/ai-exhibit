/**
 * Finds the component copy in TypeScript sources without running them: every
 * object literal with a string `en` property (`{ en: "Stop", fr: "Arrêter" }`)
 * and every `l("fr", "en")` call whose arguments are plain string literals.
 * Their English text is the catalog key of component copy ("copy:Stop").
 * A small lexer, enough for this repository's sources: strings, template
 * literals, comments, brackets.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { LOCALES } from "@ai-exhibit/presentation-core";

export interface CopyText {
  file: string;
  /** 1-based line of the text, for reports. */
  line: number;
  en: string;
  /** Inline translations still in the source, by locale. */
  inline: Record<string, string>;
}

type Tok =
  | { t: "str"; value: string | null; start: number; end: number }
  | { t: "id"; value: string; start: number; end: number }
  | { t: "p"; value: string; start: number; end: number };

/** Decodes a JS string literal body; null for a template with substitutions. */
function decode(body: string, quote: string): string | null {
  if (quote === "`" && /(^|[^\\])\$\{/.test(body)) return null;
  return body.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\r?\n|.)/g, (_, e: string) => {
    if (e.startsWith("u{")) return String.fromCodePoint(parseInt(e.slice(2, -1), 16));
    if (e[0] === "u" && e.length === 5) return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e[0] === "x" && e.length === 3) return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e === "\n" || e === "\r\n") return "";
    return ({ n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", "0": "\0" } as Record<string, string>)[e] ?? e;
  });
}

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const n = src.length;
  // Template literal nesting: each entry is the brace depth where a ${...} opened.
  while (i < n) {
    const c = src[i]!;
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i + 2);
      i = i < 0 ? n : i + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const start = i;
      i++;
      let depth = 0;
      while (i < n) {
        const d = src[i]!;
        if (d === "\\") {
          i += 2;
          continue;
        }
        if (c === "`" && d === "$" && src[i + 1] === "{") {
          depth++;
          i += 2;
          continue;
        }
        if (c === "`" && depth > 0 && d === "}") {
          depth--;
          i++;
          continue;
        }
        if (d === c && depth === 0) break;
        i++;
      }
      const body = src.slice(start + 1, i);
      i++;
      out.push({ t: "str", value: decode(body, c), start, end: i });
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      const start = i;
      while (i < n && /[\w$]/.test(src[i]!)) i++;
      out.push({ t: "id", value: src.slice(start, i), start, end: i });
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    // A regex literal could hold quotes; this repository's copy files have none
    // that matter, and a regex is never mistaken for copy (no `en:` key).
    out.push({ t: "p", value: c, start: i, end: i + 1 });
    i++;
  }
  return out;
}

export interface Found extends CopyText {
  /** Source spans of the inline translations (property or the call), for migration. */
  edits: { start: number; end: number; replace: string }[];
}

/** Every copy text of one source file. */
export function scanSource(file: string, src: string): Found[] {
  const toks = lex(src);
  const found: Found[] = [];
  const lineOf = (pos: number) => src.slice(0, pos).split("\n").length;
  const locales = new Set<string>(LOCALES);

  // l("fr", "en") with two plain string literals.
  for (let k = 0; k + 5 < toks.length; k++) {
    const [a, b, c, d, e, f] = [toks[k], toks[k + 1], toks[k + 2], toks[k + 3], toks[k + 4], toks[k + 5]];
    if (a?.t !== "id" || a.value !== "l" || b?.value !== "(" || c?.t !== "str" || d?.value !== "," || e?.t !== "str" || f?.value !== ")") continue;
    const prev = toks[k - 1];
    if (prev && (prev.value === "." || prev.value === "function")) continue;
    if (c.value === null || e.value === null) continue;
    const enSrc = src.slice(e.start, e.end);
    found.push({ file, line: lineOf(a.start), en: e.value, inline: { fr: c.value }, edits: [{ start: a.start, end: f.end, replace: `{ en: ${enSrc} }` }] });
  }

  // Object literals: direct `key: "string"` properties of each `{ ... }`.
  interface Frame {
    open: string;
    props: Map<string, { tok: Tok & { t: "str" }; keyStart: number }>;
    other: boolean;
  }
  const stack: Frame[] = [];
  for (let k = 0; k < toks.length; k++) {
    const tok = toks[k]!;
    if (tok.t === "p" && (tok.value === "{" || tok.value === "(" || tok.value === "[")) {
      stack.push({ open: tok.value, props: new Map(), other: false });
      continue;
    }
    if (tok.t === "p" && (tok.value === "}" || tok.value === ")" || tok.value === "]")) {
      const frame = stack.pop();
      if (!frame || frame.open !== "{") continue;
      const en = frame.props.get("en");
      if (!en || en.tok.value === null) continue;
      if ([...frame.props.keys()].some((key) => !locales.has(key)) || frame.other) continue;
      const inline: Record<string, string> = {};
      const edits: Found["edits"] = [];
      for (const [key, p] of frame.props) {
        if (key === "en" || p.tok.value === null) continue;
        inline[key] = p.tok.value;
        // Remove `key: "..."` and one adjacent comma.
        let start = p.keyStart;
        let end = p.tok.end;
        const after = src.slice(end).match(/^\s*,/);
        if (after) end += after[0].length;
        else {
          const before = src.slice(0, start).match(/,\s*$/);
          if (before) start -= before[0].length;
        }
        // Whole line: take its indentation and newline too.
        const lineStart = src.lastIndexOf("\n", start - 1) + 1;
        if (/^\s*$/.test(src.slice(lineStart, start)) && /^[ \t]*\n/.test(src.slice(end))) {
          start = lineStart;
          end += src.slice(end).match(/^[ \t]*\n/)![0].length;
        }
        edits.push({ start, end, replace: "" });
      }
      found.push({ file, line: lineOf(en.tok.start), en: en.tok.value, inline, edits });
      continue;
    }
    const frame = stack[stack.length - 1];
    if (!frame || frame.open !== "{") continue;
    // key: <string> , or }   at this frame's depth
    const next = toks[k + 1];
    const value = toks[k + 2];
    const after = toks[k + 3];
    const prev = toks[k - 1];
    const atPropStart = prev?.value === "{" || prev?.value === ",";
    if (tok.t === "id" && atPropStart && next?.value === ":") {
      if (value?.t === "str" && (after?.value === "," || after?.value === "}")) {
        frame.props.set(tok.value, { tok: value, keyStart: tok.start });
      } else frame.other = true;
    } else if (atPropStart && tok.t !== "id") {
      // Spread, computed key or string key: not a plain text object.
      if (tok.value !== "}") frame.other = true;
    }
  }
  return found;
}

export function sourceFiles(root: string, dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(root, dir))) {
    const rel = join(dir, entry);
    if (statSync(join(root, rel)).isDirectory()) sourceFiles(root, rel, out);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) && !entry.endsWith(".d.ts")) out.push(rel);
  }
  return out;
}

/** Component copy lives under these folders. */
export const COPY_DIRS = ["packages/scene-components/src"];

export function scanCopy(root: string): Found[] {
  return COPY_DIRS.flatMap((dir) => sourceFiles(root, dir)).flatMap((file) => scanSource(file, readFileSync(join(root, file), "utf8")));
}
