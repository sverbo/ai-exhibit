// Cloud models for the "hf" model source (and the tokenizer), served by the local runtime. The
// endpoints themselves live in @ai-exhibit/cloud-api (shared with the Vercel
// functions in api/); this adapter adds what is specific to the presenter's
// machine: the token from the environment or the repo-root .env, one budget
// for the whole machine, and loopback clients only, except audience requests
// from phones on the LAN (docs/specs/2026-10-04-audience-play.md).
import type { IncomingMessage } from "node:http";
import {
  AUDIENCE_HEADER,
  AUDIENCE_PATHS,
  type CloudApiOptions,
  createCloudApi,
  isCloudPath,
  jsonResponse,
  LOCAL_LIMITS,
  parseCreditSetting,
} from "@ai-exhibit/cloud-api";
import { loadCloudTokenizer } from "@ai-exhibit/cloud-api";
import { diskCachedFetch, readSetting, readToken, sendWebResponse, toWebRequest } from "@ai-exhibit/cloud-api/node";
import { join } from "node:path";
import { type Handler, isLoopback, type RuntimeContext } from "./http.ts";

export {
  BASE_MODEL,
  BASE_URL,
  CHAT_MODELS,
  CHAT_URL,
  LOCAL_LIMITS as LIMITS,
  parseChatBody,
  parseCompleteBody,
  toTokenProbs,
} from "@ai-exhibit/cloud-api";
export { readToken };

/**
 * The socket must be loopback AND the Host the browser used must be a loopback
 * name: in dev, Vite proxies every client (phones on the LAN included) from
 * 127.0.0.1, but keeps the Host header they typed (their LAN address).
 */
export function isLocalClient(req: IncomingMessage): boolean {
  if (!isLoopback(req)) return false;
  // The dev proxy (xfwd) names the real client: it must be this machine too.
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const list = (Array.isArray(forwarded) ? forwarded.join(",") : forwarded).split(",").map((a) => a.trim());
    if (!list.every((a) => a === "127.0.0.1" || a === "::1" || a === "::ffff:127.0.0.1")) return false;
  }
  const host = (req.headers.host ?? "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost");
}

export function createCloudLlmModule(
  ctx: RuntimeContext,
  deps?: Partial<Pick<CloudApiOptions, "fetch" | "token" | "now">>,
): Handler {
  const cachedToken = deps?.token ? null : readToken(ctx.repoRoot);
  // Tokenizer files are pinned: keep them on disk across restarts.
  const hubFetch = deps?.fetch ?? diskCachedFetch(join(ctx.cacheRoot, "hub"));
  // No access code here: only this machine is served.
  const api = createCloudApi({
    token: deps?.token ?? (() => cachedToken),
    credit: deps?.token
      ? undefined
      : () => parseCreditSetting(readSetting("HF_CREDIT_USD", ctx.repoRoot), readSetting("HF_CREDIT_SINCE", ctx.repoRoot), Date.now()),
    limits: LOCAL_LIMITS,
    rateLimit: "global",
    fetch: deps?.fetch,
    hubFetch,
    now: deps?.now,
  });
  // Warm the cloud model's tokenizer so the tokenizer scene answers at once.
  if (!deps?.fetch) loadCloudTokenizer("llama-3.1", hubFetch).catch(() => {});

  return async (req, res, url) => {
    if (!isCloudPath(url.pathname)) return false;
    const local = isLocalClient(req);
    // Phones on the LAN (the audience's "Try it" tab) get the audience endpoints only,
    // under the audience's anti-burst cap, never in the presenter's budget.
    const audience = req.headers[AUDIENCE_HEADER] !== undefined;
    if (!local && !(audience && AUDIENCE_PATHS.has(url.pathname))) {
      await sendWebResponse(res, jsonResponse(403, { error: "forbidden", message: "Cloud models are only available on the presenter's machine" }));
      return true;
    }
    const request = await toWebRequest(req, new URL(url.pathname + url.search, "http://localhost"), LOCAL_LIMITS.bodyBytes);
    const response = await api.handle(request, { ip: local ? "local" : "lan" });
    await sendWebResponse(res, response ?? jsonResponse(404, { error: "not-found" }));
    return true;
  };
}
