// Node helpers: the token from the environment or a .env file, and a bridge
// between node:http and the Web-standard handler in core.ts.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";

/** HF_TOKEN from the process environment, else from `<dir>/.env`. */
export function readToken(dir: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const fromEnv = env.HF_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    const text = readFileSync(join(dir, ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*(?:export\s+)?HF_TOKEN\s*=\s*(.*)\s*$/.exec(line);
      if (m) {
        const value = m[1]!.trim().replace(/^(['"])(.*)\1$/, "$2");
        return value || null;
      }
    }
  } catch {
    /* no .env */
  }
  return null;
}

/** A Web Request for a node:http request; the body is read up to `maxBytes` (+1, so the core can refuse it). */
export async function toWebRequest(req: IncomingMessage, url: URL, maxBytes: number): Promise<Request> {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  }
  const method = req.method ?? "GET";
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      const b = chunk as Buffer;
      size += b.length;
      if (size > maxBytes) {
        chunks.push(b.subarray(0, Math.max(0, maxBytes + 1 - (size - b.length))));
        break;
      }
      chunks.push(b);
    }
    body = Buffer.concat(chunks).toString("utf8");
  }
  headers.delete("content-length");
  return new Request(url, { method, headers, body });
}

export async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  const headers: Record<string, string> = {};
  response.headers.forEach((v, k) => {
    headers[k] = v;
  });
  res.writeHead(response.status, headers);
  // A streamed answer (the ladder's NDJSON) goes out line by line as it arrives.
  if (response.body && (headers["content-type"] ?? "").startsWith("application/x-ndjson")) {
    const reader = response.body.getReader();
    // The browser left: cancel the stream, which stops the upstream calls.
    const onClose = () => void reader.cancel().catch(() => {});
    res.on("close", onClose);
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      res.off("close", onClose);
      res.end();
    }
    return;
  }
  res.end(await response.text());
}

/**
 * `fetch` that keeps files pinned to a commit (`/resolve/<40 hex>/`) on disk,
 * so the local runtime downloads each tokenizer once, not at every start.
 * Anything else goes straight to the network.
 */
export function diskCachedFetch(dir: string, doFetch: typeof fetch = fetch): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!/\/resolve\/[0-9a-f]{40}\//.test(url)) return doFetch(input, init);
    const file = join(dir, createHash("sha256").update(url).digest("hex"));
    try {
      return new Response(readFileSync(file));
    } catch {
      /* not cached yet */
    }
    const res = await doFetch(input, init);
    if (!res.ok) return res;
    const bytes = Buffer.from(await res.arrayBuffer());
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(`${file}.part`, bytes);
      renameSync(`${file}.part`, file);
    } catch {
      /* read-only disk: serve without caching */
    }
    return new Response(bytes, { status: res.status, headers: res.headers });
  }) as typeof fetch;
}
