/**
 * Records content/assets/recordings/tokenizations.json: the tokenizer scene's
 * examples cut by the same tokenizers /api/tokenize uses (Llama 3.1, the cloud
 * model's, and GPT-2's), so Simulation shows exactly what the live scene would.
 *
 *   pnpm exec tsx scripts/prepare/record-tokenizations.ts            every text, from scratch
 *   pnpm exec tsx scripts/prepare/record-tokenizations.ts --missing  keep the file, add texts not recorded yet
 *
 * Needs the internet (pinned tokenizer files from the Hugging Face Hub), no token.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { LOCALES, pick, type L10n } from "@ai-exhibit/presentation-core";
import { CLOUD_TOKENIZERS, type CloudTokenizerId, loadCloudTokenizer, tokenizeWith } from "../../packages/cloud-api/src/tokenize.ts";
import { diskCachedFetch } from "../../packages/cloud-api/src/node.ts";
import type { TokenizationRecordingFile } from "../../packages/ml-runtime/src/lm/recording.ts";
import { DEFAULT_TOKENIZER_EXAMPLES } from "../../packages/scene-components/src/language/data.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outFile = resolve(repoRoot, "content/assets/recordings/tokenizations.json");
const cacheRoot = process.env.AI_EXHIBIT_CACHE ?? join(homedir(), ".cache", "ai-exhibit");
const { values: args } = parseArgs({ options: { missing: { type: "boolean", default: false } } });

async function sceneExamples(): Promise<L10n[]> {
  const { canonical } = await import("@ai-exhibit/canonical");
  return canonical.scenes.flatMap((s) =>
    s.visual.layout === "component" && s.visual.component === "TokenizerPlayground"
      ? (((s.visual.props as { examples?: L10n[] } | undefined)?.examples ?? []) as L10n[])
      : [],
  );
}

async function main() {
  const examples = [...DEFAULT_TOKENIZER_EXAMPLES, ...(await sceneExamples())];
  const hubFetch = diskCachedFetch(join(cacheRoot, "hub"));
  const ids = Object.keys(CLOUD_TOKENIZERS) as CloudTokenizerId[];
  const file: TokenizationRecordingFile = {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    generator: "scripts/prepare/record-tokenizations.ts",
    tokenizers: ids.map((id) => ({ artifactId: id, repo: CLOUD_TOKENIZERS[id].repo, revision: CLOUD_TOKENIZERS[id].revision })),
    items: [],
  };
  if (args.missing && existsSync(outFile)) {
    const old = JSON.parse(readFileSync(outFile, "utf8")) as TokenizationRecordingFile;
    const same =
      old.tokenizers.length === file.tokenizers.length &&
      old.tokenizers.every((t, i) => t.revision === file.tokenizers[i]?.revision && t.artifactId === file.tokenizers[i]?.artifactId);
    if (!same) throw new Error("tokenizers changed: record from scratch (no --missing)");
    file.items = old.items;
  }
  for (const id of ids) {
    const tokenizer = await loadCloudTokenizer(id, hubFetch);
    for (const ex of examples) {
      for (const locale of LOCALES) {
        const text = pick(ex, locale);
        if (file.items.some((i) => i.tokenizerId === id && i.text === text)) continue;
        file.items.push({ tokenizerId: id, locale, text, tokens: tokenizeWith(tokenizer, text) });
      }
    }
    console.log(`  ${CLOUD_TOKENIZERS[id].label}: ${file.items.filter((i) => i.tokenizerId === id).length} texts`);
  }
  writeFileSync(outFile, `${JSON.stringify(file)}\n`);
  console.log(`Wrote content/assets/recordings/tokenizations.json (${file.items.length} items)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
