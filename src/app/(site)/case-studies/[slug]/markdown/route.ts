import { getPublishedPost } from "@/server/posts";
import { markdownResponse, postToMarkdown } from "@/lib/post-markdown";

/** Markdown representation of a case study. Reachable as /case-studies/<slug>.md. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPublishedPost(slug).catch(() => null);

  if (!post || post.kind !== "case_study") {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return markdownResponse(postToMarkdown(post));
}
