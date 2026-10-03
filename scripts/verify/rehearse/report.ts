// Problem records and the text report printed by `pnpm rehearse`.

export type Mode = "live" | "fallback" | "-";

/** Where the rehearsal was when something happened. */
export interface Cursor {
  view: string;
  scene: string;
  step: number | null;
  mode: Mode;
}

export type ProblemKind =
  | "exception"
  | "console-error"
  | "http-error"
  | "external-request"
  | "scene-failure"
  | "missing-component"
  | "slow-scene"
  | "stuck"
  | "follow"
  | "layout"
  | "view"
  /** Raw term markup "(*...*)" on screen, or a view not in the requested language. */
  | "locale";

export interface Problem extends Cursor {
  edition: string;
  kind: ProblemKind;
  detail: string;
}

const MAX_DETAIL = 400;

export function clip(text: string, max = MAX_DETAIL): string {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > max ? `${one.slice(0, max - 3)}...` : one;
}

/** True for URLs that stay on this machine (or never touch the network). */
export function isLocalUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return true;
  }
  if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) return true;
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host.endsWith(".localhost") || host === "::1" || /^127\./.test(host);
}

/** Replaces volatile parts (ports, hashes, query strings) so equal problems group together. */
export function normalizeDetail(detail: string): string {
  return detail
    .replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/g, "<local>")
    .replace(/\?[tv]=[\w.-]+/g, "")
    .replace(/:\d+:\d+\)/g, ")");
}

export interface ProblemGroup {
  kind: ProblemKind;
  detail: string;
  occurrences: Problem[];
}

export function groupProblems(problems: readonly Problem[]): ProblemGroup[] {
  const groups = new Map<string, ProblemGroup>();
  for (const p of problems) {
    const detail = normalizeDetail(p.detail);
    const key = `${p.kind}\u0000${detail}`;
    let g = groups.get(key);
    if (!g) {
      g = { kind: p.kind, detail, occurrences: [] };
      groups.set(key, g);
    }
    g.occurrences.push(p);
  }
  return [...groups.values()];
}

export function formatWhere(p: Problem): string {
  const step = p.step === null ? "" : `@${p.step}`;
  const mode = p.mode === "-" ? "" : ` ${p.mode}`;
  return `${p.edition} ${p.view} ${p.scene}${step}${mode}`;
}

export interface EditionSummary {
  edition: string;
  scenes: number;
  positions: number;
  ms: number;
}

/** Concise text report: one block per distinct problem, with where it happened. */
export function formatReport(problems: readonly Problem[], summaries: readonly EditionSummary[], maxWhere = 6): string {
  const lines: string[] = [];
  for (const s of summaries) {
    lines.push(`  ${s.edition.padEnd(9)} ${String(s.scenes).padStart(3)} scenes, ${String(s.positions).padStart(4)} positions checked, ${(s.ms / 1000).toFixed(0)} s`);
  }
  const groups = groupProblems(problems);
  if (groups.length === 0) {
    lines.push("", "No problems found.");
    return lines.join("\n");
  }
  lines.push("", `${problems.length} problem(s) in ${groups.length} group(s):`);
  for (const g of groups) {
    lines.push("", `[${g.kind}] ${g.detail}`);
    const where = dedupe(g.occurrences.map(formatWhere));
    for (const w of where.slice(0, maxWhere)) lines.push(`    at ${w}`);
    if (where.length > maxWhere) lines.push(`    ... and ${where.length - maxWhere} more`);
  }
  return lines.join("\n");
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
