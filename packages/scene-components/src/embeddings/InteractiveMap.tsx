import type { EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import type { Locale } from "@ai-exhibit/presentation-core";
import { type KeyboardEvent, type MouseEvent, type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAP_CONTROLS, tr } from "./copy.ts";
import { MapView, type MapViewProps } from "./MapView.tsx";
import {
  type Camera,
  clampCamera,
  defaultCamera,
  frameFor,
  lerpCamera,
  panBy,
  pickPoint,
  roundCamera,
  sameCamera,
  zoomAbout,
} from "./view.ts";
import styles from "./InteractiveMap.module.css";

const PUBLISH_MS = 90;
const TWEEN_MS = 280;
const DRAG_THRESHOLD = 5;

export interface InteractiveMapProps extends Omit<MapViewProps, "camera"> {
  /** Only the controller can move the view; other roles follow `camera`. */
  interactive: boolean;
  /** Published camera (scene state); null or undefined means the whole map. */
  camera: Camera | null | undefined;
  /** Called (throttled) with the controller's camera, to publish it. */
  onCamera?: (camera: Camera) => void;
  /**
   * Data point the + button zooms toward (the selected word or the query), so
   * zooming in after picking a word keeps it in view. Default: the map centre.
   */
  zoomTarget?: readonly [number, number] | null;
  /** Toggles "show all" (labels for every word); omitted hides the button. */
  onShowAll?: (on: boolean) => void;
  /** Click on a word (index) or on empty space (null). */
  onSelect?: (index: number | null) => void;
  reducedMotion: boolean;
  /**
   * Fill the parent's width, keeping the width:height ratio (phones); `width`
   * and `height` stay the map's own units. Default: fixed stage pixels.
   */
  fluid?: boolean;
}

function useThrottled<T>(fn: ((value: T) => void) | undefined, ms: number) {
  const last = useRef(0);
  const pending = useRef<{ value: T } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return useCallback(
    (value: T) => {
      pending.current = { value };
      const run = () => {
        timer.current = null;
        last.current = Date.now();
        if (pending.current) fnRef.current?.(pending.current.value);
        pending.current = null;
      };
      const wait = ms - (Date.now() - last.current);
      if (wait <= 0) run();
      else if (!timer.current) timer.current = setTimeout(run, wait);
    },
    [ms],
  );
}

/**
 * The word map with pan and zoom. The controller drives it (wheel or pinch
 * zooms about the pointer, drag pans, double-click zooms in, +/- and reset
 * buttons, + - 0 keys while the map has focus); the camera is published so the
 * projector shows the same view, eased toward each update.
 */
export function InteractiveMap(props: InteractiveMapProps) {
  const { space, width, height, interactive, reducedMotion, locale } = props;
  const coords = space.coords[props.projection ?? "umap2d"];
  const frame = useMemo(() => frameFor(coords, width, height, 40), [coords, width, height]);
  const home = useMemo(() => defaultCamera(frame), [frame]);
  const target = useMemo(() => clampCamera(props.camera ?? home, frame), [props.camera, home, frame]);

  // What is drawn. The controller sets it directly; followers ease toward `target`.
  const [camera, setCamera] = useState<Camera>(target);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const dragging = useRef<{ x: number; y: number; moved: boolean; id: number } | null>(null);
  // Fingers on the map (touch screens): two of them pinch to zoom and pan together.
  const pointers = useRef(new Map<number, [number, number]>());
  const pinch = useRef<{ dist: number; mid: [number, number] } | null>(null);
  // Cameras this controller published recently, so their delayed echoes from
  // the session are not mistaken for a new target (which would pull the view back).
  const published = useRef<Camera[]>([]);
  const publish = useThrottled<Camera>(
    props.onCamera
      ? (c) => {
          const r = roundCamera(c);
          published.current = [...published.current.slice(-31), r];
          props.onCamera?.(r);
        }
      : undefined,
    PUBLISH_MS,
  );

  const tween = useRef(0);
  const animateTo = useCallback(
    (next: Camera, publishIt: boolean) => {
      cancelAnimationFrame(tween.current);
      const from = cameraRef.current;
      if (reducedMotion || sameCamera(from, next)) {
        setCamera(next);
        if (publishIt) publish(next);
        return;
      }
      const t0 = performance.now();
      const step = (now: number) => {
        // rAF timestamps can predate t0 by a frame: clamp so zoom never undershoots.
        const t = Math.min(1, Math.max(0, (now - t0) / TWEEN_MS));
        const e = 1 - (1 - t) ** 3;
        const c = lerpCamera(from, next, e);
        setCamera(c);
        if (publishIt) publish(t < 1 ? c : next);
        if (t < 1) tween.current = requestAnimationFrame(step);
      };
      tween.current = requestAnimationFrame(step);
    },
    [reducedMotion, publish],
  );
  useEffect(() => () => cancelAnimationFrame(tween.current), []);

  // Followers (and a controller whose state was reset) track the published camera.
  useEffect(() => {
    if (interactive && dragging.current) return;
    if (interactive && props.camera && published.current.some((c) => sameCamera(c, target, 1e-3))) return;
    if (!sameCamera(cameraRef.current, target)) animateTo(target, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.u, target.v, target.k, props.camera == null]);

  const setNow = (next: Camera) => {
    cancelAnimationFrame(tween.current);
    setCamera(next);
    publish(next);
  };

  // Pointer position in stage pixels, whatever the CSS scale of the stage.
  const box = useRef<HTMLDivElement | null>(null);
  const toLocal = (clientX: number, clientY: number): [number, number] => {
    const r = box.current?.getBoundingClientRect();
    if (!r || r.width === 0) return [width / 2, height / 2];
    return [((clientX - r.left) * width) / r.width, ((clientY - r.top) * height) / r.height];
  };

  // Wheel and trackpad pinch (ctrlKey wheel events) zoom about the pointer.
  // A non-passive listener is needed to stop the page from scrolling.
  useEffect(() => {
    const el = box.current;
    if (!el || !interactive) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const speed = e.ctrlKey ? 0.012 : 0.0025;
      const factor = Math.exp(-e.deltaY * unit * speed);
      const pt = toLocal(e.clientX, e.clientY);
      setNow(zoomAbout(cameraRef.current, factor, pt, frame));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, frame]);

  const pinchOf = (): { dist: number; mid: [number, number] } | null => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return null;
    return { dist: Math.max(1, Math.hypot(a[0] - b[0], a[1] - b[1])), mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive || e.button !== 0) return;
    if ((e.target as Element).closest?.("button")) return;
    cancelAnimationFrame(tween.current);
    const [x, y] = toLocal(e.clientX, e.clientY);
    pointers.current.set(e.pointerId, [x, y]);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // The pointer is already gone: nothing to capture.
    }
    if (pointers.current.size === 2) {
      // A second finger: pinch from now on, and this gesture never selects a word.
      pinch.current = pinchOf();
      dragging.current = null;
      return;
    }
    dragging.current = { x, y, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, toLocal(e.clientX, e.clientY));
    if (pinch.current) {
      const now = pinchOf();
      if (!now) return;
      const prev = pinch.current;
      const zoomed = zoomAbout(cameraRef.current, now.dist / prev.dist, now.mid, frame);
      setNow(panBy(zoomed, now.mid[0] - prev.mid[0], now.mid[1] - prev.mid[1], frame));
      pinch.current = now;
      return;
    }
    const d = dragging.current;
    if (!d || d.id !== e.pointerId) return;
    const [x, y] = toLocal(e.clientX, e.clientY);
    if (!d.moved && Math.hypot(x - d.x, y - d.y) < DRAG_THRESHOLD) return;
    d.moved = true;
    setNow(panBy(cameraRef.current, x - d.x, y - d.y, frame));
    d.x = x;
    d.y = y;
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pinch.current) {
      // Lifting one finger ends the pinch; the gesture selects nothing.
      if (pointers.current.size < 2) pinch.current = null;
      dragging.current = null;
      return;
    }
    const d = dragging.current;
    dragging.current = null;
    if (!d || d.id !== e.pointerId || d.moved) return;
    // A click without a drag selects the word under the pointer.
    const pt = toLocal(e.clientX, e.clientY);
    const hit = pickPoint(pt, coords, cameraRef.current, frame);
    props.onSelect?.(hit >= 0 ? hit : null);
  };
  const onDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!interactive || (e.target as Element).closest?.("button")) return;
    animateTo(zoomAbout(cameraRef.current, 2, toLocal(e.clientX, e.clientY), frame), true);
  };

  const centre: [number, number] = [width / 2, height / 2];
  const zoomIn = () => {
    const c = cameraRef.current;
    const t = props.zoomTarget;
    if (!t) return animateTo(zoomAbout(c, 1.6, centre, frame), true);
    // Move toward the target while zooming, so it ends up near the middle.
    animateTo(clampCamera({ u: c.u + (t[0] - c.u) * 0.7, v: c.v + (t[1] - c.v) * 0.7, k: c.k * 1.6 }, frame), true);
  };
  const zoomOut = () => animateTo(zoomAbout(cameraRef.current, 1 / 1.6, centre, frame), true);
  const reset = () => animateTo(home, true);

  // Keys while the map has focus: + and - zoom, 0 resets. Arrows, Space and
  // Page keys are left alone so they keep driving the talk.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    let handled = true;
    if (e.key === "+" || e.key === "=") zoomIn();
    else if (e.key === "-" || e.key === "_") zoomOut();
    else if (e.key === "0") reset();
    else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const zoomed = camera.k > 1.0001;
  // Labels keep clear of the zoom buttons' corner on every screen, so the
  // projector's labels match the presenter's.
  const avoid = useMemo(
    () => [...(props.avoid ?? []), { x0: width - 520, y0: height - 60, x1: width, y1: height }],
    [props.avoid, width, height],
  );
  const { interactive: _i, onCamera: _c, onSelect: _s, reducedMotion: _r, zoomTarget: _z, onShowAll: _a, fluid, ...mapProps } = props;

  return (
    <div
      ref={box}
      className={`${styles.box} ${interactive ? styles.interactive : ""} ${fluid ? styles.fluid : ""}`}
      style={fluid ? { width: "100%", aspectRatio: `${width} / ${height}` } : { width, height }}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? tr(MAP_CONTROLS.mapLabel, locale) : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={(e) => {
        pointers.current.delete(e.pointerId);
        pinch.current = null;
        dragging.current = null;
      }}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
    >
      <MapView {...mapProps} camera={camera} avoid={avoid} />
      {interactive && (
        <div className={styles.controls} data-keys-local="">
          {props.onShowAll && (
            <button type="button" className={styles.reset} aria-pressed={Boolean(props.showAll)} onClick={() => props.onShowAll?.(!props.showAll)}>
              {tr(MAP_CONTROLS.showAll, locale)}
            </button>
          )}
          <button type="button" className={styles.round} onClick={zoomIn} aria-label={tr(MAP_CONTROLS.zoomIn, locale)} title={tr(MAP_CONTROLS.zoomIn, locale)}>
            +
          </button>
          <button type="button" className={styles.round} onClick={zoomOut} disabled={!zoomed} aria-label={tr(MAP_CONTROLS.zoomOut, locale)} title={tr(MAP_CONTROLS.zoomOut, locale)}>
            −
          </button>
          <button type="button" className={styles.reset} onClick={reset} disabled={!zoomed}>
            {tr(MAP_CONTROLS.reset, locale)}
          </button>
        </div>
      )}
    </div>
  );
}
