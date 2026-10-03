import type { EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import type { Locale } from "@ai-exhibit/presentation-core";
import { type KeyboardEvent, useMemo } from "react";
import { clusterColor } from "./data.ts";
import { estimateWidth, type LabelRequest, placeLabels } from "./labels.ts";
import { type Camera, defaultCamera, frameFor, labelBudgetFor, toScreen } from "./view.ts";
import styles from "./MapView.module.css";

/** Words whose translation threads are drawn boldly and always labelled. */
export const DEMO_PAIRS = ["chat", "roi", "pluie"];

export interface MapQuery {
  text: string;
  position: [number, number];
  /** Neighbours to connect to the query mark, best first. */
  neighbours: number[];
}

export interface MapViewProps {
  space: EmbeddingSpace;
  locale: Locale;
  width: number;
  height: number;
  /** Which 2D layout to draw. */
  projection?: "umap2d" | "pca2d";
  colored: boolean;
  clusterNames: boolean;
  pairs: boolean;
  /** One group, several groups, or null: other groups are dimmed. */
  focus?: number | readonly number[] | null;
  /** Screen areas (map pixels) that labels must avoid, e.g. a card drawn over the map. */
  avoid?: readonly { x0: number; y0: number; x1: number; y1: number }[];
  /** Whether highlighted words dim every other dot (default true). */
  dimOthers?: boolean;
  /** Word and group labels fade in (used when the training animation lands). */
  labelsFadeIn?: boolean;
  /** Items to emphasise (labelled, full opacity). */
  highlight?: readonly number[];
  query?: MapQuery | null;
  /** How many ordinary words get a label when space allows. */
  labelBudget?: number;
  /** Plays the one entrance sweep. */
  entrance?: boolean;
  onClusterClick?: (cluster: number) => void;
  /** Label every word in view (as many as fit without overlapping). */
  showAll?: boolean;
  /** Pan and zoom; omitted means the whole map (zoom 1). */
  camera?: Camera;
  /** Optional extra marks drawn on top, in map pixels. */
  overlay?: (toPx: (p: readonly number[]) => [number, number]) => React.ReactNode;
}

/**
 * Scales the layout to fill the box. The two axes may stretch differently, by
 * at most 1.6x, so a wide stage is used without warping the map beyond reason.
 */
export function fitBox(coords: readonly (readonly number[])[], width: number, height: number, margin: number) {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of coords) {
    x0 = Math.min(x0, p[0]!);
    x1 = Math.max(x1, p[0]!);
    y0 = Math.min(y0, p[1]!);
    y1 = Math.max(y1, p[1]!);
  }
  let sx = (width - 2 * margin) / Math.max(1e-6, x1 - x0);
  let sy = (height - 2 * margin) / Math.max(1e-6, y1 - y0);
  const maxRatio = 1.6;
  if (sx > sy * maxRatio) sx = sy * maxRatio;
  if (sy > sx * maxRatio) sy = sx * maxRatio;
  return { sx, sy, cx: width / 2 - ((x0 + x1) / 2) * sx, cy: height / 2 + ((y0 + y1) / 2) * sy };
}

/** Upper bound on word labels placed per render, so zooming stays smooth. */
export const MAX_WORD_LABELS = 600;

/** Deterministic pseudo-random rank so the sparse labels look scattered, not sorted. */
function hashRank(i: number): number {
  let x = (i + 1) * 2654435761;
  x ^= x >>> 13;
  return (x >>> 0) % 1000;
}

/** The member of each cluster closest to all others: a label anchor that sits on the group. */
export function clusterMedoids(space: EmbeddingSpace, coords: number[][]): number[] {
  return space.json.clusters.map((_, c) => {
    const members = space.items.filter((it) => it.cluster === c).map((it) => it.index);
    let best = members[0] ?? 0;
    let bestCost = Infinity;
    for (const a of members) {
      let cost = 0;
      for (const b of members) {
        const pa = coords[a]!;
        const pb = coords[b]!;
        let d = 0;
        for (let k = 0; k < pa.length; k++) d += (pa[k]! - pb[k]!) ** 2;
        cost += Math.sqrt(d);
      }
      if (cost < bestCost) {
        bestCost = cost;
        best = a;
      }
    }
    return best;
  });
}

export function MapView(props: MapViewProps) {
  const { space, locale, width, height, colored, clusterNames, pairs, highlight = [], query = null } = props;
  const focusSet = useMemo(
    () => (props.focus === null || props.focus === undefined ? null : new Set(typeof props.focus === "number" ? [props.focus] : props.focus)),
    [props.focus],
  );
  const inFocus = (cluster: number) => focusSet?.has(cluster) ?? false;
  const focusKey = focusSet ? [...focusSet].join(",") : "";
  const coords = space.coords[props.projection ?? "umap2d"];
  const margin = 40;
  const frame = useMemo(() => frameFor(coords, width, height, margin), [coords, width, height]);
  const camera = props.camera ?? defaultCamera(frame);
  const zoom = camera.k;
  const px = (p: readonly number[]): [number, number] => toScreen(p, camera, frame);
  const inView = (x: number, y: number) => x >= -20 && y >= -20 && x <= width + 20 && y <= height + 20;
  // Zoomed out: group names and a few words. Zoomed in: every word in view, no group names.
  const showClusterNames = clusterNames && zoom < 3;
  // Labels keep a constant size on screen while the map scales; more words are
  // labelled as you zoom in, and "show all" asks for every word in view.
  const showAll = Boolean(props.showAll);
  const budget = showAll ? 1000 : labelBudgetFor(zoom, props.labelBudget ?? 380);
  const wordSize = zoom >= 2.5 ? 22 : showAll ? 17 : 19;

  const nClusters = space.json.clusters.length;
  const highlightSet = useMemo(() => new Set(highlight), [highlight]);
  const medoids = useMemo(() => clusterMedoids(space, coords), [space, coords]);
  const demo = useMemo(() => {
    const s = new Set<number>();
    for (const w of DEMO_PAIRS) {
      const it = space.items.find((i) => i.text === w);
      if (it) {
        s.add(it.index);
        if (it.pair >= 0) s.add(it.pair);
      }
    }
    return s;
  }, [space]);

  const dimmed = (i: number) => {
    if (query) return !highlightSet.has(i);
    if (focusSet) return !inFocus(space.items[i]!.cluster);
    if (highlightSet.size && props.dimOthers !== false) return !highlightSet.has(i);
    return false;
  };

  const labels = useMemo(() => {
    // Phase 1: the query and the group names, which may sit over dots (drawn
    // with a halo) because they name the whole group.
    const head: LabelRequest[] = [];
    if (query) {
      const [x, y] = px(query.position);
      head.push({ key: "q", text: query.text, x, y: y - 46, size: 44, priority: 5000, centered: true });
    }
    if (showClusterNames) {
      medoids.forEach((m, c) => {
        if (focusSet && !inFocus(c)) return;
        const [x, y] = px(coords[m]!);
        // A group whose centre is off screen is not named at the edge.
        if (!inView(x, y)) return;
        head.push({ key: `c${c}`, text: space.json.clusters[c]!.label[locale], x, y: y - 30, size: 34, priority: 4000, centered: true });
      });
    }
    // Highlighted words and the demo translation pairs come next, before any group noise.
    space.items.forEach((it) => {
      const [x, y] = px(coords[it.index]!);
      if (highlightSet.has(it.index)) {
        head.push({ key: it.index, text: it.text, x, y, size: 27, priority: 4800 - highlight.indexOf(it.index) });
      } else if (pairs && demo.has(it.index)) {
        head.push({ key: it.index, text: it.text, x, y, size: 27, priority: 4500 });
      }
    });
    const placedHead = placeLabels(head, { width, height }, { obstacles: props.avoid ?? [] });
    const headKeys = new Set(head.map((h) => h.key));
    // Phase 2: words, which avoid the names above and every dot.
    const req: LabelRequest[] = [];
    space.items.forEach((it) => {
      const [x, y] = px(coords[it.index]!);
      let priority = -1;
      if (!inView(x, y)) return;
      let size = wordSize;
      if (headKeys.has(it.index)) {
        return;
      } else if (focusSet && inFocus(it.cluster) && focusSet.size === 1) {
        priority = 2000 + hashRank(it.index);
        size = 24;
      } else if ((!dimmed(it.index) || zoom >= 2.5 || showAll) && hashRank(it.index) < budget) {
        // Bright words before dimmed ones, then a stable scattered order.
        priority = (dimmed(it.index) ? 0 : 1000) + 999 - hashRank(it.index);
      }
      if (priority >= 0) req.push({ key: it.index, text: it.text, x, y, size, priority });
    });
    const obstacles = [
      ...(props.avoid ?? []),
      ...placedHead.map((l) => {
        const w = estimateWidth(l.text, l.size);
        const x0 = l.anchor === "start" ? l.x : l.anchor === "end" ? l.x - w : l.x - w / 2;
        return { x0, y0: l.y - l.size * 0.6, x1: x0 + w, y1: l.y + l.size * 0.6 };
      }),
      // Only dots on screen can block a label (culled for speed when zoomed in).
      ...space.items.flatMap((it) => {
        const [x, y] = px(coords[it.index]!);
        if (!inView(x, y)) return [];
        const r = highlightSet.has(it.index) ? 9 : 5;
        return [{ x0: x - r, y0: y - r, x1: x + r, y1: y + r }];
      }),
    ];
    const dense = showAll || zoom >= 2.5;
    return [...placedHead, ...placeLabels(req, { width, height }, { obstacles, diagonals: dense, max: MAX_WORD_LABELS })];
  }, [space, coords, locale, width, height, showClusterNames, pairs, focusKey, highlight, query, budget, wordSize, showAll, props.avoid, camera.u, camera.v, camera.k]);

  const color = (i: number) => (colored ? clusterColor(space.items[i]!.cluster, nClusters) : "var(--color-text)");

  const onKey = (c: number) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.stopPropagation();
      e.preventDefault();
      props.onClusterClick?.(c);
    }
  };

  return (
    <svg
      className={`${styles.map} ${zoom > 1.0001 ? styles.clip : ""} ${props.entrance ? styles.entrance : ""} ${props.labelsFadeIn ? styles.labelsIn : ""}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={locale === "fr" ? "Carte des mots" : "Map of words"}
    >
      {pairs && (
        <g className={styles.threads}>
          {space.items.map((it) => {
            if (it.pair < it.index) return null;
            const [x1, y1] = px(coords[it.index]!);
            const [x2, y2] = px(coords[it.pair]!);
            const strong = demo.has(it.index);
            return (
              <line
                key={it.index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={strong ? styles.threadStrong : styles.thread}
                opacity={dimmed(it.index) && !strong ? 0.15 : undefined}
              />
            );
          })}
        </g>
      )}
      {query && (
        <g className={styles.queryLinks}>
          {query.neighbours.slice(0, 5).map((n) => {
            const [x1, y1] = px(query.position);
            const [x2, y2] = px(coords[n]!);
            return <line key={n} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
      )}
      <g>
        {space.items.map((it) => {
          const [x, y] = px(coords[it.index]!);
          const c = color(it.index);
          const hl = highlightSet.has(it.index);
          const r = hl ? 9 : 6;
          return (
            <circle
              key={it.index}
              cx={x}
              cy={y}
              r={r}
              className={`${styles.point} ${dimmed(it.index) ? styles.dim : ""} ${hl ? styles.hl : ""}`}
              style={{
                fill: it.lang === "en" ? "var(--color-bg)" : c,
                stroke: c,
                strokeWidth: it.lang === "fr" ? 0 : it.lang === "both" ? 3.5 : 2.5,
                animationDelay: `${Math.round(((x / width) * 900))}ms`,
              }}
            />
          );
        })}
      </g>
      {query && (
        <g className={styles.query} transform={`translate(${px(query.position).join(",")})`}>
          <circle r={26} className={styles.queryHalo} />
          <path d="M0,-17 L4.5,-5 L17,-5 L7,3 L11,16 L0,8 L-11,16 L-7,3 L-17,-5 L-4.5,-5 Z" className={styles.queryStar} />
        </g>
      )}
      <g>
        {labels.map((l) => {
          const isCluster = typeof l.key === "string" && l.key.startsWith("c");
          const isQuery = l.key === "q";
          const cluster = isCluster ? Number((l.key as string).slice(1)) : -1;
          const index = typeof l.key === "number" ? l.key : -1;
          const cls = isQuery
            ? styles.queryLabel
            : isCluster
              ? styles.clusterLabel
              : highlightSet.has(index) || (pairs && demo.has(index)) || (focusSet !== null && inFocus(space.items[index]?.cluster ?? -1))
                ? styles.wordStrong
                : styles.word;
          const clickable = isCluster && props.onClusterClick;
          return (
            <text
              key={String(l.key)}
              x={l.x}
              y={l.y}
              textAnchor={l.anchor}
              fontSize={l.size}
              className={`${cls} ${clickable ? styles.clickable : ""}`}
              style={isCluster ? { fill: colored ? clusterColor(cluster, nClusters) : "var(--color-text)" } : undefined}
              onClick={clickable ? () => props.onClusterClick?.(cluster) : undefined}
              onKeyDown={clickable ? onKey(cluster) : undefined}
              tabIndex={clickable ? 0 : undefined}
              role={clickable ? "button" : undefined}
            >
              {l.text}
            </text>
          );
        })}
      </g>
      {props.overlay?.(px)}
    </svg>
  );
}
