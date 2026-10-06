import type { EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import type { Locale } from "@ai-exhibit/presentation-core";
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { MAP_CONTROLS, tr } from "./copy.ts";
import type { Camera3D } from "./search.ts";
import mapStyles from "./InteractiveMap.module.css";
import { clusterColor } from "./data.ts";
import { estimateWidth, keepFree, type Rect } from "./labels.ts";
import { clusterMedoids } from "./MapView.tsx";
import { trainingPosition3d, WOBBLE_3D } from "./motion.ts";
import styles from "./MapView.module.css";

export interface Cloud3DProps {
  space: EmbeddingSpace;
  locale: Locale;
  width: number;
  height: number;
  colored: boolean;
  clusterNames: boolean;
  /** One group, several groups, or null: other groups are dimmed. */
  focus?: number | readonly number[] | null;
  highlight?: readonly number[];
  /** Whether highlighted words dim every other dot (default true). */
  dimOthers?: boolean;
  /** Label every word: as many as fit, nearest first, without overlapping. */
  showAll?: boolean;
  /** Toggles `showAll` from a button beside the zoom buttons; omitted hides it. */
  onShowAll?: (on: boolean) => void;
  /** Screen areas (map units) that labels keep clear of, e.g. a card drawn over the cloud. */
  avoid?: readonly Rect[];
  /**
   * The training animation: dots travel from `from` (cloud units) to their
   * real place as `progress()` goes from 0 to 1. Read on every frame, so the
   * parent's clock drives it without a render; at 1 the cloud is the real one.
   */
  morph?: { from: readonly (readonly number[])[]; progress: () => number };
  query?: { text: string; position: [number, number, number] } | null;
  /**
   * Two words (both in `highlight`) shown as a pair: a dashed ring around them,
   * a line between them, a note above or below the ring, and their names side
   * by side (each on its outer side). Keep the object stable between renders.
   */
  pair?: { a: number; b: number; note: string } | null;
  /** Rotation stops (and stays at a fixed angle) when false. */
  spinning: boolean;
  /** Snap instead of easing toward the camera. */
  reducedMotion?: boolean;
  /** Controller: drag to rotate, wheel or pinch to zoom, buttons to zoom and reset. */
  interactive?: boolean;
  /** Published rotation and zoom; null until the presenter moves the cloud. */
  camera?: Camera3D | null;
  onCamera?: (camera: Camera3D) => void;
  /** A tap (no drag) on a word (index) or on empty space (null). */
  onSelect?: (index: number | null) => void;
  /** Fill the parent's width, keeping the width:height ratio (phones). */
  fluid?: boolean;
  /**
   * Framing: the cloud's radius as a share of the box's smaller side (default
   * 0.5), and how far below the middle its centre sits (map units, default 0).
   * Seen from above, the near side of the cloud reaches higher than the far
   * side reaches low: a short box gives it a little less size and more room on top.
   */
  fit?: { size: number; down: number };
}

/** Pointer travel (map units) under which a press is a tap, not a drag. */
const TAP_SLOP = 6;
/** How far from a dot (map units) a tap still picks it: a fingertip, not a mouse. */
const PICK_RADIUS = 34;

export const TILT_RANGE: [number, number] = [-0.4, 1.3];
export const ZOOM_RANGE: [number, number] = [0.6, 5];
const HOME: Camera3D = { angle: 0.6, tilt: 0.35, zoom: 1 };

/** Label sizes (map units) and how far above its dot each kind sits (the pair's note sits off its ring). */
const LABEL_SIZE = { strong: 26, cluster: 32, note: 28, word: 22 } as const;
const LABEL_LIFT = { strong: 18, cluster: 0, note: 0, word: 15 } as const;
/** A highlighted word's second place, below its dot. */
const LABEL_BELOW = 26;
/** A paired word's name beside its dot: the gap between the dot and the name. */
const PAIR_SIDE_GAP = 16;
/** The pair's ring: at least this radius, else this much beyond the two dots. */
const RING_MIN = 34;
const RING_PAD = 24;
/** Gap between the ring and its note. */
const NOTE_GAP = 22;
/** The searched text, above its star. */
const QUERY_SIZE = 40;
const QUERY_LIFT = 34;
const LABEL_FADE_MS = 300;
/** A stable empty highlight, so a render without one keeps the frame loop running. */
const NONE: readonly number[] = [];
/** With every word labelled, group names give way to words from this zoom on. */
export const NAMES_MAX_ZOOM = 2;

interface Label {
  index: number;
  text: string;
  /** "strong": a highlighted word; "note": the pair's note; "word": any other word ("show all"). */
  kind: "strong" | "cluster" | "note" | "word";
  cluster: number;
  size: number;
  /** Estimated width, measured once. */
  w: number;
}

/** Centre (centroid) and radius (farthest point) of a 3D layout: the cloud is framed on them. */
export function cloudFrame(coords: readonly (readonly number[])[]): { c: number[]; r: number } {
  const c = [0, 0, 0];
  for (const p of coords) for (let d = 0; d < 3; d++) c[d]! += p[d]! / coords.length;
  let r = 0;
  for (const p of coords) r = Math.max(r, Math.hypot(p[0]! - c[0]!, p[1]! - c[1]!, p[2]! - c[2]!));
  return { c, r: r || 1 };
}

/**
 * Label draw order for one frame: highlighted words, then group names, then
 * the pair's note, then the other words, nearest first within each kind.
 */
export function labelOrder(kinds: readonly Label["kind"][], depths: ArrayLike<number>): number[] {
  const rank = (k: Label["kind"]) => (k === "strong" ? 0 : k === "cluster" ? 1 : k === "note" ? 2 : 3);
  return kinds.map((_, i) => i).sort((u, v) => rank(kinds[u]!) - rank(kinds[v]!) || depths[u]! - depths[v]!);
}

/** Applies a drag (dx, dy in pixels) and a zoom factor to a 3D camera, within limits. */
export function moveCamera3d(c: Camera3D, dx: number, dy: number, zoomFactor = 1): Camera3D {
  return {
    angle: c.angle + dx * 0.008,
    tilt: Math.min(TILT_RANGE[1], Math.max(TILT_RANGE[0], c.tilt + dy * 0.006)),
    zoom: Math.min(ZOOM_RANGE[1], Math.max(ZOOM_RANGE[0], c.zoom * zoomFactor)),
  };
}

/**
 * Where a paired word's name goes, best first: on its outer side (left for the
 * dot on the left, right for the other), so the two names read side by side,
 * then above, below, and the inner side. Offsets of the label's centre from the dot.
 */
export function pairPlaces(x: number, otherX: number, first: boolean, w: number): [number, number][] {
  const side = x < otherX || (x === otherX && first) ? -1 : 1;
  const dx = w / 2 + PAIR_SIDE_GAP;
  return [
    [side * dx, 0],
    [0, -LABEL_LIFT.strong],
    [0, LABEL_BELOW],
    [-side * dx, 0],
  ];
}

/** The pair's ring around two dots (map units): centred between them, never smaller than RING_MIN. */
export function pairRing(ax: number, ay: number, bx: number, by: number): { x: number; y: number; r: number } {
  return { x: (ax + bx) / 2, y: (ay + by) / 2, r: Math.max(RING_MIN, Math.hypot(bx - ax, by - ay) / 2 + RING_PAD) };
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
 * each frame (no React render per frame), so 400+ points stay smooth; a still
 * cloud is not redrawn. Drag turns it, a second finger (or the wheel) zooms,
 * a tap picks the nearest word.
 */
export function Cloud3D(props: Cloud3DProps) {
  const { space, width, height, colored, clusterNames, focus = null, highlight = NONE, query = null, pair = null, locale } = props;
  const interactive = Boolean(props.interactive);
  // Where the camera is heading: the controller's own moves, or the published camera.
  const [local, setLocal] = useState<Camera3D | null>(null);
  // Cameras this window published, so their echoes from the session are ignored.
  const published = useRef<Camera3D[]>([]);
  useEffect(() => {
    if (!props.camera) {
      setLocal(null);
      return;
    }
    // Several windows may turn the cloud (interaction from any window): an
    // interactive window follows a camera published by another one, unless it
    // is being dragged here or the camera is its own echo.
    if (!interactive || drag.current) return;
    const c = props.camera;
    if (published.current.some((p) => p.angle === c.angle && p.tilt === c.tilt && p.zoom === c.zoom)) return;
    setLocal(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.camera]);
  const target = interactive ? local : (props.camera ?? null);
  // The frame loop reads the camera from this ref. Moves write it at once; React
  // state follows at most a few times a second, so a render never pulls it back.
  const targetRef = useRef(target);
  const seenTarget = useRef(target);
  if (target !== seenTarget.current) {
    seenTarget.current = target;
    targetRef.current = target;
  }
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (renderTimer.current) clearTimeout(renderTimer.current);
  }, []);
  // Turns on its own until someone moves it.
  const spinning = props.spinning && !target;
  const tiltRef = useRef(HOME.tilt);
  const zoomRef = useRef(HOME.zoom);
  const lastPublish = useRef(0);
  const move = (next: Camera3D) => {
    targetRef.current = next;
    if (!renderTimer.current) {
      renderTimer.current = setTimeout(
        () => {
          renderTimer.current = null;
          if (targetRef.current) setLocal(targetRef.current);
        },
        local ? 150 : 0,
      );
    }
    const publish = () => {
      published.current = [...published.current.slice(-31), next];
      props.onCamera?.(next);
    };
    const now = Date.now();
    if (now - lastPublish.current > 80) {
      lastPublish.current = now;
      publish();
    } else {
      setTimeout(() => {
        if (targetRef.current === next) publish();
      }, 90);
    }
  };
  const current = (): Camera3D => targetRef.current ?? { angle: angleRef.current, tilt: tiltRef.current, zoom: zoomRef.current };
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ x: number; y: number; id: number; moved: boolean } | null>(null);
  // Fingers on the cloud: two of them pinch to zoom.
  const pointers = useRef(new Map<number, [number, number]>());
  const pinch = useRef<number | null>(null);
  const spread = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.max(1, Math.hypot(a[0] - b[0], a[1] - b[1])) : null;
  };
  // Where each dot was last drawn (map units), for picking a word with a tap.
  const screen = useRef<Float32Array>(new Float32Array(0));
  const toLocal = (clientX: number, clientY: number): [number, number] => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return [0, 0];
    return [((clientX - r.left) * width) / r.width, ((clientY - r.top) * height) / r.height];
  };
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive || e.button !== 0) return;
    const [x, y] = toLocal(e.clientX, e.clientY);
    pointers.current.set(e.pointerId, [x, y]);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // The pointer is already gone: nothing to capture.
    }
    if (pointers.current.size === 2) {
      // A second finger: pinch from now on, and this gesture picks nothing.
      pinch.current = spread();
      drag.current = null;
      return;
    }
    drag.current = { x, y, id: e.pointerId, moved: false };
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, toLocal(e.clientX, e.clientY));
    if (pinch.current) {
      const now = spread();
      if (!now) return;
      move(moveCamera3d(current(), 0, 0, now / pinch.current));
      pinch.current = now;
      return;
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const [x, y] = toLocal(e.clientX, e.clientY);
    if (!d.moved && Math.hypot(x - d.x, y - d.y) < TAP_SLOP) return;
    d.moved = true;
    move(moveCamera3d(current(), x - d.x, y - d.y));
    d.x = x;
    d.y = y;
  };
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pinch.current) {
      if (pointers.current.size < 2) pinch.current = null;
      drag.current = null;
      return;
    }
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || d.moved || !props.onSelect) return;
    // A tap: the nearest dot within a fingertip, else empty space.
    const [x, y] = toLocal(e.clientX, e.clientY);
    const pts = screen.current;
    let best = -1;
    let bestDist = PICK_RADIUS;
    for (let i = 0; i * 2 < pts.length; i++) {
      const dist = Math.hypot(pts[i * 2]! - x, pts[i * 2 + 1]! - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    props.onSelect(best >= 0 ? best : null);
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
  const ringRef = useRef<SVGCircleElement | null>(null);
  const pairLineRef = useRef<SVGLineElement | null>(null);
  const angleRef = useRef(0.6);
  const highlightSet = useMemo(() => new Set(highlight), [highlight]);
  const focusKey = focus === null ? "" : typeof focus === "number" ? String(focus) : focus.join(",");
  const focusSet = useMemo(() => (focusKey ? new Set(focusKey.split(",").map(Number)) : null), [focusKey]);
  const medoids = useMemo(() => clusterMedoids(space, space.coords.umap3d), [space]);
  const n = space.json.clusters.length;
  // Centre on the centroid and fit the farthest point, whatever the layout.
  const frame = useMemo(() => cloudFrame(coords), [coords]);
  const scale = (Math.min(width, height) * (props.fit?.size ?? 0.5)) / frame.r;
  const down = props.fit?.down ?? 0;
  // Read by the frame loop, so a new value never restarts it.
  const morphRef = useRef(props.morph);
  morphRef.current = props.morph;
  // Labels keep clear of the buttons' corner on every screen (as on the 2D
  // map), so the projector's labels match the presenter's.
  const avoid = useMemo(
    () => [...(props.avoid ?? []), { x0: width - 520, y0: height - 60, x1: width, y1: height }],
    [props.avoid, width, height],
  );
  const avoidRef = useRef(avoid);
  avoidRef.current = avoid;
  const showAll = Boolean(props.showAll);

  const labelled = useMemo(() => {
    const out: Label[] = [];
    const add = (index: number, text: string, kind: Label["kind"], cluster: number) => {
      const size = LABEL_SIZE[kind];
      out.push({ index, text, kind, cluster, size, w: estimateWidth(text, size) });
    };
    const strong = highlight.slice(0, 6);
    for (const i of strong) add(i, space.items[i]!.text, "strong", space.items[i]!.cluster);
    if (clusterNames) {
      medoids.forEach((m, c) => {
        if (!focusSet || focusSet.has(c)) add(m, tr(space.json.clusters[c]!.label, locale), "cluster", c);
      });
    }
    if (pair) add(pair.a, pair.note, "note", space.items[pair.a]!.cluster);
    if (showAll) {
      const skip = new Set(strong);
      for (const it of space.items) if (!skip.has(it.index)) add(it.index, it.text, "word", it.cluster);
    }
    return out;
  }, [clusterNames, medoids, focusSet, highlight, space, locale, showAll, pair]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let drawn: [number, number, number, number] | null = null;
    const count = coords.length;
    if (screen.current.length !== count * 2) screen.current = new Float32Array(count * 2);
    const depth = new Float32Array(count);
    // Per label: shown or not, and when it was last hidden (it keeps following
    // its dot while it fades out, then stops being moved).
    const L = labelled.length;
    const kinds = labelled.map((l) => l.kind);
    const labelDepth = new Float32Array(L);
    const shown = new Uint8Array(L);
    const hiddenAt = new Float64Array(L);
    for (let k = 0; k < L; k++) shown[k] = labelRefs.current[k]?.style.opacity === "1" ? 1 : 0;
    const rects: (Rect | Rect[] | null)[] = new Array(L).fill(null);
    const free = new Uint8Array(L);
    // Where each label sits relative to its dot (above, below or beside it), or
    // to the pair's ring for the note.
    const offsetX = new Float32Array(L);
    const offset = Float32Array.from(labelled, (l) => -LABEL_LIFT[l.kind]);
    const draw = (now: number) => {
      const a = angleRef.current;
      const tilt = tiltRef.current;
      const k = scale * zoomRef.current;
      const morph = morphRef.current;
      const t = morph ? Math.min(1, Math.max(0, morph.progress())) : 1;
      // A still cloud is not redrawn: nothing for a phone to do between moves.
      if (drawn && Math.abs(drawn[0] - a) < 1e-5 && Math.abs(drawn[1] - tilt) < 1e-5 && Math.abs(drawn[2] - k) < 1e-5 && drawn[3] === t) return;
      drawn = [a, tilt, k, t];
      const place = (p: readonly number[]) => {
        const q = project3d([p[0]! - frame.c[0]!, p[1]! - frame.c[1]!, p[2]! - frame.c[2]!], a, tilt);
        return { x: width / 2 + q.x * k, y: height / 2 + down - q.y * k, depth: q.depth, persp: q.persp };
      };
      const wobble = frame.r * WOBBLE_3D;
      for (let i = 0; i < count; i++) {
        const from = morph && t < 1 ? morph.from[i] : undefined;
        const q = place(from ? trainingPosition3d(from, coords[i]!, i, t, wobble) : coords[i]!);
        screen.current[i * 2] = q.x;
        screen.current[i * 2 + 1] = q.y;
        depth[i] = q.depth;
        const el = pointRefs.current[i];
        if (!el) continue;
        el.setAttribute("cx", q.x.toFixed(1));
        el.setAttribute("cy", q.y.toFixed(1));
        el.setAttribute("r", ((highlightSet.has(i) ? 9 : 6) * q.persp).toFixed(2));
        el.style.opacity = String(Math.max(0.25, Math.min(1, 0.75 - q.depth * 0.35)) * (el.dataset.dim ? 0.3 : 1));
      }
      // Labels in labelOrder: a label that would overlap one kept before it is
      // hidden for this frame, so names never pile up as the cloud turns, and
      // more words appear as it is zoomed in.
      const namesOff = showAll && zoomRef.current >= NAMES_MAX_ZOOM;
      const sx = (i: number) => screen.current[i * 2]!;
      const sy = (i: number) => screen.current[i * 2 + 1]!;
      const ring = pair ? pairRing(sx(pair.a), sy(pair.a), sx(pair.b), sy(pair.b)) : null;
      // Where each label is anchored: its dot, or the ring's centre for the note.
      const anchorX = (l: Label) => (l.kind === "note" && ring ? ring.x : sx(l.index));
      const anchorY = (l: Label) => (l.kind === "note" && ring ? ring.y : sy(l.index));
      for (let j = 0; j < L; j++) labelDepth[j] = depth[labelled[j]!.index]!;
      const order = labelOrder(kinds, labelDepth);
      for (let j = 0; j < L; j++) {
        const l = labelled[order[j]!]!;
        const x = anchorX(l);
        const y = anchorY(l);
        const h = l.size * 0.6;
        const at = (dx: number, dy: number): Rect | null => {
          // A label that would be cut by the edge waits until it fits.
          const r = { x0: x + dx - l.w / 2, y0: y + dy - h, x1: x + dx + l.w / 2, y1: y + dy + h };
          return r.x0 < 0 || r.x1 > width || r.y0 < 0 || r.y1 > height ? null : r;
        };
        const places = (offsets: [number, number][]) => offsets.map(([dx, dy]) => at(dx, dy)).filter((r): r is Rect => r !== null);
        if (namesOff && l.kind === "cluster") rects[j] = null;
        else if (l.kind === "note") {
          // Above the ring, else below, either one slid sideways, else beside it.
          const up = ring ? -ring.r - NOTE_GAP : 0;
          const side = ring ? ring.r + NOTE_GAP + l.w / 2 : 0;
          const slide = l.w / 2;
          rects[j] = ring
            ? places([[0, up], [0, -up], [-slide, up], [slide, up], [-slide, -up], [slide, -up], [side, 0], [-side, 0]])
            : null;
        }
        // The pair's names sit side by side, each on its outer side.
        else if (l.kind === "strong" && pair && (l.index === pair.a || l.index === pair.b)) {
          const other = l.index === pair.a ? pair.b : pair.a;
          rects[j] = places(pairPlaces(x, sx(other), l.index === pair.a, l.w));
        }
        // A highlighted word may also sit below its dot, so a translation
        // landing on the same spot ("chat" and "cat") keeps both names.
        else if (l.kind === "strong") rects[j] = places([[0, -LABEL_LIFT.strong], [0, LABEL_BELOW]]);
        // A group name may slide a line up or down (as on the 2D map), so two
        // groups side by side (countries and capitals) keep both names.
        else if (l.kind === "cluster") rects[j] = places([[0, 0], [0, -l.size * 1.1], [0, l.size * 1.1]]);
        else rects[j] = at(0, -LABEL_LIFT[l.kind]);
      }
      // The query's star and its name are drawn over everything: words keep clear of them.
      const q = query ? place(query.position) : null;
      const qw = query ? estimateWidth(query.text, QUERY_SIZE) : 0;
      const obstacles = q
        ? [
            ...avoidRef.current,
            { x0: q.x - 18, y0: q.y - 18, x1: q.x + 18, y1: q.y + 18 },
            { x0: q.x - qw / 2, y0: q.y - QUERY_LIFT - QUERY_SIZE * 0.6, x1: q.x + qw / 2, y1: q.y - QUERY_LIFT + QUERY_SIZE * 0.6 },
          ]
        : avoidRef.current;
      keepFree(rects, obstacles, free);
      for (let j = 0; j < L; j++) {
        const kk = order[j]!;
        const el = labelRefs.current[kk];
        if (!el) continue;
        const l = labelled[kk]!;
        const on = free[j]! > 0;
        if (on) {
          const r = rects[j]!;
          const placed = Array.isArray(r) ? r[free[j]! - 1]! : (r as Rect);
          offsetX[kk] = (placed.x0 + placed.x1) / 2 - anchorX(l);
          offset[kk] = (placed.y0 + placed.y1) / 2 - anchorY(l);
        }
        if (on !== (shown[kk] === 1)) {
          shown[kk] = on ? 1 : 0;
          if (!on) hiddenAt[kk] = now;
          el.style.opacity = on ? "1" : "0";
        }
        // Faded-out labels are not moved: most of them, with every word labelled.
        if (!on && now - hiddenAt[kk]! > LABEL_FADE_MS) continue;
        el.setAttribute("x", (anchorX(l) + offsetX[kk]!).toFixed(1));
        el.setAttribute("y", (anchorY(l) + offset[kk]!).toFixed(1));
      }
      if (queryRef.current && q) queryRef.current.setAttribute("transform", `translate(${q.x.toFixed(1)},${q.y.toFixed(1)})`);
      if (ring && pair && ringRef.current && pairLineRef.current) {
        ringRef.current.setAttribute("cx", ring.x.toFixed(1));
        ringRef.current.setAttribute("cy", ring.y.toFixed(1));
        ringRef.current.setAttribute("r", ring.r.toFixed(1));
        const line = pairLineRef.current;
        line.setAttribute("x1", sx(pair.a).toFixed(1));
        line.setAttribute("y1", sy(pair.a).toFixed(1));
        line.setAttribute("x2", sx(pair.b).toFixed(1));
        line.setAttribute("y2", sy(pair.b).toFixed(1));
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
      draw(t);
      raf = requestAnimationFrame(tick);
    };
    draw(performance.now());
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [coords, frame, width, height, scale, down, spinning, labelled, highlightSet, query, pair, props.reducedMotion, showAll]);

  const dim = (i: number) => {
    if (query) return !highlightSet.has(i);
    if (focusSet) return !focusSet.has(space.items[i]!.cluster) && !highlightSet.has(i);
    return highlightSet.size > 0 && props.dimOthers !== false && !highlightSet.has(i);
  };

  return (
    <div
      className={`${mapStyles.box} ${props.fluid ? mapStyles.fluid : ""}`}
      style={props.fluid ? { width: "100%", aspectRatio: `${width} / ${height}` } : { width, height }}
    >
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
      onPointerUp={onPointerUp}
      onPointerCancel={(e) => {
        pointers.current.delete(e.pointerId);
        pinch.current = null;
        drag.current = null;
      }}
      style={{ touchAction: "none", overflow: "hidden" }}
    >
      {pair && (
        // Behind the dots, so the two words stay on top of their own ring.
        <g className={styles.pair}>
          <line ref={pairLineRef} />
          <circle ref={ringRef} />
        </g>
      )}
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
          <text y={-QUERY_LIFT} textAnchor="middle" fontSize={QUERY_SIZE} className={styles.queryLabel}>
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
            fontSize={l.size}
            className={
              l.kind === "cluster" ? styles.clusterLabel : l.kind === "strong" ? styles.wordStrong : l.kind === "note" ? styles.pairNote : styles.word
            }
            style={{
              // The frame loop shows each label once it has a place: nothing flashes in a corner.
              opacity: 0,
              transition: `opacity ${LABEL_FADE_MS}ms`,
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
          {props.onShowAll && (
            <button type="button" className={mapStyles.reset} aria-pressed={showAll} onClick={() => props.onShowAll?.(!showAll)}>
              {tr(MAP_CONTROLS.showAll, locale)}
            </button>
          )}
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
