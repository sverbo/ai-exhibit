import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { fitStage, STAGE_HEIGHT, STAGE_WIDTH, type StageFit } from "./scale.ts";
import styles from "./Stage.module.css";

/**
 * A fixed 1920x1080 logical canvas, CSS-scaled to fit its container and
 * centered with black bars. Children lay out in stage pixels.
 */
export function Stage({
  children,
  className,
  bars = "black",
}: {
  children: ReactNode;
  className?: string;
  /** Color of the letterbox bars. "transparent" lets the parent show through. */
  bars?: "black" | "transparent";
}) {
  const outer = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<StageFit>(() => fitStage(0, 0));

  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => setFit(fitStage(el.clientWidth, el.clientHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outer}
      className={`${styles.outer} ${bars === "black" ? styles.black : ""} ${className ?? ""}`}
    >
      <div
        className={styles.stage}
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(${fit.offsetX}px, ${fit.offsetY}px) scale(${fit.scale})`,
          visibility: fit.scale > 0 ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
