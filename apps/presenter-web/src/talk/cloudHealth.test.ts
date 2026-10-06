import { describe, expect, it } from "vitest";
import { cloudHealthText, LOW_CREDIT_USD } from "./runtime.ts";

const ready = (key: Record<string, unknown>) =>
  cloudHealthText({ configured: true, reachable: true, codeRequired: false, key: { valid: true, plan: "free", inference: true, creditsExhausted: false, ...key } });

describe("cloudHealthText", () => {
  it("says ready, with a warning and the amount when the credit left is low", () => {
    expect(ready({ billing: true, creditLeftUsd: 9.86 })).toEqual({ state: "warn", text: "Hugging Face ready, but careful: about $9.86 of credit left" });
    expect(ready({ billing: true, creditLeftUsd: -0.5 }).text).toContain("$0.00");
  });

  it("stays a plain ready when the credit is high or cannot be read", () => {
    expect(ready({ billing: true, creditLeftUsd: LOW_CREDIT_USD + 0.01 }).state).toBe("ok");
    expect(ready({ billing: false })).toEqual({ state: "ok", text: "Hugging Face ready (key OK)" });
    expect(ready({})).toEqual({ state: "ok", text: "Hugging Face ready (key OK)" });
  });
});
