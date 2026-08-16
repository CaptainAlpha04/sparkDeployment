import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listPublishedPosts, listPublishedTags } from "@/server/posts";
import { PostCard } from "@/components/blog/post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo";
import { Stagger } from "@/components/motion/reveal";

export async function generateMetadata({
  params,
}: PageProps<"/blog/tag/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const label = decodeURIComponent(tag);
  const title = `${label} · Writing`;
  const description = `Everything SPARK has published about ${label}.`;

  return {
    title,
    description,
    alternates: { canonical: `/blog/tag/${encodeURIComponent(label)}` },
    openGraph: { title, description },
  };
}

/**
 * A tag index.
 *
 * Left indexable rather than noindexed. The usual argument against indexing
 * tag pages is thin-content duplication, which applies to a site auto-tagging
 * hundreds of posts; here tags are typed by hand, there are few of them, and
 * each is a genuine subject someone might search for.
 */
export default async function TagPage({ params }: PageProps<"/blog/tag/[tag]">) {
  const { tag } = await params;
  const label = decodeURIComponent(tag);

  const [posts, allTags] = await Promise.all([
    listPublishedPosts({ tag: label, limit: 48 }),
    listPublishedTags(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-32 pb-24">
      <JsonLd
        data={[
          collectionJsonLd({
            name: `${label} · SPARK Chapter`,
            description: `Everything SPARK has published about ${label}.`,
            path: `/blog/tag/${encodeURIComponent(label)}`,
            items: posts,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Writing", path: "/blog" },
            { name: label, path: `/blog/tag/${encodeURIComponent(label)}` },
          ]),
        ]}
      />

      <Link
        href="/blog"
        className="eyebrow mb-8 inline-flex items-center gap-2 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All writing
      </Link>

      <h1 className="text-7xl font-bold tracking-tight">{label}</h1>
      <p className="mt-4 text-muted-foreground">
        {posts.length} {posts.length === 1 ? "piece" : "pieces"}
      </p>

      {posts.length === 0 ? (
        <div className="mt-16">
          <p className="text-muted-foreground">
            Nothing under this tag yet. These have something:
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {allTags.slice(0, 12).map((other) => (
              <Link
                key={other.tag}
                href={`/blog/tag/${encodeURIComponent(other.tag)}`}
                className="text-sm text-primary hover:underline"
              >
                {other.tag}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Stagger
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          itemClassName="h-full"
        >
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </Stagger>
      )}
    </main>
  );
}
