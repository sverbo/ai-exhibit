import { useEffect, useState } from "react";
import { cloudStatus, type CloudStatus } from "@ai-exhibit/ml-runtime/lm";

/** Fetch with a timeout; resolves null on any failure. */
export async function fetchJson<T>(url: string, timeoutMs = 2000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface NetworkInfo {
  addresses: string[];
  port: number;
  dev: boolean;
}

export interface RuntimeProbe {
  /** null until the first probe answers or fails. */
  reachable: boolean | null;
  network: NetworkInfo | null;
}

/** Polls `GET /api/network`: tells whether the local runtime answers, and the LAN addresses. */
export function useRuntime(intervalMs = 5000): RuntimeProbe {
  const [probe, setProbe] = useState<RuntimeProbe>({ reachable: null, network: null });
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const network = await fetchJson<NetworkInfo>("/api/network", 1500);
      if (!alive) return;
      setProbe((prev) =>
        network
          ? { reachable: true, network }
          : { reachable: false, network: prev.network },
      );
    };
    void run();
    const id = setInterval(run, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);
  return probe;
}

/**
 * Base URL other devices on the LAN use to reach this app: first LAN address
 * with the port this page is served on (Vite in dev, the runtime in production).
 */
export function lanOrigin(network: NetworkInfo | null): string | null {
  const port = window.location.port;
  const host = network?.addresses[0];
  if (host) return `${window.location.protocol}//${host}${port ? `:${port}` : ""}`;
  const local = window.location.hostname;
  if (local === "localhost" || local === "127.0.0.1" || local === "::1") return null;
  return window.location.origin;
}

/** Address of the audience glossary that phones can reach (the LAN address under `pnpm dev`). */
export function glossaryUrlFor(network: NetworkInfo | null): string | null {
  const origin = lanOrigin(network);
  return origin ? `${origin}/glossary` : null;
}


/**
 * The server's Hugging Face status (`GET /api/llm/status`), asked now and then;
 * null until it answers. A failed check is retried after a few seconds rather
 * than a full interval: a dev runtime restarting on a file change, or a cold
 * serverless function, should not leave "Simulation only" on screen for a minute.
 */
export function useCloudHealth(intervalMs = 60_000, retryMs = 3_000): CloudStatus | null | "unreachable" {
  const [status, setStatus] = useState<CloudStatus | null | "unreachable">(null);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const run = async () => {
      const s = await cloudStatus({ accessCode: null }).catch(() => "unreachable" as const);
      if (!alive) return;
      setStatus(s);
      timer = setTimeout(run, s === "unreachable" ? retryMs : intervalMs);
    };
    void run();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [intervalMs, retryMs]);
  return status;
}

/** Below this estimated credit (US dollars), "ready" comes with a warning and the amount left. */
export const LOW_CREDIT_USD = 10;

/** One line for the presenter: can the live demos use Hugging Face here? */
export function cloudHealthText(s: CloudStatus | null | "unreachable"): { state: "ok" | "warn" | "bad" | "none"; text: string } {
  if (s === null) return { state: "none", text: "Hugging Face: checking…" };
  if (s === "unreachable") return { state: "bad", text: "Hugging Face: no server answers /api (Simulation only)" };
  if (!s.configured) return { state: "warn", text: "Hugging Face: no token on the server (Simulation only)" };
  if (s.reachable === false) return { state: "bad", text: "Hugging Face: unreachable (Simulation only)" };
  if (s.key?.valid === false) return { state: "bad", text: "Hugging Face: the key is refused (Simulation only)" };
  if (s.key?.inference === false) return { state: "bad", text: "Hugging Face: the key may not call models (Simulation only)" };
  if (s.key?.creditsExhausted) return { state: "bad", text: "Hugging Face: credits used up, payment refused (Simulation only)" };
  const details = [s.key?.valid ? "key OK" : null, s.codeRequired ? "access code required" : null].filter(Boolean);
  // The credit left is known only when the key may read billing and the server knows the credit bought (HF_CREDIT_USD).
  const left = s.key?.creditLeftUsd;
  if (typeof left === "number" && left < LOW_CREDIT_USD) {
    return { state: "warn", text: `Hugging Face ready, but careful: about $${Math.max(0, left).toFixed(2)} of credit left` };
  }
  return { state: "ok", text: details.length ? `Hugging Face ready (${details.join(", ")})` : "Hugging Face ready" };
}
