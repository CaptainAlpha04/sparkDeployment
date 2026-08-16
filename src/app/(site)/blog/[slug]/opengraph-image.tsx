import { ImageResponse } from "next/og";
import { getPublishedPost } from "@/server/posts";

export const alt = "SPARK Chapter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The social card for a post with no cover image.
 *
 * A shared link with no image gets a fraction of the clicks of one with a
 * card, and "the editor did not upload a cover" should not be the reason a
 * piece goes unread. Generated rather than a single static fallback so the
 * card actually carries the headline.
 *
 * Kept to layout primitives satori supports: flex only, no grid, no shorthand
 * background, explicit display on every div.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPost(slug).catch(() => null);

  const title = post?.title ?? "SPARK Chapter";
  const kicker =
    post?.kind === "case_study" ? "Case study" : "SPARK Chapter · Writing";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#06070f",
          backgroundImage:
            "radial-gradient(circle at 78% 12%, #2a1160 0%, rgba(6,7,15,0) 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 999,
              backgroundColor: "#a855f7",
            }}
          />
          <div
            style={{
              display: "flex",
              color: "#a1a1b5",
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#ffffff",
            // Long headlines have to fit: satori does not shrink text to fit a
            // box, so the size steps down by length instead.
            fontSize: title.length > 70 ? 60 : title.length > 40 ? 74 : 88,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "#8b8ba0",
            fontSize: 26,
          }}
        >
          <div style={{ display: "flex" }}>
            {post?.authorName ?? "SPARK Chapter"}
          </div>
          <div style={{ display: "flex" }}>
            {post ? `${post.readingMinutes} min read` : "sparkchapter.com"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
