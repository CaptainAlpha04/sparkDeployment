import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { postPath } from "@/lib/seo";
import { cn } from "@/lib/utils";

export type CardPost = {
  kind: "article" | "case_study";
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  coverAlt: string | null;
  tags: string[];
  publishedAt: Date | null;
  readingMinutes: number;
  authorName: string | null;
  clientOrg: string | null;
};

export function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * One entry in an index.
 *
 * `featured` gives the lead item a wider, two-column treatment. The whole card
 * is one link rather than a link per element, so the target is the size of the
 * card on a phone instead of the size of the headline.
 */
export function PostCard({
  post,
  featured = false,
}: {
  post: CardPost;
  featured?: boolean;
}) {
  const date = formatDate(post.publishedAt);

  return (
    <article className={cn("group", featured && "sm:col-span-2")}>
      <Link
        href={postPath(post)}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className={cn(featured && "sm:flex sm:items-stretch")}>
          {post.coverImageUrl ? (
            <div
              className={cn(
                "relative overflow-hidden bg-muted",
                featured ? "sm:w-1/2" : "",
              )}
            >
              <Image
                src={post.coverImageUrl}
                alt={post.coverAlt ?? ""}
                width={featured ? 900 : 600}
                height={featured ? 600 : 338}
                className={cn(
                  "w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]",
                  featured ? "aspect-[4/3] sm:h-full" : "aspect-video",
                )}
                sizes={
                  featured
                    ? "(max-width: 640px) 100vw, 50vw"
                    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                }
              />
            </div>
          ) : null}

          <div
            className={cn(
              "flex flex-1 flex-col p-6",
              featured && "sm:w-1/2 sm:justify-center sm:p-9",
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {post.kind === "case_study" && (
                <Badge variant="default">Case study</Badge>
              )}
              {post.clientOrg && (
                <span className="eyebrow">{post.clientOrg}</span>
              )}
            </div>

            <h3
              className={cn(
                "font-display font-bold tracking-tight transition-colors group-hover:text-primary",
                featured ? "text-3xl sm:text-4xl" : "text-xl",
              )}
            >
              {post.title}
            </h3>

            {post.excerpt && (
              <p
                className={cn(
                  "mt-3 text-muted-foreground",
                  featured ? "line-clamp-4" : "line-clamp-3 text-sm",
                )}
              >
                {post.excerpt}
              </p>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-5 text-xs text-muted-foreground">
              {post.authorName && <span>{post.authorName}</span>}
              {post.authorName && date && <span aria-hidden>·</span>}
              {date && <time>{date}</time>}
              <span aria-hidden>·</span>
              <span>{post.readingMinutes} min</span>
              <ArrowUpRight className="ml-auto size-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
