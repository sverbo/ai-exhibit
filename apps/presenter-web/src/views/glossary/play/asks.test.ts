import { describe, expect, it } from "vitest";
import { ASKS_KEY, ASKS_PER_HOUR, createAskQuota } from "./asks.ts";

const HOUR = 3_600_000;

function memoryStorage() {
  const store = new Map<string, string>();
  return { store, getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
}

describe("asks counted on the phone", () => {
  it("allows 10 asks per demo in a rolling hour, each demo on its own", () => {
    let t = 1_000_000;
    const storage = memoryStorage();
    const quota = createAskQuota(storage, () => t);
    expect(ASKS_PER_HOUR).toBe(10);
    for (let i = 0; i < ASKS_PER_HOUR; i++) {
      expect(quota.left("base")).toBe(ASKS_PER_HOUR - i);
      quota.spend("base");
      t += 60_000;
    }
    expect(quota.left("base")).toBe(0);
    expect(quota.left("ladder")).toBe(ASKS_PER_HOUR);
    // The first ask frees up an hour after it was made, the others one by one.
    expect(quota.nextFree()).toBe(1_000_000 + HOUR);
    t = 1_000_000 + HOUR + 1;
    expect(quota.left("base")).toBe(1);
    expect(quota.nextFree()).toBeNull();
  });

  it("keeps only the times of the last hour, per demo, and writes the pruned log back on every read", () => {
    let t = 0;
    const storage = memoryStorage();
    storage.setItem(ASKS_KEY, JSON.stringify({ words: [-2 * HOUR, -10], ladder: [-HOUR - 5], junk: "x" }));
    const quota = createAskQuota(storage, () => t);
    expect(quota.left("words")).toBe(ASKS_PER_HOUR - 1);
    expect(JSON.parse(storage.store.get(ASKS_KEY)!)).toEqual({ words: [-10] });
    t = 5;
    quota.spend("ladder");
    expect(JSON.parse(storage.store.get(ASKS_KEY)!)).toEqual({ words: [-10], ladder: [5] });
  });

  it("is shared by the pages of one browser (the stored log is read again each time)", () => {
    const storage = memoryStorage();
    const a = createAskQuota(storage, () => 100);
    const b = createAskQuota(storage, () => 100);
    a.spend("assistant");
    expect(b.left("assistant")).toBe(ASKS_PER_HOUR - 1);
  });

  it("survives broken or missing storage, counting in memory for the page", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    for (const storage of [broken, null]) {
      const quota = createAskQuota(storage, () => 0);
      quota.spend("words");
      quota.spend("words");
      expect(quota.left("words")).toBe(ASKS_PER_HOUR - 2);
    }
    // Readable but full: the count still moves on, in memory.
    const full = { getItem: () => null, setItem: () => {
      throw new Error("quota");
    } };
    const quota = createAskQuota(full, () => 0);
    quota.spend("base");
    expect(quota.left("base")).toBe(ASKS_PER_HOUR - 1);
    // Garbage in storage is ignored.
    const garbage = memoryStorage();
    garbage.setItem(ASKS_KEY, "{not json");
    expect(createAskQuota(garbage, () => 0).left("base")).toBe(ASKS_PER_HOUR);
  });
});
