import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPost, getRelatedPosts } from "@/server/posts";
import { PostArticle } from "@/components/blog/post-article";
import { PostCard } from "@/components/blog/post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, postJsonLd, postMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug).catch(() => null);

  if (!post || post.kind !== "case_study") {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  return postMetadata(post);
}

export default async function CaseStudyPage({
  params,
}: PageProps<"/case-studies/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug).catch(() => null);
  if (!post || post.kind !== "case_study") notFound();

  const related = await getRelatedPosts(post).catch(() => []);

  return (
    <main>
      <JsonLd
        data={[
          postJsonLd(post),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Case studies", path: "/case-studies" },
            { name: post.title, path: `/case-studies/${post.slug}` },
          ]),
        ]}
      />

      <PostArticle post={post} />

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="eyebrow mb-6">Read next</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PostCard key={item.slug} post={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
