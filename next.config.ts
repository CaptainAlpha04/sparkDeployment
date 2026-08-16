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
  },
};

export default nextConfig;
