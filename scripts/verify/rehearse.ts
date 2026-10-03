// `pnpm rehearse`: walks every scene and reveal step of every edition, in every
// language the talk offers, in a real browser, live and in fallback, with the
// internet blocked, plus the presenter/projector loop and the static
// views. Exits 1 on any problem (including raw term markup on screen).
//
//   pnpm rehearse                       every edition x every offered language, one private runtime + Vite each
//   pnpm rehearse --edition full        one edition (repeatable)
//   pnpm rehearse --lang fr             one language (repeatable)
//   pnpm rehearse --base-url http://127.0.0.1:5173
//                                       use a running app (its session gets driven)
//   pnpm rehearse --jobs 2 --headed --shots /tmp/shots --viewport 1920x1080

import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { chromium, type Browser } from "@playwright/test";
import canonical from "@ai-exhibit/canonical";
import { parseLocale, resolveEdition, type Locale } from "@ai-exhibit/presentation-core";
import { checkViews, guardSelfTest, Recorder, walkFollow, walkPresent, type CheckOptions } from "./rehearse/checks.ts";
import { formatReport, type EditionSummary, type Problem } from "./rehearse/report.ts";
import { startStack, type Stack } from "./rehearse/stack.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const { values } = parseArgs({
  options: {
    edition: { type: "string", multiple: true },
    lang: { type: "string", multiple: true },
    "base-url": { type: "string" },
    jobs: { type: "string" },
    headed: { type: "boolean", default: false },
    shots: { type: "string" },
    viewport: { type: "string", default: "1280x720" },
    settle: { type: "string", default: "120" },
    "live-dwell": { type: "string", default: "5000" },
    "skip-follow": { type: "boolean", default: false },
    "skip-views": { type: "boolean", default: false },
  },
});

const editionIds = values.edition ?? canonical.editions.map((e) => e.id);
for (const id of editionIds) {
  if (!canonical.editions.some((e) => e.id === id)) {
    console.error(`Unknown edition "${id}". Known: ${canonical.editions.map((e) => e.id).join(", ")}`);
    process.exit(2);
  }
}
const langs: Locale[] = [];
for (const raw of values.lang ?? canonical.locales) {
  const l = parseLocale(raw);
  if (!l) {
    console.error(`Unknown language "${raw}". Known: ${canonical.locales.join(", ")}`);
    process.exit(2);
  }
  langs.push(l);
}
/** One run per edition and language, labelled "full/fr". */
const runs = editionIds.flatMap((edition) => langs.map((locale) => ({ edition, locale, label: `${edition}/${locale}` })));
type Run = (typeof runs)[number];
const [vw, vh] = values.viewport!.split("x").map(Number);
if (!vw || !vh) {
  console.error(`--viewport must look like 1280x720`);
  process.exit(2);
}
const baseUrl = values["base-url"];
// An external app is rehearsed one run at a time.
const jobs = baseUrl ? 1 : Math.max(1, Number(values.jobs ?? runs.length));

async function rehearseEdition(browser: Browser, run: Run, base: string): Promise<{ problems: Problem[]; summary: EditionSummary }> {
  const t0 = Date.now();
  const { edition, locale, label } = run;
  const scenes = resolveEdition(canonical, edition).scenes;
  const rec = new Recorder(label);
  const opts: CheckOptions = {
    baseUrl: base,
    edition,
    locale,
    scenes,
    showLimitMs: 2000,
    settleMs: Number(values.settle),
    liveDwellMs: Number(values["live-dwell"]),
    viewport: { width: vw!, height: vh! },
    shotsDir: values.shots ? resolve(values.shots) : null,
    log: (line) => console.log(`[${label}] ${line}`),
  };
  let positions = 0;
  const step = async (name: string, fn: () => Promise<number | void>) => {
    const s = Date.now();
    try {
      const n = await fn();
      if (typeof n === "number") positions += n;
    } catch (err) {
      rec.add({ view: name, scene: "-", step: null, mode: "-" }, "view", `${name} crashed: ${(err as Error).message.split("\n")[0]}`);
    }
    opts.log(`${name} done in ${((Date.now() - s) / 1000).toFixed(0)} s`);
  };
  await step("present", () => walkPresent(browser, rec, opts));
  if (!values["skip-follow"]) await step("follow", async () => walkFollow(browser, rec, opts));
  if (!values["skip-views"]) await step("views", () => checkViews(browser, rec, opts));
  return { problems: rec.problems, summary: { edition: label, scenes: scenes.length, positions, ms: Date.now() - t0 } };
}

async function main(): Promise<number> {
  const started = Date.now();
  const browser = await chromium.launch({ headless: !values.headed });
  const stacks: Stack[] = [];
  const problems: Problem[] = [];
  const summaries: EditionSummary[] = [];
  const cleanup = async () => {
    await Promise.allSettled(stacks.map((s) => s.close()));
    await browser.close().catch(() => {});
  };
  process.once("SIGINT", () => {
    void cleanup().then(() => process.exit(130));
  });
  try {
    const queue = [...runs];
    const bases: string[] = [];
    if (baseUrl) bases.push(baseUrl);
    else {
      // One after another: the first one warms Vite's dependency cache for the others.
      for (let i = 0; i < Math.min(jobs, runs.length); i++) {
        const stack = await startStack(repoRoot);
        stacks.push(stack);
        bases.push(stack.baseUrl);
        console.log(`stack ${i + 1} ready at ${stack.baseUrl}`);
      }
    }
    if (!(await guardSelfTest(browser, bases[0]!))) throw new Error("the internet guard did not block a request to example.com");
    const worker = async (base: string, stack: Stack | undefined) => {
      for (let run = queue.shift(); run; run = queue.shift()) {
        console.log(`[${run.label}] rehearsing on ${base}`);
        const r = await rehearseEdition(browser, run, base);
        problems.push(...r.problems);
        summaries.push(r.summary);
        if (stack && r.problems.length > 0) console.log(`[${run.label}] runtime log tail:\n${stack.logs()}`);
      }
    };
    const workers = bases.map((base, i) => worker(base, stacks[i]));
    await Promise.all(workers);
  } finally {
    await cleanup();
  }

  const order = runs.map((r) => r.label);
  summaries.sort((a, b) => order.indexOf(a.edition) - order.indexOf(b.edition));
  const reportPath = join(tmpdir(), "ai-exhibit-rehearsal.json");
  writeFileSync(reportPath, JSON.stringify({ summaries, problems }, null, 2));
  console.log(`\nRehearsal (${((Date.now() - started) / 1000).toFixed(0)} s, internet blocked, viewport ${vw}x${vh}):`);
  console.log(formatReport(problems, summaries));
  console.log(`\nFull report: ${reportPath}`);
  return problems.length > 0 ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
