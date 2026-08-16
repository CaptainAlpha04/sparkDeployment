import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { withHeadingAnchors } from "@/lib/post-html";
import { formatDate } from "@/components/blog/post-card";
import type { PostOutcome } from "@/lib/post-types";

type Props = {
  post: {
    kind: "article" | "case_study";
    title: string;
    subtitle: string | null;
    coverImageUrl: string | null;
    coverAlt: string | null;
    bodyHtml: string | null;
    tags: string[];
    publishedAt: Date | null;
    updatedAt: Date;
    readingMinutes: number;
    authorName: string | null;
    clientOrg: string | null;
    period: string | null;
    outcomes: PostOutcome[] | null;
  };
};

/**
 * The reading view, shared by both post kinds.
 *
 * Headings get their ids here rather than in the editor, from the same pass
 * that builds the contents list, so the anchors and the list they belong to
 * can never disagree.
 */
export function PostArticle({ post }: Props) {
  const { html, headings } = withHeadingAnchors(post.bodyHtml ?? "");
  const isCase = post.kind === "case_study";
  const published = formatDate(post.publishedAt);

  // Only worth the space once a piece is genuinely long enough to get lost in.
  const showContents = headings.filter((h) => h.level === 2).length >= 3;

  // The masthead, shared by both branches below so the two cannot drift.
  const masthead = (
    <>
      <Link
        href={isCase ? "/case-studies" : "/blog"}
        className="eyebrow mb-8 inline-flex items-center gap-2 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {isCase ? "Case studies" : "Writing"}
      </Link>

      {isCase && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge>Case study</Badge>
          {post.clientOrg && <span className="eyebrow">{post.clientOrg}</span>}
          {post.period && <span className="eyebrow">{post.period}</span>}
        </div>
      )}

      <h1 className="text-6xl font-bold tracking-tight">{post.title}</h1>

      {post.subtitle && (
        <p className="mt-5 text-xl leading-relaxed text-muted-foreground">
          {post.subtitle}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {post.authorName && (
          <span className="text-foreground">{post.authorName}</span>
        )}
        {published && <time dateTime={post.publishedAt?.toISOString()}>{published}</time>}
        <span aria-hidden>·</span>
        <span>{post.readingMinutes} min read</span>
      </div>
    </>
  );

  return (
    <article className="pb-24">
      {/* Masthead -----------------------------------------------------
          With a cover the image is the backdrop and the headline sits on it;
          without one the headline stands alone. Keep this in step with
          CoverCanvas in the studio, which draws the same thing so that
          choosing a cover is a decision about the finished page. */}
      {post.coverImageUrl ? (
        <header className="relative mb-14 overflow-hidden">
          <Image
            src={post.coverImageUrl}
            alt={post.coverAlt ?? ""}
            width={2000}
            height={1200}
            // The one image guaranteed to be in the first viewport, so the
            // only one worth preloading.
            priority
            sizes="100vw"
            className="absolute inset-0 size-full object-cover"
          />
          {/* Opaque where the words are, clearing upward so the photograph is
              still a photograph. Without this, light images make white text
              unreadable — and the editor cannot know what they will upload. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/25"
            aria-hidden
          />
          <div className="relative mx-auto min-h-[34rem] max-w-3xl px-6 pt-56 pb-14">
            {masthead}
          </div>
        </header>
      ) : (
        <header className="mx-auto max-w-3xl px-6 pt-32 pb-10">{masthead}</header>
      )}

      {/* Headline figures --------------------------------------------- */}
      {isCase && post.outcomes && post.outcomes.length > 0 && (
        <div className="mx-auto mb-14 max-w-3xl px-6">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
            {post.outcomes.map((outcome) => (
              <div key={outcome.label} className="bg-card px-5 py-6 text-center">
                <dt className="sr-only">{outcome.label}</dt>
                <dd>
                  <span className="block font-display text-4xl font-bold text-primary">
                    {outcome.value}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {outcome.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6">
        <div className="lg:flex lg:gap-12">
          {showContents && (
            <nav
              aria-label="On this page"
              className="mb-10 hidden shrink-0 lg:sticky lg:top-28 lg:block lg:h-fit lg:w-52"
            >
              <p className="eyebrow mb-3">On this page</p>
              <ul className="space-y-2 border-l border-border">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className={`-ml-px block border-l border-transparent text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground ${
                        heading.level === 3 ? "pl-7" : "pl-4"
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/*
            The HTML was sanitised through a strict allowlist by deriveBody()
            before it was ever stored, so what is inserted here can only
            contain the tags the editor's own schema produces. Sanitising at
            write time rather than read time means a post is safe once, not on
            every request.
          */}
          <div
            className="prose-spark min-w-0 flex-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {post.tags.length > 0 && (
        <div className="mx-auto mt-16 max-w-3xl px-6">
          <div className="flex flex-wrap gap-2 border-t border-border pt-8">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
                <Badge
                  variant="outline"
                  className="transition-colors hover:border-primary hover:text-primary"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
