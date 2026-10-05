import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import type { Locale } from "@ai-exhibit/presentation-core";
import { CloudLlmError, type CloudStatus } from "@ai-exhibit/ml-runtime/lm";
import { type SoloDemo, type SoloEnv, troubleOf } from "@ai-exhibit/scene-components/solo/env.ts";
import LadderSolo from "@ai-exhibit/scene-components/solo/LadderSolo.tsx";
import ModelsSolo from "@ai-exhibit/scene-components/solo/ModelsSolo.tsx";
import TokensSolo from "@ai-exhibit/scene-components/solo/TokensSolo.tsx";
import WordsSolo from "@ai-exhibit/scene-components/solo/WordsSolo.tsx";
import { Glossary } from "../Glossary.tsx";
import Play, { DEMOS } from "./Play.tsx";
import { decidePlay, deviceId, forgetDeviceId } from "./play.ts";

const LIVE: CloudStatus = { configured: true, reachable: true, codeRequired: false };

function clean(html: string) {
  expect(html).not.toMatch(/[–—]/);
  expect(html).not.toContain("undefined");
  expect(html).not.toContain("NaN");
}

describe("Try it tab", () => {
  it("is the third tab of the audience page, in both languages, and loads lazily", () => {
    for (const [locale, label] of [["en", "Try it"], ["fr", "Essayer"]] as const) {
      const html = renderToStaticMarkup(createElement(Glossary, { initialLocale: locale, initialTab: "play", playAvailable: true }));
      expect(html).toMatch(new RegExp(`aria-pressed="true"[^>]*>${label}</button>`));
      expect(html).toContain(locale === "fr" ? "Glossaire" : "Glossary");
      // The tab's own chunk is not loaded yet: the fallback shows, the glossary list does not.
      expect(html).not.toContain('type="search"');
      clean(html);
    }
    const glossary = renderToStaticMarkup(createElement(Glossary, { initialLocale: "en", playAvailable: true }));
    expect(glossary).toContain('type="search"');
    expect(glossary).toMatch(/aria-pressed="false"[^>]*>Try it</);
  });

  it("is not offered when the server cannot run the demos live (no working Hugging Face key)", () => {
    const html = renderToStaticMarkup(createElement(Glossary, { initialLocale: "en", initialTab: "play", playAvailable: false }));
    expect(html).not.toMatch(/>Try it<\/button>/);
    expect(html).toContain('type="search"');
  });

  it("lists the four demos, closed until tapped", () => {
    for (const locale of ["en", "fr"] as const) {
      const html = renderToStaticMarkup(createElement(Play, { locale }));
      expect(DEMOS.map((d) => d.id)).toEqual(["ladder", "tokens", "words", "models"]);
      for (const d of DEMOS) expect(html).toContain(d.title[locale].replaceAll("'", "&#x27;"));
      expect(html.match(/aria-expanded="false"/g)).toHaveLength(4);
      clean(html);
    }
  });
});

describe("live or recorded", () => {
  it("plays live only when the server can answer this phone", () => {
    expect(decidePlay(null, null)).toEqual({ mode: "checking" });
    expect(decidePlay(LIVE, null)).toEqual({ mode: "live" });
    expect(decidePlay({ configured: false, reachable: null }, null)).toEqual({ mode: "recorded", why: "no-token" });
    expect(decidePlay({ ...LIVE, reachable: false }, null)).toEqual({ mode: "recorded", why: "offline" });
    expect(decidePlay({ ...LIVE, codeRequired: true }, null)).toEqual({ mode: "recorded", why: "code" });
    expect(decidePlay("error", null)).toEqual({ mode: "recorded", why: "offline" });
    expect(decidePlay(LIVE, "failed")).toEqual({ mode: "recorded", why: "failed" });
  });

  it("tells a busy minute from a failure", () => {
    expect(troubleOf(new CloudLlmError("rate-limited", "x"))).toBe("busy");
    expect(troubleOf(new CloudLlmError("offline", "x"))).toBe("failed");
    expect(troubleOf(new CloudLlmError("timeout", "Cancelled"))).toBeNull();
  });
});

describe("device id", () => {
  afterEach(forgetDeviceId);

  it("is random, made once and kept", () => {
    forgetDeviceId();
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const id = deviceId(storage);
    expect(id).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    forgetDeviceId();
    expect(deviceId(storage)).toBe(id);
    forgetDeviceId();
    expect(deviceId({ getItem: () => null, setItem: () => {} })).not.toBe(id);
  });
});

describe("solo demos", () => {
  const env = (locale: Locale, live: boolean, left: Partial<Record<SoloDemo, number>> = {}): SoloEnv => ({
    locale,
    live,
    cloud: {},
    left: (demo) => left[demo] ?? 10,
    perHour: 10,
    spend: () => {},
    report: () => "failed",
    reducedMotion: true,
  });

  it("render live and recorded, in both languages, without the stage's markup", () => {
    for (const locale of ["en", "fr"] as const) {
      for (const live of [true, false]) {
        for (const Demo of [TokensSolo, WordsSolo, ModelsSolo, LadderSolo]) {
          const html = renderToStaticMarkup(createElement(Demo, { env: env(locale, live) }));
          expect(html.length).toBeGreaterThan(100);
          clean(html);
        }
      }
    }
    // Recorded ladder: the published answers, labelled as recorded.
    const fr = renderToStaticMarkup(createElement(LadderSolo, { env: env("fr", false) }));
    expect(fr).toContain("GPT-2");
    expect(fr).toContain("Exemple enregistré");
    // Live: the base model offers 10 more tokens; the ladder warns it costs three answers.
    expect(renderToStaticMarkup(createElement(ModelsSolo, { env: env("en", true) }))).toContain("+10 tokens");
    // Each demo shows its own asks left, and says so once they are spent.
    expect(renderToStaticMarkup(createElement(LadderSolo, { env: env("en", true, { ladder: 2 }) }))).toContain("2 of 10 asks left for this demo this hour.");
    const spentLadder = renderToStaticMarkup(createElement(LadderSolo, { env: env("fr", true, { ladder: 0 }) }));
    expect(spentLadder).toContain("Exemple enregistré");
    expect(spentLadder).toContain("Les autres démos répondent");
    const models = renderToStaticMarkup(createElement(ModelsSolo, { env: env("en", true, { base: 0, assistant: 4 }) }));
    expect(models).toContain("Show the recorded continuation");
    expect(models).toContain("4 of 10 asks left");
  });
});
