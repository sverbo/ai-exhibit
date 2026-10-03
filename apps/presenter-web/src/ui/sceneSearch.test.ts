import { describe, expect, it } from "vitest";
import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { filterScenes } from "./sceneSearch.ts";

const scene = (id: string, code: string, number: string, title: string): SceneDefinition =>
  ({ id, code, number, title: { en: title, fr: title } }) as unknown as SceneDefinition;

const scenes = [
  scene("02-tokens", "tokn", "2.14", "Tokens"),
  scene("02-text-network", "nnet", "2.7", "A neural network"),
  scene("03-race", "race", "3.2", "Race dynamics"),
  scene("04-hf-incident", "hack", "4.9", "Points, not the trace"),
];

describe("filterScenes", () => {
  it("finds a scene by its code, an exact code first", () => {
    expect(filterScenes(scenes, "race", "en").map((s) => s.code)).toEqual(["race", "hack"]);
    expect(filterScenes(scenes, "TOKN", "en").map((s) => s.code)).toEqual(["tokn"]);
    expect(filterScenes(scenes, "nn", "en").map((s) => s.code)).toEqual(["nnet"]);
  });

  it("still finds scenes by number, ID and title words", () => {
    expect(filterScenes(scenes, "2.1", "en").map((s) => s.code)).toEqual(["tokn"]);
    expect(filterScenes(scenes, "hf-inc", "en").map((s) => s.code)).toEqual(["hack"]);
    expect(filterScenes(scenes, "neural net", "en").map((s) => s.code)).toEqual(["nnet"]);
    expect(filterScenes(scenes, "", "en")).toBe(scenes);
  });
});
