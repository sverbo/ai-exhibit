/**
 * Simulation replays recordings keyed by locale and prompt: checks that every
 * live example a slide can show has one in every locale the talk is given in,
 * and that GPT-2's English answers have a translation there. Used by
 * `pnpm verify:content`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  hasLocale,
  isL10nValue,
  LOCALES,
  own,
  pick,
  REFERENCE_LOCALE,
  type Issue,
  type L10n,
  type Locale,
  type PresentationDefinition,
} from "@ai-exhibit/presentation-core";

interface CloudFile {
  completions: { kind: "base" | "chat"; locale: string; prompt: string }[];
  nextRuns?: { locale: string; prompt: string }[];
}
interface TokenizationFile {
  tokenizers: { artifactId: string }[];
  items: { tokenizerId: string; text: string }[];
}
interface Gpt2File {
  answers: Record<string, { greedy: string; samples: string[] }>;
}
interface LadderRung {
  generation: string;
  answer: string;
  translation?: Partial<Record<Locale, string>>;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

function componentProps(p: PresentationDefinition, name: string): Record<string, unknown>[] {
  return p.scenes.flatMap((s) =>
    s.visual.layout === "component" && s.visual.component === name ? [(s.visual.props ?? {}) as Record<string, unknown>] : [],
  );
}

const asL10n = (v: unknown): L10n[] => (isL10nValue(v) && typeof v.en === "string" ? [v as L10n] : []);

/**
 * Simulation replays recordings keyed by locale and prompt: every preset the
 * talk can show must have one in every locale the talk is given in. GPT-2's
 * English answers need a translation in those locales.
 */
export async function checkRecordings(root: string, p: PresentationDefinition, issues: Issue[]): Promise<void> {
  const read = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), "utf8")) as T;
  const cloud = read<CloudFile>("content/assets/recordings/cloud.json");
  const tokenizations = read<TokenizationFile>("content/assets/recordings/tokenizations.json");
  const gpt2 = read<Gpt2File>("content/assets/then-and-now/gpt2-answers.json");
  const data = await import("../../packages/scene-components/src/language/data.ts");
  const { thenAndNowQuestions } = await import("../../content/assets/then-and-now/questions.ts");
  const { GPT2_ANSWER_TRANSLATIONS } = await import("../../content/assets/then-and-now/translations.ts");

  const chat = [...componentProps(p, "ChatPlayground").flatMap((x) => asL10n(x.prompt)), ...data.CHAT_PRESETS, data.GUARDRAIL_PROMPT];
  const base = [...componentProps(p, "BaseModelPlayground").flatMap((x) => asL10n(x.prompt)), data.DEFAULT_BASE_PROMPT];
  const tokenized = [
    ...data.DEFAULT_TOKENIZER_EXAMPLES,
    ...componentProps(p, "TokenizerPlayground").flatMap((x) => (Array.isArray(x.examples) ? x.examples.flatMap(asL10n) : [])),
  ];
  const where = "recordings";
  const miss = (locale: Locale, message: string) =>
    issues.push({ level: p.locales.includes(locale) ? "error" : "warning", where, locale, kind: "missing", message });

  for (const locale of LOCALES) {
    const has = (kind: "base" | "chat", text: string) =>
      cloud.completions.some((c) => c.kind === kind && c.locale === locale && norm(c.prompt) === norm(text));
    for (const q of chat) {
      if (!hasLocale(q, locale) && locale !== REFERENCE_LOCALE) continue; // reported as missing text already
      const text = pick(q, locale);
      if (!has("chat", text)) miss(locale, `no recorded chat answer (cloud.json) for "${text}"; run scripts/prepare/record-cloud.ts`);
    }
    for (const q of base) {
      if (!hasLocale(q, locale) && locale !== REFERENCE_LOCALE) continue;
      const text = pick(q, locale);
      if (!has("base", text)) miss(locale, `no recorded base continuation (cloud.json) for "${text}"; run scripts/prepare/record-cloud.ts`);
      if (!cloud.nextRuns?.some((r) => r.locale === locale && norm(r.prompt) === norm(text))) {
        miss(locale, `no recorded next-token bars (cloud.json) for "${text}"; run scripts/prepare/record-cloud.ts`);
      }
    }
    for (const ex of tokenized) {
      if (!hasLocale(ex, locale) && locale !== REFERENCE_LOCALE) continue;
      const text = pick(ex, locale);
      for (const t of tokenizations.tokenizers) {
        if (!tokenizations.items.some((i) => i.tokenizerId === t.artifactId && i.text === text)) {
          miss(locale, `no recorded tokenization by ${t.artifactId} for "${text}"; run scripts/prepare/record-tokenizations.ts`);
        }
      }
    }
    if (locale === REFERENCE_LOCALE) continue;
    for (const q of thenAndNowQuestions) {
      for (const r of (q.ladder?.rungs ?? []) as LadderRung[]) {
        if (!own(r.translation, locale)) miss(locale, `no translation of ${r.generation}'s published answer to "${q.id}" (questions.ts)`);
      }
      const rec = gpt2.answers[q.id];
      if (q.ladder || !rec) continue;
      for (const text of [rec.greedy, ...rec.samples]) {
        if (!own(GPT2_ANSWER_TRANSLATIONS[text.trim()] as Partial<Record<Locale, string>> | undefined, locale)) {
          miss(locale, `no translation of GPT-2's recorded answer to "${q.id}": "${text.slice(0, 50)}" (then-and-now/translations.ts)`);
        }
      }
    }
  }
}
