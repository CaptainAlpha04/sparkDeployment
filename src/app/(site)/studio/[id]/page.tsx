import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostById } from "@/server/posts";
import { PostComposer } from "@/components/studio/post-composer";

export const metadata: Metadata = {
  title: "Editing · SPARK Studio",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({
  params,
}: PageProps<"/studio/[id]">) {
  const { id } = await params;

  // A malformed id reaches the database as a bad uuid cast, which throws
  // rather than returning nothing. Catch it as a 404, which is what it is.
  const post = await getPostById(id).catch(() => null);
  if (!post) notFound();

  return (
    <PostComposer
      post={{
        id: post.id,
        kind: post.kind,
        slug: post.slug,
        title: post.title,
        subtitle: post.subtitle,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        coverAlt: post.coverAlt,
        bodyJson: post.bodyJson,
        bodyHtml: post.bodyHtml,
        tags: post.tags,
        status: post.status,
        // Dates cannot cross the server/client boundary as Date objects.
        publishedAt: post.publishedAt?.toISOString() ?? null,
        featured: post.featured,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        canonicalUrl: post.canonicalUrl,
        noindex: post.noindex,
        clientOrg: post.clientOrg,
        period: post.period,
        outcomes: post.outcomes,
        readingMinutes: post.readingMinutes,
      }}
    />
  );
}
