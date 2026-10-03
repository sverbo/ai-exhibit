import type { IncomingMessage, ServerResponse } from "node:http";

export interface RuntimeContext {
  /** Repository root (absolute). */
  repoRoot: string;
  /** Cache root, $AI_EXHIBIT_CACHE or ~/.cache/ai-exhibit. */
  cacheRoot: string;
  port: number;
  /** True under `pnpm dev`: Vite serves the app, the runtime serves only APIs. */
  dev: boolean;
}

/**
 * A route module. Returns true when it handled the request, false to let the
 * next module try. Modules: /api/network (main.ts), cloud-llm.ts, static.ts.
 */
export type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
) => boolean | Promise<boolean>;

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/**
 * True when the request comes from this machine. A loopback socket is not
 * enough on its own: in dev, Vite's proxy connects from loopback on behalf of
 * LAN clients, so any X-Forwarded-For hop must be loopback too.
 */
export function isLoopback(req: IncomingMessage): boolean {
  if (!LOOPBACK.has(req.socket.remoteAddress ?? "")) return false;
  const forwarded = req.headers["x-forwarded-for"];
  const hops = (Array.isArray(forwarded) ? forwarded.join(",") : (forwarded ?? ""))
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return hops.every((h) => LOOPBACK.has(h));
}
