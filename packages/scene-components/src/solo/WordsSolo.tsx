/**
 * Words as points, solo: the embedding map of the talk on a phone, in the
 * scene's views: the 2D map (drag, pinch, tap a dot, show all words) and the
 * 3D cloud (drag to turn, pinch to zoom, tap a dot, loaded only when chosen),
 * and a search. A word already on the map uses its precomputed neighbours
 * (free); any other text is embedded live (one ask), else matched to the
 * closest prepared word. Reuses the explorer's map, cloud, search and copy.
 */
import { type FormEvent, lazy, Suspense, useMemo, useRef, useState } from "react";
import { locateQuery, queryText, type EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import { cloudEmbed, MAX_INPUT_CHARS } from "@ai-exhibit/ml-runtime/lm";
import { tr, type Locale } from "@ai-exhibit/presentation-core";
import { Rich } from "../primitives/Rich.tsx";
import { EXPLORER, formatSimilarity, MAP_CONTROLS } from "../embeddings/copy.ts";
import { clusterColor, useEmbeddingSpace } from "../embeddings/data.ts";
import { InteractiveMap } from "../embeddings/InteractiveMap.tsx";
import { fromLocated, type QueryResult, searchVocabulary, selectWord } from "../embeddings/search.ts";
import { SOLO } from "./copy.ts";
import { canAsk, type SoloEnv } from "./env.ts";
import { AsksLeft, BusyNotice, cx, RecordedTag, SoloRoot, soloStyles as styles } from "./ui.tsx";
import local from "./WordsSolo.module.css";

/** Map units: a portrait box, so labels land at a readable size on a phone. */
const MAP_W = 520;
const MAP_H = 600;
/** Word labels at once on a phone, even with "show all words": placement stays quick. */
const MAX_LABELS = 140;

/** The 3D cloud is its own chunk, loaded the first time someone picks it. */
const Cloud3D = lazy(() => import("../embeddings/Cloud3D.tsx").then((m) => ({ default: m.Cloud3D })));

/** The map's own word for this text (same spelling, any case), if there is one. */
export function exactWord(space: EmbeddingSpace, text: string): number {
  const t = text.trim().toLocaleLowerCase();
  return space.items.findIndex((i) => i.text.toLocaleLowerCase() === t);
}

export default function WordsSolo({ env }: { env: SoloEnv }) {
  const { locale } = env;
  const { space, error } = useEmbeddingSpace();
  if (!space) {
    return (
      <SoloRoot label={tr(EXPLORER.searchHeading, locale)}>
        <p className={styles.intro}>{tr(error ? EXPLORER.dataMissing : EXPLORER.loadingData, locale)}</p>
      </SoloRoot>
    );
  }
  return <Words space={space} env={env} />;
}

function Words({ space, env }: { space: EmbeddingSpace; env: SoloEnv }) {
  const { locale } = env;
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState<QueryResult | null>(null);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const live = canAsk(env, "words");
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [showAll, setShowAll] = useState(false);

  const search = async (typed: string) => {
    const text = typed.trim().slice(0, MAX_INPUT_CHARS);
    if (!text) return;
    const id = ++request.current;
    setBusy(false);
    const known = exactWord(space, text);
    if (known >= 0) return setQuery(selectWord(space, known));
    if (!live) return setQuery(searchVocabulary(space, text));
    setPending(true);
    try {
      const t0 = performance.now();
      const r = await cloudEmbed([queryText(space, text)], env.cloud("words"));
      const raw = r.vectors[0] ? Float32Array.from(r.vectors[0]) : undefined;
      if (id !== request.current || !raw) return;
      setQuery(fromLocated(text, locateQuery(space, raw), "model", { ms: Math.round(performance.now() - t0) }));
    } catch (err) {
      if (id !== request.current) return;
      const trouble = env.report(err);
      setBusy(trouble === "busy");
      if (trouble !== "busy") setQuery(searchVocabulary(space, text));
    } finally {
      if (id === request.current) setPending(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void search(draft);
  };

  // Stable values, so the map and the cloud only recompute when the result changes.
  const highlight = useMemo(() => (query?.neighbours ?? []).map((n) => n.index), [query]);
  const mapQuery = useMemo(() => (query?.position ? { text: query.text, position: query.position, neighbours: highlight } : null), [query, highlight]);
  const cloudQuery = useMemo(() => (query?.position3d ? { text: query.text, position: query.position3d } : null), [query]);
  const pick = (i: number | null) => {
    if (i === null) return;
    request.current++;
    setPending(false);
    setQuery(selectWord(space, i));
  };

  return (
    <SoloRoot label={tr(EXPLORER.searchHeading, locale)}>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label} htmlFor="solo-word">
          {tr(SOLO.wordsField, locale)}
        </label>
        <div className={styles.row}>
          <input
            id="solo-word"
            className={styles.input}
            value={draft}
            maxLength={MAX_INPUT_CHARS}
            placeholder={tr(live ? EXPLORER.tryThese : EXPLORER.tryVocabulary, locale)}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setDraft(e.currentTarget.value)}
          />
          <button type="submit" className={cx(styles.button, styles.primary)} disabled={!draft.trim() || pending}>
            {tr(EXPLORER.submit, locale)}
          </button>
        </div>
      </form>
      <p className={styles.note}>{tr(live ? SOLO.wordsCost : EXPLORER.fallbackActive, locale)}</p>
      <AsksLeft env={env} demo="words" />
      {busy ? <BusyNotice locale={locale} /> : null}
      {pending ? <p className={styles.pending}>{tr(EXPLORER.thinking, locale)}</p> : null}
      <div className={styles.buttons} role="group" aria-label={tr(SOLO.wordsViews, locale)}>
        <button type="button" className={styles.button} aria-pressed={view === "2d"} onClick={() => setView("2d")}>
          {tr(EXPLORER.view2d, locale)}
        </button>
        <button type="button" className={styles.button} aria-pressed={view === "3d"} onClick={() => setView("3d")}>
          {tr(EXPLORER.view3d, locale)}
        </button>
        <button
          type="button"
          className={styles.button}
          aria-pressed={showAll && view === "2d"}
          // Labels for every word are a map feature: from the cloud, this goes back to the map.
          onClick={() => {
            const on = !(showAll && view === "2d");
            setShowAll(on);
            if (on) setView("2d");
          }}
        >
          {tr(MAP_CONTROLS.showAll, locale)}
        </button>
      </div>
      <div className={local.map}>
        {view === "3d" ? (
          <Suspense fallback={<p className={styles.pending}>{tr(EXPLORER.loadingData, locale)}</p>}>
            <Cloud3D
              space={space}
              locale={locale}
              width={MAP_W}
              height={MAP_H}
              fluid
              colored
              clusterNames={!query}
              highlight={highlight}
              query={cloudQuery}
              spinning={!env.reducedMotion}
              reducedMotion={env.reducedMotion}
              interactive
              onSelect={pick}
            />
          </Suspense>
        ) : (
          <InteractiveMap
            space={space}
            locale={locale}
            width={MAP_W}
            height={MAP_H}
            fluid
            colored
            clusterNames={!query}
            pairs={false}
            highlight={highlight}
            query={mapQuery}
            labelBudget={query ? 40 : 70}
            showAll={showAll}
            maxLabels={MAX_LABELS}
            zoomTarget={query?.position ?? null}
            interactive
            camera={null}
            onSelect={pick}
            reducedMotion={env.reducedMotion}
          />
        )}
      </div>
      <p className={styles.hint}>{tr(view === "3d" ? SOLO.cloudHint : SOLO.wordsHint, locale)}</p>
      {query ? <Results space={space} query={query} locale={locale} /> : null}
    </SoloRoot>
  );
}

function Results({ space, query, locale }: { space: EmbeddingSpace; query: QueryResult; locale: Locale }) {
  if (query.source === "unknown") return <p className={styles.notice}>{tr(EXPLORER.unknown, locale)}</p>;
  const n = space.json.clusters.length;
  const max = Math.max(...query.neighbours.map((x) => x.similarity), 0.01);
  return (
    <div className={styles.card}>
      <p className={styles.label}>
        {tr(EXPLORER.listHeading, locale)}
        {query.matched ? (
          <span className={local.matched}>
            {tr(EXPLORER.matched, locale)} {query.matched}
          </span>
        ) : null}
      </p>
      <ol className={local.list}>
        {query.neighbours.map((nb) => {
          const it = space.items[nb.index]!;
          return (
            <li key={nb.index} className={local.item}>
              <span className={local.swatch} style={{ background: clusterColor(it.cluster, n) }} aria-hidden="true" />
              <span className={local.word}>{it.text}</span>
              <span className={local.bar} aria-hidden="true">
                <span style={{ width: `${Math.max(0, (nb.similarity / max) * 100)}%` }} />
              </span>
              <span className={local.sim}>{formatSimilarity(nb.similarity, locale)}</span>
            </li>
          );
        })}
      </ol>
      <p className={styles.note}>
        {tr(EXPLORER.closeness, locale)}
        {query.source === "model" ? `, ${tr(EXPLORER.liveMs, locale)}` : `, ${tr(EXPLORER.fromVocabulary, locale)}`}
      </p>
      {query.source === "model" ? (
        <p className={styles.note}>
          <Rich text={tr(EXPLORER.faithful, locale)} />
        </p>
      ) : null}
      {query.source === "vocabulary" ? <RecordedTag locale={locale} /> : null}
    </div>
  );
}
