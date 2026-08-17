/**
 * The SPARK glyph, as raw geometry.
 *
 * Kept here rather than in the component because the icon routes are Server
 * Components and spark-mark.tsx is marked "use client". Importing a constant
 * across that boundary works today but pulls a client module into a server
 * graph for no reason; the path is data, so it belongs somewhere neutral.
 */

/** Eight-point burst. Authored against this viewBox — do not rescale by hand. */
export const SPARK_VIEWBOX = "0 0 92.41 97.5";
export const SPARK_WIDTH = 92.41;
export const SPARK_HEIGHT = 97.5;

export const SPARK_PATH =
  "M39.59,41.44,21.44,31.32,14.4,17,27,24.51l1.48.88ZM16,44.28l-1.68.37L0,47.76l14.92,5.65,20.17-5Zm57.32,0-1.68.37L57.32,47.76l14.92,5.65,20.17-5ZM68.62,64.82,67.12,64,54.35,56.78l7.39,14.14,18.39,9.67ZM50.06,76.32,46.28,60.37,41.54,77.76q2,9.87,4,19.74Q47.79,86.91,50.06,76.32Zm1.08-60.38L47.35,0,42.62,17.39q2,9.87,4,19.74Q48.87,26.54,51.14,15.94ZM13.07,79.42l18.39-9.67,7.39-14.14L26.08,62.8l-1.51.85ZM53.29,42,71.44,31.85l7-14.32L65.88,25.05l-1.48.88Z";

/** Page background, and the ground the icons are drawn on. */
export const BRAND_VOID = "#06070f";
export const BRAND_NEBULA = "#a855f7";
export const BRAND_EMBER = "#f59e0b";

/**
 * The mark as a standalone SVG document, centred on a square.
 *
 * Used by the favicon route and, base64 encoded, by the Apple touch icon,
 * which has to be a raster and so renders this through next/og.
 */
export function sparkIconSvg({
  size = 120,
  padding = 0.18,
  background = BRAND_VOID,
  rounded = true,
}: {
  size?: number;
  padding?: number;
  background?: string;
  rounded?: boolean;
} = {}): string {
  // Scale the glyph to fit the padded box, then centre it. Done in the
  // transform rather than by editing coordinates so the path stays canonical.
  const inner = size * (1 - padding * 2);
  const scale = inner / Math.max(SPARK_WIDTH, SPARK_HEIGHT);
  const x = (size - SPARK_WIDTH * scale) / 2;
  const y = (size - SPARK_HEIGHT * scale) / 2;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    "<defs>",
    `<linearGradient id="s" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${BRAND_NEBULA}"/>`,
    `<stop offset="1" stop-color="${BRAND_EMBER}"/>`,
    "</linearGradient>",
    "</defs>",
    `<rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="${background}"/>`,
    `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})">`,
    `<path d="${SPARK_PATH}" fill="url(#s)"/>`,
    "</g>",
    "</svg>",
  ].join("");
}
