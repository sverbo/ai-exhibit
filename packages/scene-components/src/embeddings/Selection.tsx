import type { EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import type { Locale } from "@ai-exhibit/presentation-core";
import { formatSimilarity, MAP_CONTROLS, tr } from "./copy.ts";
import { clusterColor } from "./data.ts";
import type { MapQuery } from "./MapView.tsx";
import styles from "./Selection.module.css";

const SHOWN = 6;

/** Map props that mark a clicked word and join it to its nearest neighbours. */
export function selectionMarks(
  space: EmbeddingSpace,
  selected: number | null | undefined,
): { query: MapQuery | null; highlight: number[] } {
  if (selected === null || selected === undefined || !space.items[selected]) return { query: null, highlight: [] };
  const neighbours = space.neighboursOf(selected).slice(0, SHOWN).map((n) => n.index);
  const p = space.coords.umap2d[selected]!;
  return {
    query: { text: space.items[selected]!.text, position: [p[0]!, p[1]!], neighbours },
    highlight: [selected, ...neighbours],
  };
}

/** The clicked word's nearest neighbours in the full space (precomputed). */
export function NeighbourCard({
  space,
  index,
  locale,
  style,
}: {
  space: EmbeddingSpace;
  index: number;
  locale: Locale;
  style?: React.CSSProperties;
}) {
  const it = space.items[index];
  if (!it) return null;
  const n = space.json.clusters.length;
  const word = locale === "fr" ? `« ${it.text} »` : `"${it.text}"`;
  return (
    <aside className={styles.card} style={style} aria-live="polite">
      <p className={styles.title}>
        {tr(MAP_CONTROLS.neighboursOf, locale)} {word}
      </p>
      <ol className={styles.list}>
        {space
          .neighboursOf(index)
          .slice(0, SHOWN)
          .map((nb) => (
            <li key={nb.index}>
              <span className={styles.swatch} style={{ background: clusterColor(space.items[nb.index]!.cluster, n) }} aria-hidden="true" />
              <span className={styles.word}>{space.items[nb.index]!.text}</span>
              <span className={styles.sim}>{formatSimilarity(nb.similarity, locale)}</span>
            </li>
          ))}
      </ol>
    </aside>
  );
}
