import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CloudRecordingFile } from "@ai-exhibit/ml-runtime/lm";
import { languageModelFor, tokenizerFor } from "./data.ts";

describe("languageModelFor", () => {
  it("maps French to Qwen2.5 and English to SmolLM2, with an override", () => {
    expect(languageModelFor("fr", "base")).toBe("qwen2.5-0.5b");
    expect(languageModelFor("fr", "instruct")).toBe("qwen2.5-0.5b-instruct");
    expect(languageModelFor("en", "base")).toBe("amd-olmo-1b");
    expect(languageModelFor("en", "instruct")).toBe("amd-olmo-1b-sft-dpo");
    expect(languageModelFor("en", "instruct", "qwen2.5")).toBe("qwen2.5-0.5b-instruct");
    expect(tokenizerFor("fr")).toBe("qwen2.5-0.5b");
  });
});

describe("guardrail recordings", () => {
  it("only stores refusals", async () => {
    const { GUARDRAIL_PROMPT, isRefusal } = await import("./data.ts");
    const rec = JSON.parse(
      readFileSync(new URL("../../../../content/assets/recordings/cloud.json", import.meta.url), "utf8"),
    ) as CloudRecordingFile;
    const guard = rec.completions.filter((c) => c.prompt === GUARDRAIL_PROMPT.en || c.prompt === GUARDRAIL_PROMPT.fr);
    expect(guard.length).toBeGreaterThan(0);
    for (const c of guard) expect(isRefusal(c.text)).toBe(true);
  });
});
