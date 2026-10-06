// Entry for the Vercel functions in api/: one cloud API per function
// instance, configured from the project's environment variables.
//
//   HF_TOKEN                 fine-grained token with the Inference Providers permission
//   AI_EXHIBIT_ACCESS_CODE   optional; when set, model calls must carry it
//
// The rate limit lives in the instance's memory: best effort, since Vercel may
// run several instances and recycles them.
import { type CloudApi, createCloudApi, PUBLIC_LIMITS } from "./core.js";
import { loadCloudTokenizer } from "./tokenize.js";

let api: CloudApi | null = null;

function env(name: string): string | null {
  return process.env[name]?.trim() || null;
}

/** Client address as Vercel's edge reports it (it overwrites these headers). */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function cloudApiForVercel(): CloudApi {
  api ??= createCloudApi({
    token: () => env("HF_TOKEN"),
    accessCode: () => env("AI_EXHIBIT_ACCESS_CODE"),
    limits: PUBLIC_LIMITS,
    rateLimit: "per-client",
  });
  return api;
}

/** Starts loading the cloud model's tokenizer when an instance starts (api/tokenize.ts). */
export function warmTokenizer(): void {
  loadCloudTokenizer("llama-3.1").catch(() => {});
}

/** Handler for one api/ file: answers 404 for anything that is not a cloud endpoint. */
export async function handleVercel(request: Request): Promise<Response> {
  const response = await cloudApiForVercel().handle(request, { ip: clientIp(request) });
  return response ?? new Response(JSON.stringify({ error: "not-found" }), { status: 404, headers: { "content-type": "application/json" } });
}
