/**
 * Records what Hugging Face Inference answers for a few vocabulary words, so
 * packages/cloud-api tests can check /api/embed against the stored vectors
 * in content/assets/embeddings/canonical.json without a network.
 *
 *   pnpm exec tsx scripts/prepare/record-embed-fixture.ts
 *
 * Needs HF_TOKEN (environment or repo-root .env). The token is never printed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EMBED_MODEL, EMBED_URL } from "../../packages/cloud-api/src/embed.ts";
import { readToken } from "../../packages/cloud-api/src/node.ts";
import { applyTemplate, type CanonicalEmbeddingsJson } from "../../packages/ml-runtime/src/embeddings/canonical.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outFile = resolve(repoRoot, "packages/cloud-api/src/fixtures/embed-hf.json");
const WORDS = ["roi", "Paris", "Il pleut des cordes"];

async function main() {
  const token = readToken(repoRoot);
  if (!token) throw new Error("HF_TOKEN is not set (environment or repo-root .env)");
  const canonical = JSON.parse(
    readFileSync(resolve(repoRoot, "content/assets/embeddings/canonical.json"), "utf8"),
  ) as CanonicalEmbeddingsJson;
  const texts = WORDS.map((w) => applyTemplate(canonical.model.template, w));
  const res = await fetch(EMBED_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ inputs: texts }),
  });
  if (!res.ok) throw new Error(`Hugging Face answered ${res.status}`);
  const answer = (await res.json()) as unknown;
  const fixture = { model: EMBED_MODEL, recordedAt: new Date().toISOString().slice(0, 10), words: WORDS, texts, answer };
  writeFileSync(outFile, `${JSON.stringify(fixture)}\n`);
  console.log(`Wrote ${outFile}`);
}

main().catch((err) => {
  console.error(String(err?.message ?? err).replace(/hf_[A-Za-z0-9]+/g, "hf_[redacted]"));
  process.exit(1);
});
