import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * Crawl rules.
 *
 * AI crawlers are allowed deliberately and by name. The default posture of
 * most sites now is to block them, which is a reasonable choice for a
 * publisher selling access to its archive and the wrong one for a student
 * community whose entire problem is that nobody has heard of it. Being
 * quotable by an assistant answering "student innovation communities in
 * Pakistan" is worth more to SPARK than the text is.
 *
 * Naming them explicitly rather than relying on the wildcard matters because
 * several of these agents look for their own token before falling back, and a
 * named Allow is also a durable record of an intentional decision rather than
 * an oversight.
 */
const AI_AGENTS = [
  // Search and answer engines
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckDuckBot",
  "cohere-ai",
  "meta-externalagent",
  "Amazonbot",
  "Bytespider",
  "YouBot",
];

/** Never useful to a crawler, and in two cases actively private. */
const DISALLOWED = [
  "/admin",
  "/admin/",
  "/studio",
  "/studio/",
  "/dashboard",
  "/dashboard/",
  "/auth/",
  "/api/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
      ...AI_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOWED,
      })),
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
