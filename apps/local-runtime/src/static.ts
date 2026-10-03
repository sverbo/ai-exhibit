import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import type { Handler, RuntimeContext } from "./http.ts";

export type ByteRange = { start: number; end: number };

/**
 * Parses a single-range `Range` header against a file size. Returns null to
 * serve the whole file (absent, malformed or multi-range), "unsatisfiable" for 416.
 */
export function parseRange(header: string | undefined, size: number): ByteRange | null | "unsatisfiable" {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, a, b] = match;
  if (a === "" && b === "") return null;
  let start: number;
  let end: number;
  if (a === "") {
    const suffix = Number(b);
    if (suffix === 0) return "unsatisfiable";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(a);
    end = b === "" ? size - 1 : Math.min(Number(b), size - 1);
  }
  if (start >= size || start > end) return "unsatisfiable";
  return { start, end };
}

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".vtt": "text/vtt; charset=utf-8",
};

export function contentType(path: string): string {
  return TYPES[extname(path).toLowerCase()] ?? "application/octet-stream";
}

/** Serves the built web app in production, with SPA fallback to index.html. */
export function createStaticModule(ctx: RuntimeContext): Handler {
  const root = resolve(ctx.repoRoot, "apps/presenter-web/dist");
  return (req, res, url) => {
    if (req.method !== "GET" && req.method !== "HEAD") return false;
    if (ctx.dev) {
      // Under `pnpm dev` the app is served by Vite; send page requests there
      // instead of a bare 404 (API routes were handled before this module).
      if (url.pathname.startsWith("/api/")) return false;
      const host = (req.headers.host ?? "localhost").replace(/:\d+$/, "");
      const vitePort = process.env.VITE_PORT ?? "5173";
      res.writeHead(302, { location: `http://${host}:${vitePort}${url.pathname}${url.search}` });
      res.end();
      return true;
    }
    if (!existsSync(root)) {
      res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
      res.end("Web app not built. Run `pnpm build` first.");
      return true;
    }
    let file = normalize(join(root, decodeURIComponent(url.pathname)));
    if (!file.startsWith(root)) return false;
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, "index.html");
    const size = statSync(file).size;
    // Range support lets the presenter seek in local videos when the runtime
    // serves the built app (run without `--dev`).
    const range = parseRange(req.headers.range, size);
    if (range === "unsatisfiable") {
      res.writeHead(416, { "content-range": `bytes */${size}` });
      res.end();
      return true;
    }
    const headers = { "content-type": contentType(file), "accept-ranges": "bytes" };
    if (range) {
      res.writeHead(206, {
        ...headers,
        "content-length": range.end - range.start + 1,
        "content-range": `bytes ${range.start}-${range.end}/${size}`,
      });
    } else {
      res.writeHead(200, { ...headers, "content-length": size });
    }
    if (req.method === "HEAD") res.end();
    else createReadStream(file, range ?? undefined).pipe(res);
    return true;
  };
}
