import { ImageResponse } from "next/og";
import { sparkIconSvg } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * The iOS home-screen icon.
 *
 * Rasterised rather than served as SVG because Safari ignores SVG for
 * apple-touch-icon, and an iPhone that cannot find one falls back to a
 * screenshot of the page — which, on a dark site, is an unreadable grey
 * rectangle.
 *
 * Square with no rounding: iOS applies its own mask, and a pre-rounded icon
 * gets rounded twice and ends up with pale corners.
 */
export default function AppleIcon() {
  const svg = sparkIconSvg({ size: 180, padding: 0.16, rounded: false });
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} width={180} height={180} alt="" />
      </div>
    ),
    size,
  );
}
