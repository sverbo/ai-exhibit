import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SceneComponent, SceneContext, SceneRole } from "../../contract.ts";
import { HoldingSlide } from "../intro/HoldingSlide.tsx";
import { cloudReady, isReady } from "../intro/readiness.ts";
import { YouTubeScene } from "./YouTubeScene.tsx";
import { hasPlayer, needsYouTubeSeek, playerVars, watchUrl } from "./youtube.ts";

const DASH = new RegExp("[\\u2013\\u2014]");

describe("youtube helpers", () => {
  it("turns captions on in the slide's language, without YouTube controls", () => {
    const v = playerVars("fr", "http://127.0.0.1:5173");
    expect(v).toMatchObject({ cc_load_policy: 1, cc_lang_pref: "fr", hl: "fr", controls: 1, autoplay: 0, origin: "http://127.0.0.1:5173" });
    expect(playerVars("en")).not.toHaveProperty("origin");
  });

  it("gives a player to the audience screen only", () => {
    expect(hasPlayer("display", true)).toBe(true);
    expect(hasPlayer("controller", true)).toBe(true);
    expect(hasPlayer("controller", false)).toBe(false);
    expect(hasPlayer("display", false)).toBe(false);
    expect(hasPlayer("display", undefined)).toBe(false);
    expect(hasPlayer("preview", true)).toBe(false);
  });

  it("tolerates more drift while playing", () => {
    expect(needsYouTubeSeek(10, 11.5, true)).toBe(false);
    expect(needsYouTubeSeek(10, 12.5, true)).toBe(true);
    expect(needsYouTubeSeek(10, 10.8, false)).toBe(true);
    expect(watchUrl("uX-Cq-rvlv8")).toBe("https://www.youtube.com/watch?v=uX-Cq-rvlv8");
  });
});

function ctx(role: SceneRole, audienceScreen: boolean): SceneContext {
  return {
    scene: { id: "test" } as SceneDefinition,
    locale: "en",
    revealStep: 0,
    role,
    mode: "live",
    state: undefined,
    setState: () => {},
    getSource: () => undefined,
    reducedMotion: false,
    sendCommand: () => {},
    glossaryUrl: "http://192.168.1.20:4317/glossary",
    audienceScreen,
  };
}

const VIDEO = {
  videoId: "uX-Cq-rvlv8",
  durationSec: 57,
  kicker: { en: "Before we start" },
  heading: { en: "This is not science fiction" },
  caption: { en: "\"Welcome to AI In Context\", AI In Context on YouTube, 57 s" },
};
const video = (role: SceneRole, audience: boolean) =>
  renderToStaticMarkup(createElement(YouTubeScene as SceneComponent, { props: VIDEO, ctx: ctx(role, audience) }));

describe("YouTubeScene renders", () => {
  it("shows the presenter a still card and the controls, never a player", () => {
    const html = video("controller", false);
    expect(html).toContain("Plays with sound on the projector only");
    expect(html).toContain("0:00 / 0:57");
    expect(html).toContain("Play");
    expect(html).not.toContain("aria-hidden=\"true\" class=\"_player");
  });

  it("gives the audience screen a player box and no controls when it follows", () => {
    const html = video("display", true);
    expect(html).toMatch(/class="_player/);
    expect(html).not.toContain("Back to start");
    expect(html).toContain("This is not science fiction");
  });

  it("keeps previews static and every view free of long dashes", () => {
    expect(video("preview", true)).not.toMatch(/class="_player/);
    for (const role of ["controller", "display", "preview"] as const)
      for (const audience of [true, false]) expect(video(role, audience)).not.toMatch(DASH);
  });
});

describe("holding slide", () => {
  it("is ready only when the cloud answers fully and the video script loaded", () => {
    expect(cloudReady({ configured: true, reachable: true }, false)).toBe(true);
    expect(cloudReady({ configured: true, reachable: false }, false)).toBe(false);
    expect(cloudReady({ configured: false, reachable: null }, false)).toBe(false);
    expect(cloudReady({ configured: true, reachable: true, codeRequired: true }, false)).toBe(false);
    expect(cloudReady({ configured: true, reachable: true, codeRequired: true }, true)).toBe(true);
    expect(isReady({ models: "ok", video: "ok", simulation: false })).toBe(true);
    expect(isReady({ models: "ok", video: "pending", simulation: true })).toBe(false);
  });

  it("shows the title, the calm line, the glossary code and a quiet status", () => {
    const html = renderToStaticMarkup(
      createElement(HoldingSlide as SceneComponent, { props: { title: { en: "The talk" } }, ctx: ctx("display", true) }),
    );
    expect(html).toContain("The talk");
    expect(html).toContain("The talk starts in a moment");
    expect(html).toContain("Glossary and resources");
    expect(html).toContain("Getting ready");
    expect(html).toContain("simulation");
  });
});
