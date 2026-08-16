import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, FileText, PenLine, Plus } from "lucide-react";
import { listPostsForStudio } from "@/server/posts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SparkMark } from "@/components/brand/spark-mark";

export const metadata: Metadata = {
  title: "Studio · SPARK",
  // Behind auth, but a stray link should never put a draft listing in an index.
  robots: { index: false, follow: false },
};

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function StudioPage() {
  // Grouped in the data layer: a scheduled post is a published one whose date
  // has not arrived, and working that out needs the clock, which must not be
  // read during render.
  const { drafts, scheduled, live, archived } = await listPostsForStudio();
  const total = drafts.length + scheduled.length + live.length + archived.length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/8 bg-[#0a0b12]/90 px-5 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SPARK home">
          <SparkMark className="size-5 text-primary" />
          <span className="eyebrow">Studio</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-white/70">
            <Link href="/studio/new?kind=article">
              <PenLine className="size-4" />
              New post
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/studio/new?kind=case_study">
              <Plus className="size-4" />
              New case study
            </Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight">Writing</h1>
          <p className="mt-2 text-white/50">
            {live.length} published
            {scheduled.length > 0 && `, ${scheduled.length} scheduled`}
            {`, ${drafts.length} in progress`}
          </p>
        </div>

        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
            <FileText className="mx-auto mb-4 size-8 text-white/25" />
            <p className="text-lg font-semibold">Nothing written yet</p>
            <p className="mt-1 text-sm text-white/50">
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
          <div className="space-y-10">
            <Section title="In progress" posts={drafts} />
            <Section title="Scheduled" posts={scheduled} showTime />
            <Section title="Published" posts={live} />
            <Section title="Archived" posts={archived} />
          </div>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  posts,
  showTime = false,
}: {
  title: string;
  posts: Awaited<ReturnType<typeof listPostsForStudio>>["drafts"];
  showTime?: boolean;
}) {
  if (posts.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="eyebrow">{title}</h2>
      <ul className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/studio/${post.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{post.title || "Untitled"}</p>
                <p className="mt-0.5 truncate text-xs text-white/40">
                  {post.authorName ?? "Unknown author"}
                  {post.publishedAt &&
                    ` · ${(showTime ? dateTime : dateOnly).format(post.publishedAt)}`}
                  {` · ${post.readingMinutes} min`}
                </p>
              </div>

              {showTime && (
                <CalendarClock className="size-4 shrink-0 text-amber-400" aria-hidden />
              )}
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
