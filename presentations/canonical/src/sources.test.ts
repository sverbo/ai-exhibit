import { describe, expect, it } from "vitest";
import { supplyChainSources } from "../../../content/sources/supply-chain.ts";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DASHES = /[\u2013\u2014]/;

/** Walks any value and yields [path, string] for every string inside. */
function* strings(value: unknown, path = ""): Generator<[string, string]> {
  if (typeof value === "string") yield [path, value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* strings(v, `${path}[${i}]`);
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) yield* strings(v, `${path}.${k}`);
}

describe("supply-chain source records", () => {
  it("use the sc- prefix, unique IDs and honest verification fields", () => {
    const seen = new Set<string>();
    for (const s of supplyChainSources) {
      expect(s.id.startsWith("sc-"), s.id).toBe(true);
      expect(seen.has(s.id), s.id).toBe(false);
      seen.add(s.id);
      if (s.verification === "verified") {
        expect(s.retrieved, s.id).toMatch(ISO_DAY);
        expect(s.url, s.id).toMatch(/^https:\/\//);
      } else {
        expect(s.notes ?? "", `${s.id} needs a TODO note`).toMatch(/TODO/);
      }
      for (const [path, str] of strings(s)) expect(DASHES.test(str), `${s.id}${path}`).toBe(false);
    }
  });
});
