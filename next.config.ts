import type { NextConfig } from "next";

/**
 * Supabase Storage serves event covers, avatars, and certificate artwork.
 * next/image refuses remote hosts that are not allow-listed, so the project
 * hostname is derived from the public URL rather than hardcoded — that keeps
 * dev, preview, and production working from the same config.
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Images are already downscaled and WebP-encoded in the browser before
    // upload, so these widths exist to serve small screens a small file, not
    // to rescue a 4 MB original. AVIF first: consistently smaller than WebP at
    // the same perceived quality.
    formats: ["image/avif", "image/webp"],
  },

  async rewrites() {
    return [
      // Plain text variants of every post, for LLM agents and curl.
      //
      // A folder cannot be named `[slug].md` — Next only reads a dynamic
      // segment when the brackets wrap the whole segment — so the handler
      // lives at /blog/<slug>/markdown and this maps the pretty extension
      // onto it. The extension is what actually gets advertised, in the page
      // metadata and in llms.txt, because that is what an agent looks for.
      {
        source: "/blog/:slug(.+).md",
        destination: "/blog/:slug/markdown",
      },
      {
        source: "/case-studies/:slug(.+).md",
        destination: "/case-studies/:slug/markdown",
      },
    ];
  },

  async headers() {
    return [
      {
        // Agents and feed readers fetch these cross-origin. Without CORS a
        // browser-based agent gets an opaque failure rather than the file.
        source: "/:path(llms.txt|sitemap.xml)",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
