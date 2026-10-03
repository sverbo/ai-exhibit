import { useCallback, useEffect, useRef, useState } from "react";

export function useFullscreen(): { isFullscreen: boolean; toggle: () => void } {
  const [isFullscreen, setIs] = useState(() => Boolean(document.fullscreenElement));
  useEffect(() => {
    const on = () => setIs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  return { isFullscreen, toggle };
}

/** True for `ms` after the last pointer movement; drives auto-hiding cursor and chrome. */
export function usePointerActivity(ms = 2000): boolean {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const onMove = () => {
      setActive(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), ms);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ms]);
  return active;
}
