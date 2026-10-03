// Starts an isolated runtime + Vite pair for one rehearsal job.
import { spawn, type ChildProcess } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import { join } from "node:path";

export interface Stack {
  baseUrl: string;
  /** Last lines of runtime output, for diagnostics. */
  logs: () => string;
  close: () => Promise<void>;
}

export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createNetServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

async function waitForHttp(url: string, timeoutMs: number, child?: ChildProcess): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = "";
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) throw new Error(`process exited with code ${child.exitCode}`);
    try {
      const res = await fetch(url);
      if (res.ok) return;
      last = `HTTP ${res.status}`;
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`${url} did not answer within ${timeoutMs} ms (${last})`);
}

/**
 * A runtime in dev mode (the /api endpoints) and a Vite dev server proxying to
 * it, both on free loopback ports. Sessions live in each browser context
 * (BroadcastChannel), so a rehearsal never touches the presenter's windows.
 */
export async function startStack(repoRoot: string): Promise<Stack> {
  const runtimePort = await freePort();
  const tsx = join(repoRoot, "node_modules", ".bin", "tsx");
  const child = spawn(tsx, ["apps/local-runtime/src/main.ts", "--dev"], {
    cwd: repoRoot,
    env: { ...process.env, RUNTIME_PORT: String(runtimePort) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output: string[] = [];
  const keep = (chunk: Buffer) => {
    output.push(...chunk.toString().split("\n").filter(Boolean));
    if (output.length > 200) output.splice(0, output.length - 200);
  };
  child.stdout?.on("data", keep);
  child.stderr?.on("data", keep);

  const stopRuntime = async () => {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          child.kill("SIGKILL");
          resolve();
        }, 3000);
        child.once("exit", () => {
          clearTimeout(t);
          resolve();
        });
      });
    }
  };

  try {
    await waitForHttp(`http://127.0.0.1:${runtimePort}/api/network`, 30_000, child);
  } catch (err) {
    await stopRuntime();
    throw new Error(`runtime did not start: ${(err as Error).message}\n${output.join("\n")}`);
  }

  const vitePort = await freePort();
  const { createServer } = await import("vite");
  // vite.config.ts builds its proxy from RUNTIME_PORT when the config is loaded.
  process.env.RUNTIME_PORT = String(runtimePort);
  const vite = await createServer({
    configFile: join(repoRoot, "apps/presenter-web/vite.config.ts"),
    root: join(repoRoot, "apps/presenter-web"),
    logLevel: "error",
    clearScreen: false,
    server: {
      host: "127.0.0.1",
      port: vitePort,
      strictPort: true,
      // The rehearsal reports browser errors itself.
      forwardConsole: false,
      // Other people may be editing the tree: never reload pages mid-walk.
      watch: { ignored: ["**/*"] },
    },
  });
  try {
    await vite.listen();
  } catch (err) {
    await stopRuntime();
    throw err;
  }

  const baseUrl = `http://127.0.0.1:${vitePort}`;
  const network = (await (await fetch(`${baseUrl}/api/network`)).json()) as { port?: number };
  if (network.port !== runtimePort) {
    await vite.close();
    await stopRuntime();
    throw new Error(`Vite proxies to runtime port ${network.port}, expected ${runtimePort}`);
  }
  // Transform the entry once so dependency optimization is done before any page loads.
  await fetch(`${baseUrl}/src/main.tsx`).catch(() => {});
  await vite.waitForRequestsIdle?.();

  return {
    baseUrl,
    logs: () => output.slice(-30).join("\n"),
    close: async () => {
      await vite.close();
      await stopRuntime();
    },
  };
}
