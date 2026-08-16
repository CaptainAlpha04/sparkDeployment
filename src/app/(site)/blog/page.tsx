import type { Metadata } from "next";
import Link from "next/link";
import { Rss } from "lucide-react";
import { listPublishedPosts, listPublishedTags } from "@/server/posts";
import { PostCard } from "@/components/blog/post-card";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo";
import { Reveal, Stagger } from "@/components/motion/reveal";

const TITLE = "Writing";
const DESCRIPTION =
  "Essays, field notes and arguments from the people running SPARK. What we tried, what worked, and what did not.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/blog" },
};

export default async function BlogIndexPage() {
  const [posts, tags] = await Promise.all([
    listPublishedPosts({ kind: "article", limit: 48 }),
    listPublishedTags(),
  ]);

  const [lead, ...rest] = posts;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-32 pb-24">
      <JsonLd
        data={[
          collectionJsonLd({
            name: `${TITLE} · SPARK Chapter`,
            description: DESCRIPTION,
            path: "/blog",
            items: posts,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: TITLE, path: "/blog" },
          ]),
        ]}
      />

      <Reveal>
        <header className="max-w-2xl">
          <p className="eyebrow mb-4">Writing</p>
          <h1 className="text-8xl font-bold tracking-tight">
            Notes from the work
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">{DESCRIPTION}</p>

          <Link
            href="/blog/rss.xml"
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <Rss className="size-4" />
            Subscribe by RSS
          </Link>
        </header>
      </Reveal>

      {tags.length > 0 && (
        <Reveal delay={100}>
          <div className="mt-10 flex flex-wrap gap-2">
            {tags.slice(0, 14).map((tag) => (
              <Link key={tag.tag} href={`/blog/tag/${encodeURIComponent(tag.tag)}`}>
                <Badge
                  variant="outline"
                  className="transition-colors hover:border-primary hover:text-primary"
                >
                  {tag.tag}
                  <span className="ml-1.5 text-muted-foreground">{tag.count}</span>
                </Badge>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {posts.length === 0 ? (
        <p className="mt-20 text-muted-foreground">
          Nothing published yet. The first piece is on its way.
        </p>
      ) : (
        <Stagger
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          itemClassName="h-full"
        >
          {/* The newest post leads at double width. Everything after it is
              equal, because ranking the rest would be inventing importance. */}
          <PostCard post={lead} featured />
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </Stagger>
      )}
    </main>
  );
}
