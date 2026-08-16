import { listPublishedPosts } from "@/server/posts";
import { ORG_DESCRIPTION, SITE_NAME, absoluteUrl, postPath } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

/**
 * RSS 2.0 for everything published, both articles and case studies.
 *
 * One feed rather than two: a reader who wants SPARK wants SPARK, and asking
 * them to guess which of two feeds carries the piece they heard about is a way
 * to have neither subscribed to.
 */

export const dynamic = "force-dynamic";

/**
 * XML escaping.
 *
 * Titles routinely contain ampersands and quotes, and a single unescaped `&`
 * makes the entire feed unparseable — readers fail closed, so the symptom is
 * "no posts at all" rather than one broken entry.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const base = siteUrl();
  const posts = await listPublishedPosts({ limit: 50 }).catch(() => []);
  const latest = posts[0]?.publishedAt ?? new Date();

  const items = posts
    .filter((post) => !post.noindex)
    .map((post) => {
      const url = absoluteUrl(postPath(post));
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        // isPermaLink=false: the guid is an identifier, not a second URL.
        `      <guid isPermaLink="false">${escapeXml(url)}</guid>`,
        `      <pubDate>${(post.publishedAt ?? post.createdAt).toUTCString()}</pubDate>`,
        post.excerpt
          ? `      <description>${escapeXml(post.excerpt)}</description>`
          : "",
        post.authorName
          ? `      <dc:creator>${escapeXml(post.authorName)}</dc:creator>`
          : "",
        `      <category>${escapeXml(post.kind === "case_study" ? "Case study" : "Article")}</category>`,
        ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <link>${escapeXml(base)}/blog</link>`,
    `    <description>${escapeXml(ORG_DESCRIPTION)}</description>`,
    "    <language>en</language>",
    `    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(base)}/blog/rss.xml" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
