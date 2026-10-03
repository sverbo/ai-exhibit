// Browser checks for one edition: the solo walk, presenter/projector/remote,
// and the static views. Every problem lands in a Recorder.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import {
  nextPosition,
  prevPosition,
  stepCount,
  type Locale,
  type Position,
  type SceneDefinition,
} from "@ai-exhibit/presentation-core";
import { clip, isLocalUrl, normalizeDetail, type Cursor, type Mode, type Problem, type ProblemKind } from "./report.ts";

export interface CheckOptions {
  baseUrl: string;
  edition: string;
  /** Language of the talk for this run (`?lang=` on every talk view). */
  locale: Locale;
  scenes: SceneDefinition[];
  /** Max time for a scene to show something after a keypress (spec: 2 s). */
  showLimitMs: number;
  /** Pause after each position so effects run and late errors surface. */
  settleMs: number;
  /** Extra time on live-compute scenes (runtime B/C) so model loading and its errors happen. */
  liveDwellMs: number;
  viewport: { width: number; height: number };
  shotsDir: string | null;
  log: (line: string) => void;
}

/** Collects problems for one edition, tagged with the current cursor of each page. */
export class Recorder {
  readonly problems: Problem[] = [];
  constructor(readonly edition: string) {}

  add(cursor: Cursor, kind: ProblemKind, detail: string): void {
    this.problems.push({ edition: this.edition, ...cursor, kind, detail: clip(normalizeDetail(detail)) });
  }

  /** Blocks and reports every request that would leave this machine. */
  async guardContext(context: BrowserContext, cursor: () => Cursor): Promise<void> {
    await context.route(
      (url) => !isLocalUrl(url.href),
      async (route) => {
        this.add(cursor(), "external-request", `${route.request().method()} ${route.request().url()}`);
        await route.abort("internetdisconnected");
      },
    );
  }

  watch(page: Page, cursor: () => Cursor): void {
    page.on("pageerror", (err) => this.add(cursor(), "exception", err.stack ?? err.message));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const loc = msg.location();
      const where = loc.url ? ` (${loc.url}:${loc.lineNumber})` : "";
      this.add(cursor(), "console-error", `${msg.text()}${where}`);
    });
    page.on("response", (res) => {
      if (res.status() >= 400 && isLocalUrl(res.url())) {
        this.add(cursor(), "http-error", `${res.status()} ${res.request().method()} ${res.url()}`);
      }
    });
    page.on("requestfailed", (req) => {
      const failure = req.failure()?.errorText ?? "";
      // Aborted: navigation or a component cancelling its own fetch. Blocked external requests are reported by the route.
      if (/ERR_ABORTED|ERR_INTERNET_DISCONNECTED/.test(failure)) return;
      this.add(cursor(), "http-error", `${failure} ${req.method()} ${req.url()}`);
    });
    page.on("websocket", (ws) => {
      if (!isLocalUrl(ws.url())) this.add(cursor(), "external-request", `WebSocket ${ws.url()}`);
    });
  }
}

interface Want {
  id: string;
  step: number | null;
  mode: Mode | null;
}

/** Selector of the scene roots each view shows; the page filters by attributes. */
const PROJECTOR_ROOTS = "[data-projector] [data-scene-id]";
const CONTROLLER_ROOTS = '[data-scene-id][data-role="controller"]';

/**
 * Waits until a scene root matching `want` exists and shows something other
 * than its placard or a Suspense loading line. Returns elapsed ms or null.
 */
async function waitScene(page: Page, roots: string, want: Want, timeoutMs: number): Promise<number | null> {
  const t0 = Date.now();
  try {
    await page.waitForFunction(
      ({ roots, want }) => {
        for (const root of Array.from(document.querySelectorAll(roots))) {
          if (root.getAttribute("data-scene-id") !== want.id) continue;
          if (want.step !== null && root.getAttribute("data-reveal-step") !== String(want.step)) continue;
          if (want.mode !== null && want.mode !== "-" && root.getAttribute("data-mode") !== want.mode) continue;
          for (const child of Array.from(root.children)) {
            if (child.tagName === "FOOTER" || child.hasAttribute("data-scene-loading")) continue;
            if ((child.textContent ?? "").trim().length > 0) return true;
            if (child.querySelector("canvas, svg, img, video")) return true;
          }
        }
        return false;
      },
      { roots, want },
      { timeout: timeoutMs, polling: 25 },
    );
    return Date.now() - t0;
  } catch {
    return null;
  }
}

async function describeShown(page: Page, roots: string): Promise<string> {
  return page.evaluate((roots) => {
    const shown = Array.from(document.querySelectorAll(roots)).map(
      (r) => `${r.getAttribute("data-scene-id")}@${r.getAttribute("data-reveal-step")} ${r.getAttribute("data-mode")}`,
    );
    const active = document.activeElement;
    const focus = active && active !== document.body ? `, focus on <${active.tagName.toLowerCase()}>` : "";
    return `showing ${shown.join(", ") || "no scene"}${focus}`;
  }, roots);
}

/** Reports error boundaries and unregistered components currently on the page. */
async function collectFailures(page: Page, rec: Recorder, cursor: Cursor): Promise<void> {
  const found = await page.$$eval("[data-scene-failure], [data-scene-missing]", (els) =>
    els.map((el) => {
      const root = el.closest("[data-scene-id]");
      return {
        scene: root?.getAttribute("data-scene-id") ?? "?",
        role: root?.getAttribute("data-role") ?? "?",
        failure: el.getAttribute("data-scene-failure"),
        missing: el.getAttribute("data-scene-missing"),
      };
    }),
  );
  for (const f of found) {
    if (f.failure !== null) rec.add({ ...cursor, scene: f.scene }, "scene-failure", `[${f.role}] ${f.failure}`);
    else rec.add({ ...cursor, scene: f.scene }, "missing-component", `[${f.role}] component "${f.missing}" is not registered`);
  }
  // Term markup "(*...*)" must render as italics (<Rich>), never as raw text.
  const raw = await page.evaluate(() => {
    const out: string[] = [];
    for (const root of Array.from(document.querySelectorAll("[data-scene-id]"))) {
      const text = (root as HTMLElement).innerText ?? "";
      const m = /\(\*|\*\)/.exec(text);
      if (m) out.push(`${root.getAttribute("data-scene-id")}: ...${text.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, " ")}...`);
    }
    return out;
  });
  for (const r of new Set(raw)) rec.add(cursor, "locale", `raw term markup on screen: ${r}`);
}

/** The view's root element must carry the requested language. */
async function checkLang(page: Page, rec: Recorder, cursor: Cursor, locale: Locale): Promise<void> {
  const ok = await page.evaluate((l) => document.querySelector(`[lang="${l}"]`) !== null || document.documentElement.lang === l, locale);
  if (!ok) rec.add(cursor, "locale", `no element in lang="${locale}": the view did not open in the requested language`);
}

/**
 * Finds visible text that leaves the 1920x1080 stage or is cut off by an
 * overflow-clipping box (ellipsis and line clamps excepted). Distances are in
 * stage pixels. Waits for running animations first.
 */
async function collectLayout(page: Page, rec: Recorder, cursor: Cursor, sceneId: string): Promise<void> {
  await page
    .waitForFunction(
      () => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity),
      null,
      { timeout: 2500, polling: 100 },
    )
    .catch(() => {});
  const issues = await page.evaluate(
    ({ roots, sceneId }) => {
      const root = Array.from(document.querySelectorAll(roots)).find((r) => r.getAttribute("data-scene-id") === sceneId);
      const stageEl = root?.parentElement;
      if (!root || !stageEl) return [];
      const stage = stageEl.getBoundingClientRect();
      const scale = stage.width / 1920 || 1;
      const tol = 3 * scale;
      const out: { text: string; how: string; px: number }[] = [];
      const clipper = (el: Element): Element | null => {
        for (let a = el.parentElement; a && a !== stageEl; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (cs.overflowX !== "visible" || cs.overflowY !== "visible") return a;
        }
        return null;
      };
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = (node.textContent ?? "").trim();
        const el = node.parentElement;
        if (!text || !el) continue;
        if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
        const cs = getComputedStyle(el);
        if (cs.textOverflow === "ellipsis" || (cs.webkitLineClamp && cs.webkitLineClamp !== "none")) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
        if (rects.length === 0) continue;
        const box = {
          left: Math.min(...rects.map((r) => r.left)),
          top: Math.min(...rects.map((r) => r.top)),
          right: Math.max(...rects.map((r) => r.right)),
          bottom: Math.max(...rects.map((r) => r.bottom)),
        };
        const past = (b: { left: number; top: number; right: number; bottom: number }) =>
          Math.max(b.left - box.left, b.top - box.top, box.right - b.right, box.bottom - b.bottom);
        const offStage = past(stage);
        if (offStage > tol) {
          out.push({ text, how: "leaves the stage", px: Math.round(offStage / scale) });
          continue;
        }
        const clip = clipper(el);
        if (clip) {
          const cut = past(clip.getBoundingClientRect());
          if (cut > tol) out.push({ text, how: "is cut off by its box", px: Math.round(cut / scale) });
        }
      }
      return out;
    },
    { roots: PROJECTOR_ROOTS, sceneId },
  );
  if (issues.length === 0) return;
  issues.sort((a, b) => b.px - a.px);
  const worst = issues.slice(0, 3).map((i) => `"${clip(i.text, 40)}" ${i.how} by ${i.px}px`);
  rec.add(cursor, "layout", `${issues.length} text run(s) overflow: ${worst.join("; ")}`);
}

class Walker {
  cursor: Cursor;
  constructor(
    readonly page: Page,
    readonly rec: Recorder,
    readonly roots: string,
    readonly opts: CheckOptions,
    view: string,
  ) {
    this.cursor = { view, scene: "-", step: null, mode: "-" };
  }

  /**
   * Presses `key` (or nothing) and checks the scene arrives in time. Returns
   * false when it never arrived, in which case the walk cannot continue.
   */
  async go(key: string | null, want: Want, slowKind: string): Promise<boolean> {
    this.cursor = { ...this.cursor, scene: want.id, step: want.step, mode: want.mode ?? "-" };
    if (key) await this.page.keyboard.press(key);
    let ms = await waitScene(this.page, this.roots, want, this.opts.showLimitMs);
    if (ms === null) {
      ms = await waitScene(this.page, this.roots, want, 8000);
      if (ms === null) {
        const shown = await describeShown(this.page, this.roots);
        this.rec.add(this.cursor, "stuck", `${key ?? "load"}: expected ${want.id}@${want.step} ${want.mode}, ${shown}`);
        return false;
      }
      this.rec.add(this.cursor, "slow-scene", `${slowKind} took ${this.opts.showLimitMs + ms} ms (limit ${this.opts.showLimitMs} ms)`);
    }
    if (this.opts.settleMs > 0) await this.page.waitForTimeout(this.opts.settleMs);
    await collectFailures(this.page, this.rec, this.cursor);
    return true;
  }
}

async function newPage(browser: Browser, rec: Recorder, opts: CheckOptions, viewport = opts.viewport, shared?: BrowserContext) {
  let cursor: () => Cursor = () => ({ view: "setup", scene: "-", step: null, mode: "-" });
  // A shared context is a second window of the same browser profile.
  const context = shared ?? (await browser.newContext({ viewport, reducedMotion: "no-preference" }));
  if (!shared) {
    // tsx compiles with keepNames: functions passed to page.evaluate may call __name.
    await context.addInitScript("globalThis.__name = (fn) => fn;");
    await rec.guardContext(context, () => cursor());
  }
  const page = await context.newPage();
  if (shared) await page.setViewportSize(viewport);
  rec.watch(page, () => cursor());
  return {
    context,
    page,
    track: (fn: () => Cursor) => {
      cursor = fn;
    },
  };
}

/** A view URL; talk views (those given an edition, and the projector) also get `lang`. */
function url(opts: CheckOptions, path: string, params: Record<string, string> = {}): string {
  const u = new URL(path, opts.baseUrl);
  if ("edition" in params || path === "/projector") u.searchParams.set("lang", opts.locale);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.href;
}

/**
 * /present: every scene, every reveal step forward in live mode, F, every step
 * backward in fallback mode, F again, then Shift+Right to the next scene.
 * Returns the number of positions checked.
 */
export async function walkPresent(browser: Browser, rec: Recorder, opts: CheckOptions): Promise<number> {
  const { scenes } = opts;
  const { context, page, track } = await newPage(browser, rec, opts);
  const w = new Walker(page, rec, PROJECTOR_ROOTS, opts, "present");
  track(() => w.cursor);
  let positions = 0;
  try {
    await page.goto(url(opts, "/present", { edition: opts.edition }));
    const first = scenes[0];
    if (!first) return 0;
    // The first load compiles modules: allow more than the per-scene limit.
    w.cursor = { view: "present", scene: first.id, step: 0, mode: "live" };
    if ((await waitScene(page, PROJECTOR_ROOTS, { id: first.id, step: 0, mode: "live" }, 30_000)) === null) {
      rec.add(w.cursor, "stuck", `first scene never showed, ${await describeShown(page, PROJECTOR_ROOTS)}`);
      return 0;
    }
    await collectFailures(page, rec, w.cursor);
    await checkLang(page, rec, w.cursor, opts.locale);
    // N hides the rehearsal HUD so screenshots show the stage as the audience sees it.
    if (opts.shotsDir) await page.keyboard.press("n");
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]!;
      const n = stepCount(scene);
      positions += 1;
      for (let k = 1; k <= n; k++) {
        if (!(await w.go("ArrowRight", { id: scene.id, step: k, mode: "live" }, "reveal step"))) return positions;
        positions += 1;
      }
      if (scene.runtimeClass !== "A" && opts.liveDwellMs > 0) {
        await page.waitForTimeout(opts.liveDwellMs);
        await collectFailures(page, rec, w.cursor);
      }
      await collectLayout(page, rec, w.cursor, scene.id);
      if (opts.shotsDir) await shoot(page, opts, scene.id);
      if (!(await w.go("f", { id: scene.id, step: n, mode: "fallback" }, "switch to fallback"))) return positions;
      positions += 1;
      for (let k = n - 1; k >= 0; k--) {
        if (!(await w.go("ArrowLeft", { id: scene.id, step: k, mode: "fallback" }, "step back"))) return positions;
        positions += 1;
      }
      if (!(await w.go("f", { id: scene.id, step: 0, mode: "live" }, "switch back to live"))) return positions;
      const next = scenes[i + 1];
      if (next && !(await w.go("Shift+ArrowRight", { id: next.id, step: 0, mode: "live" }, "scene"))) return positions;
    }
    // R resets the last scene to step 0 and clears its fallback flag.
    const last = scenes[scenes.length - 1]!;
    if (stepCount(last) > 0) {
      await w.go("ArrowRight", { id: last.id, step: 1, mode: "live" }, "reveal step");
      await w.go("r", { id: last.id, step: 0, mode: "live" }, "reset");
    }
    return positions;
  } finally {
    await context.close();
  }
}

async function shoot(page: Page, opts: CheckOptions, sceneId: string): Promise<void> {
  const dir = join(opts.shotsDir!, `${opts.viewport.width}x${opts.viewport.height}`, opts.edition);
  mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(dir, `${sceneId}.png`) });
}

/**
 * /presenter drives, /projector follows: every position of the edition with
 * the arrow key, checking both the presenter's live stage and the projector.
 * Both pages share one browser context, like two windows of the same profile
 * (their session is a BroadcastChannel). Then the projector's own arrow keys
 * (a clicker focused on it) move both, and its blackout key blacks it out.
 */
export async function walkFollow(browser: Browser, rec: Recorder, opts: CheckOptions): Promise<number> {
  const { scenes } = opts;
  const first = scenes[0];
  if (!first) return 0;
  const presenter = await newPage(browser, rec, opts, { width: 1600, height: 1000 });
  const projector = await newPage(browser, rec, opts, opts.viewport, presenter.context);
  const pw = new Walker(presenter.page, rec, CONTROLLER_ROOTS, opts, "presenter");
  const jw = new Walker(projector.page, rec, PROJECTOR_ROOTS, opts, "projector");
  presenter.track(() => pw.cursor);
  projector.track(() => jw.cursor);
  let positions = 0;
  try {
    await projector.page.goto(url(opts, "/projector"));
    await presenter.page.goto(url(opts, "/presenter", { edition: opts.edition, scene: first.id }));
    let pos: Position = { sceneId: first.id, revealStep: 0 };
    const want = (p: Position): Want => ({ id: p.sceneId, step: p.revealStep, mode: "live" });
    pw.cursor = { view: "presenter", scene: first.id, step: 0, mode: "live" };
    if ((await waitScene(presenter.page, CONTROLLER_ROOTS, want(pos), 30_000)) === null) {
      rec.add(pw.cursor, "stuck", `presenter never showed the first scene, ${await describeShown(presenter.page, CONTROLLER_ROOTS)}`);
      return 0;
    }
    if (!(await followed(jw, want(pos)))) return 0;
    for (;;) {
      positions += 1;
      const next = nextPosition(scenes, pos);
      if (next.sceneId === pos.sceneId && next.revealStep === pos.revealStep) break;
      pos = next;
      if (!(await pw.go("ArrowRight", want(pos), pos.revealStep === 0 ? "scene" : "reveal step"))) return positions;
      if (!(await followed(jw, want(pos)))) return positions;
    }

    // A clicker focused on the projector: its keys move the presenter too.
    const kw: Cursor = { view: "projector keys", scene: pos.sceneId, step: pos.revealStep, mode: "live" };
    try {
      await projector.page.bringToFront();
      const prev = prevPosition(scenes, pos);
      await projector.page.keyboard.press("ArrowLeft");
      if (!(await followed(jw, want(prev), "projector key prev"))) return positions;
      if ((await waitScene(presenter.page, CONTROLLER_ROOTS, want(prev), opts.showLimitMs)) === null) {
        rec.add(kw, "follow", "the presenter did not follow the projector's arrow key");
      }
      await projector.page.keyboard.press("ArrowRight");
      if (!(await followed(jw, want(pos), "projector key next"))) return positions;
      await projector.page.keyboard.press("b");
      try {
        await projector.page.locator('[data-projector="blackout"]').waitFor({ timeout: opts.showLimitMs });
      } catch {
        rec.add(kw, "follow", "the projector's blackout key did not black it out");
      }
      await projector.page.keyboard.press("b");
      await followed(jw, want(pos), "projector blackout off");
    } catch (err) {
      rec.add(kw, "view", `projector keys: ${(err as Error).message.split("\n")[0]}`);
    }
    return positions;
  } finally {
    await presenter.context.close();
  }
}

async function followed(jw: Walker, want: Want, what = "projector follow"): Promise<boolean> {
  jw.cursor = { ...jw.cursor, scene: want.id, step: want.step, mode: want.mode ?? "-" };
  const ms = await waitScene(jw.page, PROJECTOR_ROOTS, want, jw.opts.showLimitMs);
  if (ms === null) {
    const shown = await describeShown(jw.page, PROJECTOR_ROOTS);
    jw.rec.add(jw.cursor, "follow", `${what}: projector did not reach ${want.id}@${want.step} ${want.mode} within ${jw.opts.showLimitMs} ms, ${shown}`);
    return false;
  }
  await collectFailures(jw.page, jw.rec, jw.cursor);
  return true;
}

/** /, /overview (every preview), /handout and /glossary. */
export async function checkViews(browser: Browser, rec: Recorder, opts: CheckOptions): Promise<void> {
  const { context, page, track } = await newPage(browser, rec, opts);
  let cursor: Cursor = { view: "-", scene: "-", step: null, mode: "-" };
  track(() => cursor);
  const visit = async (view: string, path: string, check: () => Promise<void>) => {
    cursor = { view, scene: "-", step: null, mode: "-" };
    try {
      await page.goto(url(opts, path, path === "/" || path === "/glossary" ? {} : { edition: opts.edition }));
      await check();
      if (path === "/handout" || path === "/overview") await checkLang(page, rec, cursor, opts.locale);
      await page.waitForTimeout(opts.settleMs);
      await collectFailures(page, rec, cursor);
    } catch (err) {
      rec.add(cursor, "view", (err as Error).message.split("\n")[0]!);
    }
  };
  const hasText = async (selector: string) => {
    await page.waitForFunction((s) => (document.querySelector(s)?.textContent ?? "").trim().length > 0, selector, { timeout: 15_000 });
  };
  try {
    await visit("launcher", "/", () => hasText("h1"));
    await visit("glossary", "/glossary", () => hasText("#root"));
    await visit("handout", "/handout", () => hasText("main"));
    await visit("overview", "/overview", async () => {
      await hasText("h1");
      const deadline = Date.now() + 30_000;
      for (;;) {
        const count = await page.locator('[data-role="preview"][data-scene-id]').count();
        if (count >= opts.scenes.length) break;
        if (Date.now() > deadline) {
          rec.add(cursor, "view", `overview rendered ${count} of ${opts.scenes.length} scene previews`);
          break;
        }
        await page.mouse.wheel(0, 1200);
        await page.waitForTimeout(60);
      }
    });
  } finally {
    await context.close();
  }
}

/** Proves the internet guard works: a fetch to a public host must be blocked and reported. */
export async function guardSelfTest(browser: Browser, baseUrl: string): Promise<boolean> {
  const rec = new Recorder("self-test");
  const context = await browser.newContext();
  try {
    await rec.guardContext(context, () => ({ view: "self-test", scene: "-", step: null, mode: "-" }));
    const page = await context.newPage();
    await page.goto(new URL("/api/network", baseUrl).href);
    const blocked = await page.evaluate(() =>
      fetch("https://example.com/", { mode: "no-cors" }).then(
        () => false,
        () => true,
      ),
    );
    return blocked && rec.problems.some((p) => p.kind === "external-request");
  } finally {
    await context.close();
  }
}
