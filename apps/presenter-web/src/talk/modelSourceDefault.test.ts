import { afterEach, describe, expect, it, vi } from "vitest";
import { detectDefaultModelSource } from "./modelSourceDefault.ts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function server(status: (() => Response) | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/llm/status" && status) return status();
      return new Response("<html>", { headers: { "content-type": "text/html" } });
    }),
  );
}

describe("default model source", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is Hugging Face when the server has a token, on any host", async () => {
    server(() => json(200, { configured: true, reachable: true, codeRequired: false }));
    expect(await detectDefaultModelSource()).toBe("hf");
  });

  it("is Simulation without a token, behind a code this browser lacks, or without a server", async () => {
    server(() => json(200, { configured: false, reachable: null, codeRequired: false }));
    expect(await detectDefaultModelSource()).toBe("simulation");
    server(() => json(200, { configured: true, reachable: true, codeRequired: true }));
    expect(await detectDefaultModelSource()).toBe("simulation");
    server(null);
    expect(await detectDefaultModelSource()).toBe("simulation");
  });
});
