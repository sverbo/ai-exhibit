import { describe, expect, it } from "vitest";
import { frenchSpacing, l } from "./ui.tsx";

describe("frenchSpacing", () => {
  it("binds French punctuation to the previous word", () => {
    expect(frenchSpacing("Où est la règle ?")).toBe("Où est la règle ?");
    expect(frenchSpacing("« mûr » : 10 %")).toBe("« mûr » : 10 %");
  });

  it("leaves English and code alone", () => {
    expect(l("a ?", "Where is it?").en).toBe("Where is it?");
    expect(frenchSpacing('{ "tool": "x" }')).toBe('{ "tool": "x" }');
  });
});
