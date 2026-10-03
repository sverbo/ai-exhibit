/** Canvas helpers shared by learning components. */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseColor(value: string, fallback: Rgb): Rgb {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const rgb = value.match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i);
  if (rgb) return { r: +rgb[1]!, g: +rgb[2]!, b: +rgb[3]! };
  return fallback;
}

export const rgba = (c: Rgb, a: number) => `rgba(${c.r},${c.g},${c.b},${a})`;

/** Theme colors read from the tokens, with the light theme as fallback (tests, SSR). Re-read on theme change. */
export interface Palette {
  bg: Rgb;
  text: Rgb;
  muted: Rgb;
  line: Rgb;
  a: Rgb;
  b: Rgb;
  danger: Rgb;
}

export function readPalette(el: Element | null): Palette {
  const s = el ? getComputedStyle(el) : null;
  const get = (name: string, fb: Rgb) => (s ? parseColor(s.getPropertyValue(name), fb) : fb);
  return {
    bg: get("--color-bg", { r: 243, g: 237, b: 226 }),
    text: get("--color-text", { r: 31, g: 26, b: 20 }),
    muted: get("--color-text-muted", { r: 92, g: 82, b: 68 }),
    line: get("--color-line", { r: 196, g: 183, b: 162 }),
    a: get("--color-accent", { r: 154, g: 82, b: 0 }),
    b: get("--color-accent-2", { r: 13, g: 111, b: 104 }),
    danger: get("--color-danger", { r: 179, g: 48, b: 30 }),
  };
}

/**
 * Matches the canvas backing store to its on-screen size (the stage is CSS-scaled,
 * so this is what keeps lines sharp on a 4K projector) and returns a 2D context
 * whose units are the canvas's logical (stage) pixels.
 */
export function prepareCanvas(
  canvas: HTMLCanvasElement,
  logicalW: number,
  logicalH: number,
): CanvasRenderingContext2D | null {
  const rect = canvas.getBoundingClientRect();
  const dpr = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 3);
  const scale = Math.max(0.25, Math.min(3, ((rect.width || logicalW) / logicalW) * dpr));
  const w = Math.round(logicalW * scale);
  const h = Math.round(logicalH * scale);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.clearRect(0, 0, logicalW, logicalH);
  return g;
}
