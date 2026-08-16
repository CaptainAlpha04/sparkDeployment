import QRCode from "qrcode";

type Props = {
  /** The URL the code resolves to. */
  value: string;
  /** Rendered edge length in px. */
  size: number;
  dark?: string;
  light?: string;
  className?: string;
};

/**
 * A QR code drawn as vector SVG.
 *
 * Deliberately not a raster image. Certificates are printed, and a PNG QR
 * baked at screen resolution scans badly off paper. Drawing the modules as
 * SVG rects keeps it sharp at any size, and it is generated synchronously so
 * this stays an ordinary component that works from a server component.
 *
 * Error correction is set to M, which tolerates roughly 15% damage. That is
 * the level that survives a certificate being folded, scuffed, or photographed
 * at an angle.
 */
export function QrCode({
  value,
  size,
  dark = "#0b0b16",
  light = "#ffffff",
  className = "",
}: Props) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const data = qr.modules.data;

  // Quiet zone. The spec requires 4 modules of clear margin; without it many
  // scanners simply will not lock on.
  const margin = 4;
  const total = count + margin * 2;

  const rects: string[] = [];
  for (let y = 0; y < count; y += 1) {
    for (let x = 0; x < count; x += 1) {
      if (data[y * count + x]) {
        rects.push(`M${x + margin},${y + margin}h1v1h-1z`);
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Scan to verify this certificate"
    >
      <rect width={total} height={total} fill={light} />
      <path d={rects.join("")} fill={dark} />
    </svg>
  );
}
