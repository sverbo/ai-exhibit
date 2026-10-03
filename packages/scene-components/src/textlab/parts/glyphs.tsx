import type { Sport } from "../data/text.ts";

/** A football or a basketball, drawn in currentColor (the sport's tone is set by CSS). */
export function SportGlyph({ sport, size }: { sport: Sport; size: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" style={{ flex: "none", overflow: "visible" }}>
      <SportGlyphPaths sport={sport} />
    </svg>
  );
}

/** The glyph's drawing on a 40 x 40 grid, for use inside another SVG. */
export function SportGlyphPaths({ sport }: { sport: Sport }) {
  return (
    <>
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="3" />
      {sport === "football" ? (
        <g stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
          <path d="M20 13.2l6.5 4.7-2.5 7.6h-8l-2.5-7.6z" fill="currentColor" />
          <path d="M20 13.2V3.6M26.5 17.9l9-3M24 25.5l5.6 7.6M16 25.5l-5.6 7.6M13.5 17.9l-9-3" fill="none" />
        </g>
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M20 3v34M3 20h34" />
          <path d="M8.6 7.4c5 4.2 5 21 0 25.2M31.4 7.4c-5 4.2-5 21 0 25.2" />
        </g>
      )}
    </>
  );
}

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrossIcon = () => (
  <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
  </svg>
);
