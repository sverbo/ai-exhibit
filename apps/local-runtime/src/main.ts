import { createServer } from "node:http";
import { homedir, networkInterfaces } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCloudLlmModule } from "./cloud-llm.ts";
import { type Handler, type RuntimeContext, sendJson } from "./http.ts";
import { createStaticModule } from "./static.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const cacheRoot = process.env.AI_EXHIBIT_CACHE ?? join(homedir(), ".cache", "ai-exhibit");
const port = Number(process.env.RUNTIME_PORT ?? 4317);
const ctx: RuntimeContext = {
  repoRoot,
  cacheRoot,
  port,
  dev: process.argv.includes("--dev"),
};

export function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i!.address);
}

const server = createServer();
const network: Handler = (_req, res, url) => {
  if (url.pathname !== "/api/network") return false;
  sendJson(res, 200, { addresses: lanAddresses(), port: ctx.port, dev: ctx.dev });
  return true;
};
const handlers: Handler[] = [
  network,
  createCloudLlmModule(ctx),
  createStaticModule(ctx),
];

server.on("request", async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  try {
    for (const handle of handlers) {
      if (await handle(req, res, url)) return;
    }
    sendJson(res, 404, { error: "not found" });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: String(err) });
    else res.end();
  }
});

server.listen(ctx.port, "0.0.0.0", () => {
  const lan = lanAddresses().map((a) => `http://${a}:${ctx.port}`).join(", ");
  console.log(`ai-exhibit runtime on http://127.0.0.1:${ctx.port}${lan ? ` (LAN: ${lan})` : ""}`);
  console.log(`cache: ${ctx.cacheRoot}${ctx.dev ? " (dev mode: app served by Vite)" : ""}`);
});
