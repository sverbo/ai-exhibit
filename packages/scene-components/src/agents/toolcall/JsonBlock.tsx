import { useMemo, type CSSProperties } from "react";
import { cx } from "../../learning/shared/ui.tsx";
import { INLINE_MAX, isHighlighted, jsonLines, type Json } from "./jsonLines.ts";
import styles from "./JsonBlock.module.css";

/**
 * Pretty-printed JSON with syntax colours from the theme tokens. Lines inside a
 * highlighted field are marked; the others fade while something is highlighted.
 */
export function JsonBlock({
  value,
  highlights,
  size,
  inlineMax = INLINE_MAX,
}: {
  value: Json;
  highlights: readonly string[];
  /** Font size in stage pixels (default 32). */
  size?: number;
  inlineMax?: number;
}) {
  const lines = useMemo(() => jsonLines(value, inlineMax), [value, inlineMax]);
  return (
    <pre
      className={styles.json}
      aria-label="JSON"
      style={size ? ({ "--json-size": `${size}px` } as CSSProperties) : undefined}
    >
      {lines.map((line, i) => {
        const hot = line.path !== "" && isHighlighted(line.path, highlights);
        return (
          <span key={i} className={cx(styles.line, highlights.length > 0 && (hot ? styles.hot : styles.cold))}>
            {"  ".repeat(line.depth)}
            {line.tokens.map((tok, k) => (
              <span key={k} className={styles[`t_${tok.kind}`]}>
                {tok.text}
              </span>
            ))}
            {"\n"}
          </span>
        );
      })}
    </pre>
  );
}
