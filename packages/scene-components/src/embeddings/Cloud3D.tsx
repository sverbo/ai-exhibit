import type { EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import type { Locale } from "@ai-exhibit/presentation-core";
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { MAP_CONTROLS, tr } from "./copy.ts";
import type { Camera3D } from "./search.ts";
import mapStyles from "./InteractiveMap.module.css";
import { clusterColor } from "./data.ts";
import { estimateWidth } from "./labels.ts";
import { clusterMedoids } from "./MapView.tsx";
import styles from "./MapView.module.css";

export interface Cloud3DProps {
  space: EmbeddingSpace;
  locale: Locale;
  width: number;
  height: number;
  colored: boolean;
  clusterNames: boolean;
  focus?: number | null;
  highlight?: readonly number[];
  query?: { text: string; position: [number, number, number] } | null;
  /** Rotation stops (and stays at a fixed angle) when false. */
  spinning: boolean;
  /** Snap instead of easing toward the camera. */
  reducedMotion?: boolean;
  /** Controller: drag to rotate, wheel or pinch to zoom, buttons to zoom and reset. */
  interactive?: boolean;
  /** Published rotation and zoom; null until the presenter moves the cloud. */
  camera?: Camera3D | null;
  onCamera?: (camera: Camera3D) => void;
}

export const TILT_RANGE: [number, number] = [-0.4, 1.3];
export const ZOOM_RANGE: [number, number] = [0.6, 5];
const HOME: Camera3D = { angle: 0.6, tilt: 0.35, zoom: 1 };

/** Applies a drag (dx, dy in pixels) and a zoom factor to a 3D camera, within limits. */
export function moveCamera3d(c: Camera3D, dx: number, dy: number, zoomFactor = 1): Camera3D {
  return {
    angle: c.angle + dx * 0.008,
    tilt: Math.min(TILT_RANGE[1], Math.max(TILT_RANGE[0], c.tilt + dy * 0.006)),
    zoom: Math.min(ZOOM_RANGE[1], Math.max(ZOOM_RANGE[0], c.zoom * zoomFactor)),
  };
}

/** Perspective projection of a point after rotating the cloud by `angle` around the vertical axis. */
export function project3d(p: readonly number[], angle: number, tilt = 0.35) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = p[0]! * c + p[2]! * s;
  const z = -p[0]! * s + p[2]! * c;
  // Tilt around the horizontal axis so the cloud is seen slightly from above.
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const y = p[1]! * ct - z * st;
  const depth = p[1]! * st + z * ct;
  const persp = 3 / (3 + depth);
  return { x: x * persp, y: y * persp, depth, persp };
}

/**
 * The 3D layout, slowly turning. Positions are written straight to the DOM
 * each frame (no React render per frame), so 400+ points stay smooth.
 */
export function Cloud3D(props: Cloud3DProps) {
  const { space, width, height, colored, clusterNames, focus = null, highlight = [], query = null, locale } = props;
  const interactive = Boolean(props.interactive);
  // Where the camera is heading: the controller's own moves, or the published camera.
  const [local, setLocal] = useState<Camera3D | null>(null);
  useEffect(() => {
    if (!props.camera) setLocal(null);
  }, [props.camera]);
  const target = interactive ? local : (props.camera ?? null);
  const targetRef = useRef(target);
  targetRef.current = target;
  // Turns on its own until someone moves it.
  const spinning = props.spinning && !target;
  const tiltRef = useRef(HOME.tilt);
  const zoomRef = useRef(HOME.zoom);
  const lastPublish = useRef(0);
  const move = (next: Camera3D) => {
    setLocal(next);
    targetRef.current = next;
    const now = Date.now();
    if (now - lastPublish.current > 80) {
      lastPublish.current = now;
      props.onCamera?.(next);
    } else {
      setTimeout(() => {
        if (targetRef.current === next) props.onCamera?.(next);
      }, 90);
    }
  };
  const current = (): Camera3D => targetRef.current ?? { angle: angleRef.current, tilt: tiltRef.current, zoom: zoomRef.current };
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const toLocal = (clientX: number, clientY: number): [number, number] => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return [0, 0];
    return [((clientX - r.left) * width) / r.width, ((clientY - r.top) * height) / r.height];
  };
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive || e.button !== 0) return;
    const [x, y] = toLocal(e.clientX, e.clientY);
    drag.current = { x, y, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const [x, y] = toLocal(e.clientX, e.clientY);
    move(moveCamera3d(current(), x - d.x, y - d.y));
    d.x = x;
    d.y = y;
  };
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !interactive) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      move(moveCamera3d(current(), 0, 0, Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.012 : 0.0025))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);
  const coords = space.coords.umap3d;
  const pointRefs = useRef<(SVGCircleElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);
  const queryRef = useRef<SVGGElement | null>(null);
  const angleRef = useRef(0.6);
  const highlightSet = useMemo(() => new Set(highlight), [highlight]);
  const medoids = useMemo(() => clusterMedoids(space, space.coords.umap3d), [space]);
  const n = space.json.clusters.length;
  // Centre on the centroid and fit the farthest point, whatever the layout.
  const frame = useMemo(() => {
    const c = [0, 0, 0];
    for (const p of coords) for (let d = 0; d < 3; d++) c[d]! += p[d]! / coords.length;
    let r = 0;
    for (const p of coords) r = Math.max(r, Math.hypot(p[0]! - c[0]!, p[1]! - c[1]!, p[2]! - c[2]!));
    return { c, r: r || 1 };
  }, [coords]);
  const scale = (Math.min(width, height) * 0.5) / frame.r;

  const labelled = useMemo(() => {
    const out: { index: number; text: string; kind: "cluster" | "word"; cluster: number }[] = [];
    if (clusterNames) {
      medoids.forEach((m, c) => {
        if (focus === null || focus === c) out.push({ index: m, text: tr(space.json.clusters[c]!.label, locale), kind: "cluster", cluster: c });
      });
    }
    for (const i of highlight.slice(0, 6)) out.push({ index: i, text: space.items[i]!.text, kind: "word", cluster: space.items[i]!.cluster });
    return out;
  }, [clusterNames, medoids, focus, highlight, space, locale]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const draw = () => {
      const a = angleRef.current;
      const tilt = tiltRef.current;
      const k = scale * zoomRef.current;
      const place = (p: readonly number[]) => {
        const q = project3d([p[0]! - frame.c[0]!, p[1]! - frame.c[1]!, p[2]! - frame.c[2]!], a, tilt);
        return { x: width / 2 + q.x * k, y: height / 2 - q.y * k, depth: q.depth, persp: q.persp };
      };
      coords.forEach((p, i) => {
        const el = pointRefs.current[i];
        if (!el) return;
        const q = place(p);
        el.setAttribute("cx", q.x.toFixed(1));
        el.setAttribute("cy", q.y.toFixed(1));
        el.setAttribute("r", ((highlightSet.has(i) ? 9 : 6) * q.persp).toFixed(2));
        el.style.opacity = String(Math.max(0.25, Math.min(1, 0.75 - q.depth * 0.35)) * (el.dataset.dim ? 0.3 : 1));
      });
      // Labels: nearest first; one that would overlap a nearer label is hidden
      // for this frame, so names never pile up as the cloud turns.
      const taken: { x0: number; y0: number; x1: number; y1: number }[] = [];
      labelled
        .map((l, k) => ({ l, k, q: place(coords[l.index]!) }))
        .sort((u, v) => (u.l.kind === v.l.kind ? u.q.depth - v.q.depth : u.l.kind === "word" ? -1 : 1))
        .forEach(({ l, k, q }) => {
          const el = labelRefs.current[k];
          if (!el) return;
          const size = l.kind === "cluster" ? 32 : 26;
          const y = q.y - (l.kind === "word" ? 18 : 0);
          const w = estimateWidth(l.text, size);
          const rect = { x0: q.x - w / 2, y0: y - size * 0.6, x1: q.x + w / 2, y1: y + size * 0.6 };
          const free = !taken.some((t) => rect.x0 < t.x1 && t.x0 < rect.x1 && rect.y0 < t.y1 && t.y0 < rect.y1);
          if (free) taken.push(rect);
          el.setAttribute("x", q.x.toFixed(1));
          el.setAttribute("y", y.toFixed(1));
          el.style.opacity = free ? "1" : "0";
        });
      if (queryRef.current && query) {
        const q = place(query.position);
        queryRef.current.setAttribute("transform", `translate(${q.x.toFixed(1)},${q.y.toFixed(1)})`);
      }
    };
    const tick = (t: number) => {
      const goal = targetRef.current;
      if (goal) {
        // Ease toward the camera (instantly with reduced motion).
        const e = props.reducedMotion ? 1 : 0.25;
        angleRef.current += (goal.angle - angleRef.current) * e;
        tiltRef.current += (goal.tilt - tiltRef.current) * e;
        zoomRef.current += (goal.zoom - zoomRef.current) * e;
      } else {
        tiltRef.current += (HOME.tilt - tiltRef.current) * 0.2;
        zoomRef.current += (HOME.zoom - zoomRef.current) * 0.2;
        if (spinning) angleRef.current += ((t - last) / 1000) * 0.18;
      }
      last = t;
      draw();
      raf = requestAnimationFrame(tick);
    };
    draw();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [coords, frame, width, height, scale, spinning, labelled, highlightSet, query, props.reducedMotion]);

  const dim = (i: number) =>
    query || highlightSet.size ? !highlightSet.has(i) : focus !== null ? space.items[i]!.cluster !== focus : false;

  return (
    <div className={mapStyles.box} style={{ width, height }}>
    <svg
      ref={svgRef}
      className={`${styles.map} ${interactive ? mapStyles.interactive : ""}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={locale === "fr" ? "Nuage de mots en 3D" : "3D cloud of words"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      style={{ touchAction: "none", overflow: "hidden" }}
    >
      <g>
        {space.items.map((it) => {
          const c = colored ? clusterColor(it.cluster, n) : "var(--color-text)";
          return (
            <circle
              key={it.index}
              ref={(el) => {
                pointRefs.current[it.index] = el;
              }}
              data-dim={dim(it.index) ? "1" : undefined}
              className={`${styles.point} ${highlightSet.has(it.index) ? styles.hl : ""}`}
              style={{ fill: it.lang === "en" ? "var(--color-bg)" : c, stroke: c, strokeWidth: it.lang === "fr" ? 0 : 2.5, transition: "none" }}
            />
          );
        })}
      </g>
      {query && (
        <g ref={queryRef} className={styles.query}>
          <path d="M0,-17 L4.5,-5 L17,-5 L7,3 L11,16 L0,8 L-11,16 L-7,3 L-17,-5 L-4.5,-5 Z" className={styles.queryStar} />
          <text y={-34} textAnchor="middle" fontSize={40} className={styles.queryLabel}>
            {query.text}
          </text>
        </g>
      )}
      <g>
        {labelled.map((l, k) => (
          <text
            key={`${l.kind}${l.index}`}
            ref={(el) => {
              labelRefs.current[k] = el;
            }}
            textAnchor="middle"
            fontSize={l.kind === "cluster" ? 32 : 26}
            className={l.kind === "cluster" ? styles.clusterLabel : styles.wordStrong}
            style={{
              transition: "opacity 300ms",
              ...(l.kind === "cluster" ? { fill: colored ? clusterColor(l.cluster, n) : "var(--color-text)" } : {}),
            }}
          >
            {l.text}
          </text>
        ))}
      </g>
    </svg>
      {interactive && (
        <div className={mapStyles.controls} data-keys-local="">
          <button type="button" className={mapStyles.round} onClick={() => move(moveCamera3d(current(), 0, 0, 1.4))} aria-label={tr(MAP_CONTROLS.zoomIn, locale)} title={tr(MAP_CONTROLS.zoomIn, locale)}>
            +
          </button>
          <button type="button" className={mapStyles.round} onClick={() => move(moveCamera3d(current(), 0, 0, 1 / 1.4))} aria-label={tr(MAP_CONTROLS.zoomOut, locale)} title={tr(MAP_CONTROLS.zoomOut, locale)}>
            −
          </button>
          <button type="button" className={mapStyles.reset} onClick={() => move(HOME)} disabled={!target}>
            {tr(MAP_CONTROLS.reset, locale)}
          </button>
        </div>
      )}
    </div>
  );
}
