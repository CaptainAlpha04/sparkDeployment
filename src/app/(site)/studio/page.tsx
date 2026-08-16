import type { Metadata } from "next";
import Link from "next/link";
import { FileText, PenLine } from "lucide-react";
import { listAllPosts } from "@/server/posts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Studio · SPARK",
  // The studio is behind auth, but a stray link should never put a draft
  // listing into an index.
  robots: { index: false, follow: false },
};

function when(date: Date | null) {
  if (!date) return "not published";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function StudioPage() {
  const posts = await listAllPosts();

  const drafts = posts.filter((p) => p.status === "draft");
  const live = posts.filter((p) => p.status === "published");
  const archived = posts.filter((p) => p.status === "archived");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold">Writing</h1>
        <p className="mt-2 text-muted-foreground">
          {live.length} published, {drafts.length} in progress
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <FileText className="mx-auto mb-4 size-8 text-muted-foreground" />
          <p className="text-lg font-semibold">Nothing written yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The first piece is the hardest. Start anywhere.
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link href="/studio/new?kind=article">
              <PenLine className="size-4" />
              Write something
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <Section title="In progress" posts={drafts} />
          <Section title="Published" posts={live} />
          <Section title="Archived" posts={archived} />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  posts,
}: {
  title: string;
  posts: Awaited<ReturnType<typeof listAllPosts>>;
}) {
  if (posts.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="eyebrow">{title}</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card/40">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/studio/${post.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {post.title || "Untitled"}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {post.authorName ?? "Unknown author"} ·{" "}
                  {when(post.publishedAt)} · {post.readingMinutes} min
                </p>
              </div>
              {post.featured && <Badge variant="outline">Featured</Badge>}
              <Badge variant={post.kind === "case_study" ? "default" : "secondary"}>
                {post.kind === "case_study" ? "Case study" : "Article"}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
