import QRCode from "qrcode";

/**
 * Address of the audience glossary: `ctx.glossaryUrl` (the LAN address under
 * `pnpm dev`) when known, else this page's own origin (a deployment).
 */
export function resolveGlossaryUrl(glossaryUrl: string | null, origin: string | null): string | null {
  if (glossaryUrl) return glossaryUrl;
  return origin ? `${origin}/glossary` : null;
}

/** QR modules as one SVG path (1 unit per module), computed locally: no network. */
export function qrPath(value: string): { size: number; d: string } {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const { size, data } = qr.modules;
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y * size + x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { size, d };
}
