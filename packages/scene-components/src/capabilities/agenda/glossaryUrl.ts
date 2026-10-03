import QRCode from "qrcode";

/**
 * Address of the audience glossary: the LAN join address with /glossary
 * instead of /join when the runtime knows it, else this page's own origin
 * (a public deployment, or no network).
 */
export function glossaryUrl(joinUrl: string | null, origin: string | null): string | null {
  if (joinUrl) return joinUrl.replace(/\/join(?=$|[?#])/, "/glossary");
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
