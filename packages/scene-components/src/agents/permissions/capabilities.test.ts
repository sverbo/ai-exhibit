import { describe, expect, it } from "vitest";
import { CAPABILITIES, PERMISSIONS, available, grantedAtStep, toggle } from "./capabilities.ts";

describe("permissions board", () => {
  it("a bare chatbot can only answer", () => {
    expect(available([]).map((c) => c.id)).toEqual(["answer"]);
  });

  it("capabilities only grow as permissions are granted", () => {
    let prev = 0;
    for (let k = 0; k <= PERMISSIONS.length; k++) {
      const n = available(grantedAtStep(k)).length;
      expect(n).toBeGreaterThan(prev);
      prev = n;
    }
    expect(available(PERMISSIONS)).toHaveLength(CAPABILITIES.length);
  });

  it("some capabilities only appear from combinations", () => {
    expect(available(["read"]).some((c) => c.id === "leak")).toBe(false);
    expect(available(["browser"]).some((c) => c.id === "leak")).toBe(false);
    expect(available(["read", "browser"]).some((c) => c.id === "leak")).toBe(true);
  });

  it("toggle keeps the board order", () => {
    expect(toggle(["money"], "read")).toEqual(["read", "money"]);
    expect(toggle(["read", "money"], "read")).toEqual(["money"]);
  });
});
