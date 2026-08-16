import { ImageResponse } from "next/og";
import { SITE_TAGLINE } from "@/lib/seo";

export const alt = "SPARK Chapter, Pakistan's student innovation community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The default social card for the whole site.
 *
 * Every page that does not generate its own falls back to this, so a link to
 * /mission or /events shared into a group chat arrives with a branded card
 * rather than a bare grey rectangle. Posts override it with their own headline
 * card; this is the floor, not the ceiling.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#06070f",
          backgroundImage:
            "radial-gradient(circle at 50% 30%, #2a1160 0%, rgba(6,7,15,0) 60%)",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#ffffff",
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: 14,
          }}
        >
          SPARK
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            color: "#a1a1b5",
            fontSize: 32,
          }}
        >
          {SITE_TAGLINE}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            width: 120,
            height: 3,
            backgroundColor: "#a855f7",
          }}
        />
      </div>
    ),
    size,
  );
}
