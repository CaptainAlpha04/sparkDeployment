import type { Metadata } from "next";
import { listPublishedPosts } from "@/server/posts";
import { PostCard } from "@/components/blog/post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo";
import { Reveal, Stagger } from "@/components/motion/reveal";

const TITLE = "Case studies";
const DESCRIPTION =
  "What actually happened when we ran something. The setup, the numbers, and the parts that did not go to plan.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/case-studies" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/case-studies" },
};

export default async function CaseStudiesPage() {
  const posts = await listPublishedPosts({ kind: "case_study", limit: 48 });

  return (
    <main className="mx-auto max-w-6xl px-6 pt-32 pb-24">
      <JsonLd
        data={[
          collectionJsonLd({
            name: `${TITLE} · SPARK Chapter`,
            description: DESCRIPTION,
            path: "/case-studies",
            items: posts,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: TITLE, path: "/case-studies" },
          ]),
        ]}
      />

      <Reveal>
        <header className="max-w-2xl">
          <p className="eyebrow mb-4">Case studies</p>
          <h1 className="text-8xl font-bold tracking-tight">
            What happened when we tried it
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">{DESCRIPTION}</p>
        </header>
      </Reveal>

      {posts.length === 0 ? (
        <p className="mt-20 text-muted-foreground">
          The first one is being written up.
        </p>
      ) : (
        <Stagger
          className="mt-14 grid gap-6 sm:grid-cols-2"
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
