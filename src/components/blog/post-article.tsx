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

  return (
    <article className="pb-24">
      {/* Header ------------------------------------------------------- */}
      <header className="mx-auto max-w-3xl px-6 pt-32 pb-10">
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
      </header>

      {/* Cover -------------------------------------------------------- */}
      {post.coverImageUrl && (
        <figure className="mx-auto mb-14 max-w-5xl px-6">
          <Image
            src={post.coverImageUrl}
            alt={post.coverAlt ?? ""}
            width={1600}
            height={900}
            // The one image guaranteed to be in the first viewport, so it is
            // the only one worth preloading.
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="aspect-video w-full rounded-3xl object-cover"
          />
        </figure>
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
