import { describe, expect, it } from "vitest";
import { parseNotes, plainInline, withPersonalNote } from "./notes.ts";

describe("parseNotes", () => {
  it("splits a bullet list into points", () => {
    const n = parseNotes("- One idea\n- Another *idea*\n");
    expect(n.prose).toBe("");
    expect(n.bullets).toEqual([
      { kind: "point", text: "One idea", sub: [] },
      { kind: "point", text: "Another *idea*", sub: [] },
    ]);
  });

  it("keeps every bullet a plain point, bold cue words included", () => {
    const n = parseNotes("- **Ask:** who uses it?\n- Do: open the map");
    expect(n.bullets.map((b) => [b.kind, b.text])).toEqual([
      ["point", "**Ask:** who uses it?"],
      ["point", "Do: open the map"],
    ]);
  });

  it("keeps sub-bullets and wrapped lines with their bullet", () => {
    const n = parseNotes("- Main\n  - detail one\n  - detail two\n- Long line\n  that wraps");
    expect(n.bullets[0]!.sub).toEqual(["detail one", "detail two"]);
    expect(n.bullets[1]!.text).toBe("Long line that wraps");
  });

  it("returns paragraph notes as prose", () => {
    const n = parseNotes("A paragraph of notes.\n\nAnother one.");
    expect(n.bullets).toEqual([]);
    expect(n.prose).toBe("A paragraph of notes.\nAnother one.");
  });
});

describe("withPersonalNote", () => {
  it("puts the personal note first, as plain text, before every content bullet", () => {
    const n = withPersonalNote(parseNotes("- **Ask:** who?\n- One idea"), "  My *own* <b>story</b>\nsecond line ");
    expect(n.bullets.map((b) => b.kind)).toEqual(["personal", "point", "point"]);
    expect(n.bullets[0]).toEqual({ kind: "personal", text: "My *own* <b>story</b>\nsecond line", sub: [] });
  });

  it("adds nothing for a missing or blank note, and keeps prose", () => {
    const parsed = parseNotes("Prose only.");
    expect(withPersonalNote(parsed, undefined)).toBe(parsed);
    expect(withPersonalNote(parsed, "   ")).toBe(parsed);
    expect(withPersonalNote(parsed, "Mine").prose).toBe("Prose only.");
  });
});

describe("plainInline", () => {
  it("strips inline markdown", () => {
    expect(plainInline("**bold**, *it*, `code` and [a link](https://x)")).toBe("bold, it, code and a link");
  });
});
