import { type EmbeddingSpace, locateQuery, queryText } from "@ai-exhibit/ml-runtime/embeddings";
import { cloudEmbed } from "@ai-exhibit/ml-runtime/lm";
import type { Locale } from "@ai-exhibit/presentation-core";
import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import type { SceneComponentProps } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
import { decideSource, requestedSource, resetCloudStatus, useCloudStatus } from "../language/source.ts";
import { SourceBadge } from "../language/ui.tsx";
import { Cloud3D } from "./Cloud3D.tsx";
import { EXPLORER, formatSimilarity, TRAINING, tr } from "./copy.ts";
import { clusterColor, useEmbeddingSpace } from "./data.ts";
import { InteractiveMap } from "./InteractiveMap.tsx";
import { NeighbourCard, selectionMarks } from "./Selection.tsx";
import { type ExplorerState, fromLocated, type QueryResult, searchVocabulary, selectWord } from "./search.ts";
import { TrainingView } from "./Training.tsx";
import styles from "./EmbeddingExplorer.module.css";

export interface EmbeddingExplorerProps {
  mode?: "cloud" | "search" | "training";
}


/** Stops the presenter shell shortcuts while typing or pressing a scene button. */
function stopKeys(e: KeyboardEvent) {
  e.stopPropagation();
}

export function EmbeddingExplorer({ props, ctx }: SceneComponentProps<EmbeddingExplorerProps, ExplorerState>) {
  const mode = props.mode === "search" || props.mode === "training" ? props.mode : "cloud";
  const { space, error } = useEmbeddingSpace();
  const { locale } = ctx;

  if (!space) {
    return (
      <div className={styles.root}>
        <p className={styles.notice}>{tr(error ? EXPLORER.dataMissing : EXPLORER.loadingData, locale)}</p>
      </div>
    );
  }
  if (mode === "training") return <TrainingMode space={space} ctx={ctx} />;
  return mode === "cloud" ? <CloudMode space={space} ctx={ctx} /> : <SearchMode space={space} ctx={ctx} />;
}

function TrainingMode({ space, ctx }: { space: EmbeddingSpace; ctx: Ctx }) {
  const { locale, role } = ctx;
  const state = ctx.state ?? {};
  const step = Math.max(0, Math.min(ctx.revealStep, TRAINING.captions.length - 1));
  const preview = role === "preview";
  const still = ctx.reducedMotion || preview;
  const patch = usePatch(ctx);
  return (
    <div className={`${styles.root} ${still ? styles.still : ""}`}>
      <header className={styles.header}>
        <h2 className={styles.heading}>{tr(TRAINING.heading, locale)}</h2>
        <Legend locale={locale} pairs={false} />
      </header>
      <div className={styles.cloudStage}>
        <TrainingView
          space={space}
          locale={locale}
          width={1728}
          height={690}
          step={step}
          replay={state.replay ?? 0}
          still={still}
          explore={
            preview
              ? undefined
              : {
                  interactive: role === "controller",
                  camera: state.camera,
                  onCamera: (c) => patch({ camera: c }),
                  selected: state.selected ?? null,
                  onSelect: (i) => patch({ selected: i }),
                  reducedMotion: ctx.reducedMotion,
                  showAll: Boolean(state.showAll),
                  onShowAll: (on) => patch({ showAll: on }),
                }
          }
        />
      </div>
      <footer className={styles.footer}>
        <div className={styles.captionBlock}>
          <p className={`${styles.caption} ${styles.wideCaption}`} key={step}>
            <Rich text={tr(TRAINING.captions[step]!, locale)} />
          </p>
          <p className={styles.illustrative}>
            <Rich text={tr(TRAINING.illustrative, locale)} />
          </p>
        </div>
        {role === "controller" && step >= 1 && (
          <div className={styles.controllerBar} onKeyDown={stopKeys}>
            <button type="button" className={styles.button} onClick={() => patch({ replay: (state.replay ?? 0) + 1 })}>
              {tr(TRAINING.replay, locale)}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

type Ctx = SceneComponentProps<EmbeddingExplorerProps, ExplorerState>["ctx"];

/**
 * Merges a partial update into the latest scene state. Camera updates arrive
 * many times a second, so merging into the state of the last render could
 * drop a change made in between.
 */
function usePatch(ctx: Ctx) {
  const ref = useRef<ExplorerState>(ctx.state ?? {});
  ref.current = ctx.state ?? {};
  const setState = ctx.setState;
  return useCallback(
    (next: Partial<ExplorerState>) => {
      ref.current = { ...ref.current, ...next };
      setState(ref.current);
    },
    [setState],
  );
}

function Legend({ locale, pairs }: { locale: Locale; pairs: boolean }) {
  return (
    <ul className={styles.legend} aria-label={locale === "fr" ? "Légende" : "Legend"}>
      <li>
        <svg width="22" height="22" aria-hidden="true">
          <circle cx="11" cy="11" r="7" className={styles.legendFilled} />
        </svg>
        {tr(EXPLORER.legendFr, locale)}
      </li>
      <li>
        <svg width="22" height="22" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" className={styles.legendRing} />
        </svg>
        {tr(EXPLORER.legendEn, locale)}
      </li>
      <li>
        <svg width="22" height="22" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" className={styles.legendBoth} />
        </svg>
        {tr(EXPLORER.legendBoth, locale)}
      </li>
      {pairs && (
        <li>
          <svg width="34" height="22" aria-hidden="true">
            <line x1="3" y1="11" x2="31" y2="11" className={styles.legendThread} />
          </svg>
          {tr(EXPLORER.legendPair, locale)}
        </li>
      )}
    </ul>
  );
}

function ViewToggle({ ctx, state }: { ctx: Ctx; state: ExplorerState }) {
  const view = state.view ?? "2d";
  const set = (next: Partial<ExplorerState>) => ctx.setState({ ...state, ...next });
  return (
    <div className={styles.controls} onKeyDown={stopKeys}>
      <button type="button" className={styles.button} aria-pressed={view === "2d"} onClick={() => set({ view: "2d" })}>
        {tr(EXPLORER.view2d, ctx.locale)}
      </button>
      <button type="button" className={styles.button} aria-pressed={view === "3d"} onClick={() => set({ view: "3d" })}>
        {tr(EXPLORER.view3d, ctx.locale)}
      </button>
    </div>
  );
}

function CloudMode({ space, ctx }: { space: EmbeddingSpace; ctx: Ctx }) {
  const { locale, role } = ctx;
  const state = ctx.state ?? {};
  const step = Math.max(0, Math.min(ctx.revealStep, EXPLORER.cloudCaptions.length - 1));
  const colored = step >= 1;
  const pairs = step >= 2;
  const focus = state.focus ?? null;
  const controller = role === "controller";
  const preview = role === "preview";
  const view = preview ? "2d" : (state.view ?? "2d");
  const set = usePatch(ctx);
  const selected = preview ? null : (state.selected ?? null);
  const marks = selectionMarks(space, selected);
  const onCluster = controller && colored ? (c: number) => set({ focus: focus === c ? null : c }) : undefined;

  return (
    <div className={`${styles.root} ${ctx.reducedMotion || preview ? styles.still : ""}`}>
      <header className={styles.header}>
        <h2 className={styles.heading}>{tr(EXPLORER.cloudHeading, locale)}</h2>
        <Legend locale={locale} pairs={pairs} />
      </header>
      <div className={styles.cloudStage}>
        {view === "3d" ? (
          <Cloud3D
            space={space}
            locale={locale}
            width={1728}
            height={760}
            colored={colored}
            clusterNames={colored}
            focus={focus}
            spinning={!ctx.reducedMotion}
            reducedMotion={ctx.reducedMotion}
            interactive={controller}
            camera={state.camera3d ?? null}
            onCamera={(c) => set({ camera3d: c })}
          />
        ) : (
          <>
            <InteractiveMap
              space={space}
              locale={locale}
              width={1728}
              height={760}
              colored={colored}
              clusterNames={colored}
              pairs={pairs}
              focus={focus}
              labelBudget={preview ? 0 : colored ? 260 : 420}
              entrance={!preview && !ctx.reducedMotion}
              onClusterClick={onCluster}
              query={marks.query}
              highlight={marks.highlight}
              zoomTarget={marks.query?.position ?? null}
              showAll={!preview && Boolean(state.showAll)}
              onShowAll={(on) => set({ showAll: on })}
              interactive={controller}
              camera={preview ? null : state.camera}
              onCamera={(c) => set({ camera: c })}
              onSelect={(i) => set({ selected: i })}
              reducedMotion={ctx.reducedMotion}
            />
            {selected !== null && <NeighbourCard space={space} index={selected} locale={locale} style={{ top: 0, left: 0 }} />}
          </>
        )}
      </div>
      <footer className={styles.footer}>
        <p className={styles.caption} key={step}>
          <Rich text={tr(EXPLORER.cloudCaptions[step]!, locale)} />
        </p>
        {controller && (
          <div className={styles.controllerBar}>
            {colored && focus !== null && (
              <button type="button" className={styles.button} onClick={() => set({ focus: null })} onKeyDown={stopKeys}>
                {tr(EXPLORER.showAll, locale)}
              </button>
            )}
            {colored && focus === null && view === "2d" && <span className={styles.hint}>{tr(EXPLORER.clusterHint, locale)}</span>}
            <ViewToggle ctx={ctx} state={state} />
          </div>
        )}
      </footer>
    </div>
  );
}

function SearchMode({ space, ctx }: { space: EmbeddingSpace; ctx: Ctx }) {
  const { locale, role } = ctx;
  const state = ctx.state ?? {};
  const controller = role === "controller";
  const preview = role === "preview";
  const fallback = ctx.mode === "fallback";
  const [draft, setDraft] = useState("");
  const [cloudFailed, setCloudFailed] = useState(false);
  const requestRef = useRef(0);
  const patch = usePatch(ctx);

  // Model source chosen by the presenter: Hugging Face (/api/embed) or
  // prepared words only; hf falls back to prepared words and the controller's
  // badge says why. No model runs in the browser.
  const requested = requestedSource(ctx);
  const cloud = useCloudStatus(controller && !fallback && requested === "hf");
  const decision = decideSource({ requested, sceneFallback: fallback, cloud, cloudFailed });
  const useModel = decision.active === "hf";

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !controller) return;
    const id = ++requestRef.current;
    if (!useModel) {
      patch({ query: searchVocabulary(space, text), busy: false });
      return;
    }
    patch({ busy: true });
    try {
      const t0 = performance.now();
      const r = await cloudEmbed([queryText(space, text)]);
      const raw = r.vectors[0] ? Float32Array.from(r.vectors[0]) : undefined;
      const ms = performance.now() - t0;
      if (id !== requestRef.current || !raw) return;
      const result = fromLocated(text, locateQuery(space, raw), "model", { ms: Math.round(ms) });
      patch({ query: result, busy: false });
    } catch {
      if (id !== requestRef.current) return;
      // Next queries use the prepared words; the next scene asks the server again.
      setCloudFailed(true);
      resetCloudStatus();
      patch({ query: searchVocabulary(space, text), busy: false });
    }
  };

  const clear = () => {
    requestRef.current++;
    setDraft("");
    patch({ query: null, busy: false });
  };

  const query = preview ? null : (state.query ?? null);
  const neighbours = query?.neighbours ?? [];
  const mapQuery = query?.position ? { text: query.text, position: query.position, neighbours: neighbours.map((n) => n.index) } : null;
  const highlight = neighbours.map((n) => n.index);
  const view = preview ? "2d" : (state.view ?? "2d");

  let notice: string | null = null;
  if (fallback) notice = tr(EXPLORER.fallbackActive, locale);
  else if (controller && requested !== "simulation" && decision.active === "simulation") notice = tr(EXPLORER.modelMissing, locale);
  else if (!controller && query && (query.source === "vocabulary" || query.source === "unknown")) notice = tr(EXPLORER.fallbackActive, locale);

  return (
    <div className={`${styles.root} ${ctx.reducedMotion || preview ? styles.still : ""}`}>
      <div className={styles.searchLayout}>
        <div className={styles.searchMap}>
          {view === "3d" ? (
            <Cloud3D
              space={space}
              locale={locale}
              width={1080}
              height={900}
              colored
              clusterNames={!query}
              highlight={highlight}
              query={query?.position3d ? { text: query.text, position: query.position3d } : null}
              spinning={!ctx.reducedMotion}
              reducedMotion={ctx.reducedMotion}
              interactive={controller}
              camera={state.camera3d ?? null}
              onCamera={(c) => patch({ camera3d: c })}
            />
          ) : (
            <InteractiveMap
              space={space}
              locale={locale}
              width={1080}
              height={900}
              colored
              clusterNames={!query}
              pairs={false}
              highlight={highlight}
              query={mapQuery}
              labelBudget={query ? 120 : preview ? 0 : 200}
              zoomTarget={query?.position ?? null}
              showAll={!preview && Boolean(state.showAll)}
              onShowAll={(on) => patch({ showAll: on })}
              interactive={controller}
              camera={preview ? null : state.camera}
              onCamera={(c) => patch({ camera: c })}
              onSelect={(i) => {
                if (i === null) return;
                requestRef.current++;
                patch({ query: selectWord(space, i), busy: false });
              }}
              reducedMotion={ctx.reducedMotion}
            />
          )}
        </div>
        <aside className={styles.panel}>
          <h2 className={styles.heading}>{tr(EXPLORER.searchHeading, locale)}</h2>
          {controller && !fallback ? <SourceBadge decision={decision} model="MiniLM-L12 multilingual" locale={locale} /> : null}
          {controller ? (
            <form className={styles.form} onSubmit={submit} onKeyDown={stopKeys}>
              <input
                className={styles.input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={tr(EXPLORER.placeholder, locale)}
                aria-label={tr(EXPLORER.placeholder, locale)}
                maxLength={80}
                spellCheck={false}
                autoComplete="off"
              />
              <div className={styles.formRow}>
                <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={!draft.trim() || state.busy}>
                  {tr(EXPLORER.submit, locale)}
                </button>
                {query && (
                  <button type="button" className={styles.button} onClick={clear}>
                    {tr(EXPLORER.clear, locale)}
                  </button>
                )}
                <ViewToggle ctx={ctx} state={state} />
              </div>
              {!query && <p className={styles.hint}>{tr(useModel ? EXPLORER.tryThese : EXPLORER.tryVocabulary, locale)}</p>}
            </form>
          ) : (
            <p className={styles.queryText}>{query ? query.text : tr(EXPLORER.waiting, locale)}</p>
          )}
          {notice && <p className={styles.notice}>{notice}</p>}
          {state.busy && !preview && <p className={styles.busy}>{tr(EXPLORER.thinking, locale)}</p>}
          {query && <Results space={space} query={query} locale={locale} />}
          {query && query.source !== "unknown" && <p className={styles.faithful}>
              <Rich text={tr(EXPLORER.faithful, locale)} />
            </p>}
        </aside>
      </div>
    </div>
  );
}

function Results({ space, query, locale }: { space: EmbeddingSpace; query: QueryResult; locale: Locale }) {
  if (query.source === "unknown") return <p className={styles.unknown}>{tr(EXPLORER.unknown, locale)}</p>;
  const n = space.json.clusters.length;
  const max = Math.max(...query.neighbours.map((x) => x.similarity), 0.01);
  return (
    <div className={styles.results}>
      <p className={styles.listHeading}>
        {tr(EXPLORER.listHeading, locale)}
        {query.matched && (
          <span className={styles.matched}>
            {tr(EXPLORER.matched, locale)} {locale === "fr" ? `«\u00a0${query.matched}\u00a0»` : `"${query.matched}"`}
          </span>
        )}
      </p>
      <ol className={styles.list}>
        {query.neighbours.map((nb, rank) => {
          const it = space.items[nb.index]!;
          return (
            <li key={nb.index} className={styles.row} style={{ animationDelay: `${rank * 60}ms` }}>
              <span className={styles.swatch} style={{ background: clusterColor(it.cluster, n) }} aria-hidden="true" />
              <span className={styles.word}>{it.text}</span>
              <span className={styles.bar} aria-hidden="true">
                <span style={{ width: `${Math.max(0, (nb.similarity / max) * 100)}%` }} />
              </span>
              <span className={styles.sim}>{formatSimilarity(nb.similarity, locale)}</span>
            </li>
          );
        })}
      </ol>
      <p className={styles.meta}>
        {tr(EXPLORER.closeness, locale)}
        {query.source === "model" && query.ms !== undefined
          ? `, ${tr(EXPLORER.liveMs, locale)} (${query.ms} ms)`
          : `, ${tr(EXPLORER.fromVocabulary, locale)}`}
      </p>
    </div>
  );
}
