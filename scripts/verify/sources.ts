/**
 * Checks that every source URL in the registry still answers.
 * Usage: pnpm verify:sources [--timeout 15000]
 * Run during preparation (online), never at presentation time.
 */
import { sources } from "@ai-exhibit/content/sources";

const timeoutArg = process.argv.indexOf("--timeout");
const timeoutMs = timeoutArg > 0 ? Number(process.argv[timeoutArg + 1]) : 15000;

async function check(url: string): Promise<string> {
  for (const method of ["HEAD", "GET"] as const) {
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "user-agent": "ai-exhibit-source-check/0.1" },
      });
      if (res.ok) return "ok";
      // Many sites reject HEAD; retry with GET before reporting.
      if (method === "GET") return `HTTP ${res.status}`;
    } catch (err) {
      if (method === "GET") return (err as Error).name === "TimeoutError" ? "timeout" : "unreachable";
    }
  }
  return "unreachable";
}

const withUrl = sources.filter((s) => s.url);
let bad = 0;
const queue = [...withUrl];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const status = await check(s.url!);
      if (status !== "ok") bad += 1;
      console.log(`${status === "ok" ? "ok  " : "FAIL"} ${s.id.padEnd(40)} ${status === "ok" ? "" : status + " "}${s.url}`);
    }
  }),
);
console.log(`\n${withUrl.length - bad}/${withUrl.length} reachable, ${sources.length - withUrl.length} without URL`);
process.exit(bad > 0 ? 1 : 0);
