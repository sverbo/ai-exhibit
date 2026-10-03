/**
 * Records the cloud models (Hugging Face router) on the preset prompts, so the
 * "simulation" model source shows the same models as "hf":
 *
 *   content/assets/recordings/cloud.json
 *
 *   pnpm tsx scripts/prepare/record-cloud.ts
 *
 * Base: meta-llama/Llama-3.1-8B (featherless-ai completions, raw continuation).
 * Assistant: meta-llama/Llama-3.1-8B-Instruct (chat completions, top-5 logprobs),
 * sent exactly what ChatPlayground sends (example system prompt + question).
 * Greedy (temperature 0). Reads HF_TOKEN from the environment or the repo-root
 * .env; never prints it.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { L10n } from "@ai-exhibit/presentation-core";
import {
  BASE_MODEL,
  BASE_URL,
  CHAT_MODELS,
  CHAT_URL,
  NEXT_MODEL,
  NEXT_MODEL_LABEL,
  NEXT_TOP,
  NEXT_URL,
  toNextCandidates,
  toTokenProbs,
} from "../../packages/cloud-api/src/core.ts";
import { readToken } from "../../packages/cloud-api/src/node.ts";
import { type ChatTemplateFile, renderChatTemplate } from "../../packages/ml-runtime/src/lm/chatTemplate.ts";
import type { CloudRecordingFile } from "../../packages/ml-runtime/src/lm/recording.ts";
import {
  assistantMessages,
  CHAT_PRESETS,
  DEFAULT_BASE_PROMPT,
  GUARDRAIL_PROMPT,
} from "../../packages/scene-components/src/language/data.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outFile = resolve(repoRoot, "content/assets/recordings/cloud.json");
const LOCALES = ["en", "fr"] as const;
const BASE_TOKENS = 60;
const CHAT_TOKENS = 120;
/** Probabilities kept for the first answer tokens only (small file). */
const KEEP_PROB_TOKENS = 3;
/** One-token steps recorded per base prompt for the bars (greedy). */
const NEXT_STEPS = 16;

async function post(token: string, url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${url} answered ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return (await res.json()) as Record<string, unknown>;
}

async function scenePrompts(): Promise<{ base: L10n[]; chat: L10n[] }> {
  const base: L10n[] = [];
  const chat: L10n[] = [];
  try {
    const { canonical } = await import("@ai-exhibit/canonical");
    for (const scene of canonical.scenes) {
      if (scene.visual.layout !== "component") continue;
      const p = (scene.visual.props as { prompt?: L10n } | undefined)?.prompt;
      if (!p?.en || !p.fr) continue;
      if (scene.visual.component === "BaseModelPlayground") base.push(p);
      if (scene.visual.component === "ChatPlayground") chat.push(p);
    }
  } catch (err) {
    console.warn(`Canonical scenes not loaded (${String(err).slice(0, 100)}); defaults only.`);
  }
  return { base, chat };
}

const unique = (items: L10n[]) => items.filter((p, i, all) => all.findIndex((q) => q.en === p.en && q.fr === p.fr) === i);

async function main() {
  const token = readToken(repoRoot);
  if (!token) throw new Error("HF_TOKEN is not set (environment or repo-root .env)");
  const template = (await import("../../content/assets/recordings/llama-3.1-8b-instruct.chat-template.json", {
    with: { type: "json" },
  })).default as ChatTemplateFile;
  const fromScenes = await scenePrompts();
  const basePrompts = unique([...fromScenes.base, DEFAULT_BASE_PROMPT]);
  const chatPrompts = unique([...fromScenes.chat, ...CHAT_PRESETS, GUARDRAIL_PROMPT]);
  const usage = { prompt: 0, completion: 0 };
  const file: CloudRecordingFile = {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    generator: "scripts/prepare/record-cloud.ts",
    base: { model: BASE_MODEL, provider: "featherless-ai" },
    chat: { model: "meta-llama/Llama-3.1-8B-Instruct", provider: "" },
    next: { model: NEXT_MODEL_LABEL, provider: "together" },
    completions: [],
    nextRuns: [],
  };
  const addUsage = (u: unknown) => {
    const x = u as { prompt_tokens?: number; completion_tokens?: number } | undefined;
    usage.prompt += x?.prompt_tokens ?? 0;
    usage.completion += x?.completion_tokens ?? 0;
  };

  for (const p of basePrompts) {
    for (const locale of LOCALES) {
      const json = await post(token, BASE_URL, { model: BASE_MODEL, prompt: p[locale], max_tokens: BASE_TOKENS, temperature: 0 });
      addUsage(json.usage);
      const choice = (json.choices as { text: string; finish_reason?: string }[])[0]!;
      file.completions.push({ kind: "base", locale, prompt: p[locale], text: choice.text, finishReason: choice.finish_reason ?? null });
      console.log(`  base [${locale}] ${JSON.stringify(p[locale])} -> ${JSON.stringify(choice.text.slice(0, 80))}`);
    }
  }

  // Bars for the base model scene: no provider gives a base model's probabilities,
  // so they come from Llama 3.3 70B Instruct reading the raw text (see NEXT_URL).
  for (const p of basePrompts) {
    for (const locale of LOCALES) {
      let text = p[locale];
      const steps: NonNullable<CloudRecordingFile["nextRuns"]>[number]["steps"] = [];
      for (let i = 0; i < NEXT_STEPS; i++) {
        const json = await post(token, NEXT_URL, { model: NEXT_MODEL, prompt: text, max_tokens: 1, temperature: 0, logprobs: NEXT_TOP });
        addUsage(json.usage);
        const parsed = toNextCandidates((json.choices as { logprobs?: unknown }[])[0]?.logprobs);
        if (!parsed) throw new Error("No probabilities in the answer");
        steps.push({ token: parsed.token, candidates: parsed.candidates.map((c) => ({ text: c.text, p: Number(c.p.toPrecision(3)) })) });
        text += parsed.token;
      }
      file.nextRuns!.push({ locale, prompt: p[locale], steps });
      console.log(`  next [${locale}] ${JSON.stringify(p[locale])} -> ${JSON.stringify(steps.map((s) => s.token).join(""))}`);
    }
  }

  let templateChecked = 0;
  for (const p of chatPrompts) {
    for (const locale of LOCALES) {
      const messages = assistantMessages(locale, p[locale]);
      let json: Record<string, unknown> | null = null;
      let provider = "";
      for (const model of CHAT_MODELS) {
        try {
          json = await post(token, CHAT_URL, { model, messages, max_tokens: CHAT_TOKENS, temperature: 0, logprobs: true, top_logprobs: 5 });
          provider = model.split(":")[1] ?? "";
          break;
        } catch (err) {
          console.warn(`  ${model}: ${String(err).slice(0, 120)}`);
        }
      }
      if (!json) throw new Error("No chat provider answered");
      addUsage(json.usage);
      file.chat.provider ||= provider;
      const choice = (json.choices as { message: { content: string }; finish_reason?: string; logprobs?: unknown }[])[0]!;
      const raw = renderChatTemplate(template, messages);
      // The router renders the template server-side; its prompt token count checks ours.
      const promptTokens = (json.usage as { prompt_tokens?: number } | undefined)?.prompt_tokens;
      if (typeof promptTokens === "number") templateChecked++;
      file.completions.push({
        kind: "chat",
        locale,
        prompt: p[locale],
        system: messages[0]!.content,
        raw,
        endTag: template.eos_token,
        text: choice.message.content,
        finishReason: choice.finish_reason ?? null,
        firstTokens: toTokenProbs(choice.logprobs)
          ?.slice(0, KEEP_PROB_TOKENS)
          .map((t) => ({
            token: t.token,
            p: Number(t.p.toPrecision(3)),
            top: t.top.map((x) => ({ token: x.token, p: Number(x.p.toPrecision(3)) })),
          })),
        promptTokens: typeof promptTokens === "number" ? promptTokens : undefined,
      });
      console.log(`  chat [${locale}] ${JSON.stringify(p[locale])} (${provider}) -> ${JSON.stringify(choice.message.content.slice(0, 80))}`);
    }
  }

  const json = `${JSON.stringify(file).replace(/[\u2013\u2014]/g, (c) => `\\u${c.charCodeAt(0).toString(16)}`)}\n`;
  writeFileSync(outFile, json);
  console.log(`Wrote content/assets/recordings/cloud.json (${(json.length / 1024).toFixed(1)} KB)`);
  console.log(`Tokens: ${usage.prompt} prompt + ${usage.completion} completion (provider prompt counts kept for ${templateChecked} chats)`);
}

main().catch((err) => {
  console.error(String(err).replace(/hf_[A-Za-z0-9]+/g, "hf_***"));
  process.exit(1);
});
