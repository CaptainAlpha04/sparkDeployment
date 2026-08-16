import { getPublishedPost } from "@/server/posts";
import { markdownResponse, postToMarkdown } from "@/lib/post-markdown";

/**
 * The markdown representation of an article.
 *
 * Reachable as /blog/<slug>.md, which is rewritten to this route in
 * next.config.ts. The pretty extension is what gets advertised in the page's
 * `alternates` metadata and in llms.txt, because an agent looking for a text
 * variant looks for an extension.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPublishedPost(slug).catch(() => null);

  if (!post || post.kind !== "article") {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return markdownResponse(postToMarkdown(post));
}
