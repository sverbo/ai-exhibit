import { describe, expect, it } from "vitest";
import { byteLevelSpans, bytesLabel, getByteDecoder, tokenStringToBytes } from "./byteLevel.ts";

/** Inverse of the decoder, to build token strings in tests. */
function enc(bytes: number[]): string {
  const inv = new Map([...getByteDecoder()].map(([ch, b]) => [b, ch]));
  return bytes.map((b) => inv.get(b)!).join("");
}
const utf8 = (s: string) => [...new TextEncoder().encode(s)];

describe("byte decoder", () => {
  it("covers all 256 bytes", () => {
    expect(new Set(getByteDecoder().values()).size).toBe(256);
  });
  it("maps the GPT-2 space marker", () => {
    expect(tokenStringToBytes("Ġje")).toEqual([0x20, 0x6a, 0x65]);
    expect(tokenStringToBytes("<|im_start|>")).toEqual(utf8("<|im_start|>"));
    expect(tokenStringToBytes("一")).toBeNull();
  });
});

describe("byteLevelSpans", () => {
  it("locates whole-character tokens", () => {
    const text = "Bonjour, je";
    const spans = byteLevelSpans(text, ["Bon", "jour", ",", "Ġje"])!;
    expect(spans.map((s) => text.slice(s.start, s.end))).toEqual(["Bon", "jour", ",", " je"]);
    expect(spans.every((s) => !s.partial)).toBe(true);
  });

  it("handles accents split across tokens", () => {
    // "É" is C3 89 in UTF-8; SmolLM2 tokenizes " Élodie" as "ĠÃī" "l" "od" "ie".
    const text = " Élodie";
    const spans = byteLevelSpans(text, ["ĠÃī", "l", "od", "ie"])!;
    expect(spans.map((s) => text.slice(s.start, s.end))).toEqual([" É", "l", "od", "ie"]);
  });

  it("marks tokens that hold part of an emoji", () => {
    const text = "a 🐱";
    const cat = utf8("🐱"); // F0 9F 90 B1
    const tokens = ["a", enc([0x20, cat[0]!, cat[1]!]), enc([cat[2]!]), enc([cat[3]!])];
    const spans = byteLevelSpans(text, tokens)!;
    expect(spans).toHaveLength(4);
    expect(spans[1]!.partial).toBe(true);
    expect(text.slice(spans[1]!.start, spans[1]!.end)).toBe(" 🐱");
    expect(spans[2]!.partial).toBe(true);
    expect(text.slice(spans[3]!.start, spans[3]!.end)).toBe("🐱");
    expect(bytesLabel(spans[3]!.bytes)).toBe("B1");
  });

  it("returns null when tokens do not spell the text", () => {
    expect(byteLevelSpans("abc", ["ab"])).toBeNull();
    expect(byteLevelSpans("abc", ["ab", "d"])).toBeNull();
  });
});
