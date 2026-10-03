import { describe, expect, it } from "vitest";
import { parseNotes, plainInline } from "./notes.ts";

describe("parseNotes", () => {
  it("splits a bullet list into points", () => {
    const n = parseNotes("- One idea\n- Another *idea*\n");
    expect(n.prose).toBe("");
    expect(n.bullets).toEqual([
      { kind: "point", cue: null, text: "One idea", sub: [] },
      { kind: "point", cue: null, text: "Another *idea*", sub: [] },
    ]);
  });

  it("recognizes Ask and Do cues in their usual spellings", () => {
    const n = parseNotes("- **Ask:** who uses it?\n- **Do**: open the map\n- Ask: plain cue\n- **Demander :** qui ?\n- **Note:** stays a point");
    expect(n.bullets.map((b) => [b.kind, b.cue, b.text])).toEqual([
      ["ask", "Ask", "who uses it?"],
      ["do", "Do", "open the map"],
      ["ask", "Ask", "plain cue"],
      ["ask", "Demander", "qui ?"],
      ["point", null, "**Note:** stays a point"],
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

describe("plainInline", () => {
  it("strips inline markdown", () => {
    expect(plainInline("**bold**, *it*, `code` and [a link](https://x)")).toBe("bold, it, code and a link");
  });
});
