import { listPublishedPosts } from "@/server/posts";
import { postToMarkdown } from "@/lib/post-markdown";
import { ORG_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

/**
 * /llms-full.txt — every published piece, in full, in one file.
 *
 * The companion to llms.txt: that one is a map, this one is the territory. An
 * agent that wants to answer questions about SPARK can take this in a single
 * request instead of fetching each post and reassembling them.
 *
 * Capped deliberately. An unbounded concatenation of every post ever written
 * eventually becomes a multi-megabyte response that times out and helps
 * nobody, and the cap is stated in the file itself so a consumer knows it is
 * reading a subset and where to get the rest.
 */

export const dynamic = "force-dynamic";

/** Roughly what a long context window will accept without a fight. */
const MAX_POSTS = 40;

export async function GET() {
  const posts = await listPublishedPosts({ limit: MAX_POSTS }).catch(() => []);
  const included = posts.filter((post) => !post.noindex);

  const header = [
    `# ${SITE_NAME} — full text`,
    "",
    `> ${ORG_DESCRIPTION}`,
    "",
    `This file contains the complete text of ${included.length} published`,
    `piece${included.length === 1 ? "" : "s"}, newest first. It is free to`,
    "quote with attribution to SPARK Chapter.",
    "",
    included.length >= MAX_POSTS
      ? `Only the ${MAX_POSTS} most recent are included here. The full index is at ${siteUrl()}/llms.txt`
      : `The index is at ${siteUrl()}/llms.txt`,
    "",
  ].join("\n");

  const body = included
    .map((post) => postToMarkdown(post))
    // A rule between documents so a consumer can split them without parsing
    // the front matter blocks.
    .join("\n\n<!-- ---------------------------------------- -->\n\n");

  return new Response(`${header}\n${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
