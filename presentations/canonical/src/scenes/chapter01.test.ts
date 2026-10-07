import { describe, expect, it } from "vitest";
import { chapter01 } from "./01-capabilities.ts";

const chapter = chapter01.filter((s) => s.chapter === "01");

describe("chapter 01 scenes", () => {
  it("are numbered 1.0 to 1.10 in order, with no gap", () => {
    expect(chapter.map((s) => s.number)).toEqual(["1.0", ...Array.from({ length: 10 }, (_, i) => `1.${i + 1}`)]);
  });

  it("explain that the model has no memory just before the tool call", () => {
    const ids = chapter.map((s) => s.id);
    expect(ids.slice(ids.indexOf("01-personal-demo"))).toEqual([
      "01-personal-demo",
      "01-no-memory",
      "01-tool-call",
      "01-one-request",
      "01-agent-loop",
    ]);
    const scene = chapter.find((s) => s.id === "01-no-memory")!;
    expect(scene).toMatchObject({ number: "1.7", code: "nomem", steps: 4, optional: false });
    expect(scene.visual).toMatchObject({ layout: "component", component: "PictureCards" });
  });
});
