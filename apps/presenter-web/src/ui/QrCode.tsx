import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR code rendered locally (no network). Dark modules on ivory for reliable scanning. */
export function QrCode({ value, size = 180, label }: { value: string; size?: number; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#110f0d", light: "#f4eee3" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(null));
    return () => {
      alive = false;
    };
  }, [value]);
  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size, borderRadius: 8, overflow: "hidden", background: "#f4eee3", flex: "none" }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
