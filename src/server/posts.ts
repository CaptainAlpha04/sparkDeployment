import { and, arrayOverlaps, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "./db";
import { posts, profiles, type Post } from "./schema";
import type { PostOutcome } from "@/lib/post-types";
import { requireEditor } from "./auth";
import { deriveBody } from "@/lib/post-html";

export type PostKind = "article" | "case_study";
export type PostStatus = "draft" | "published" | "archived";

/** A post joined to its author's display fields, which is what every view needs. */
export type PostWithAuthor = Post & {
  authorName: string | null;
  authorAvatarUrl: string | null;
};

const AUTHOR_COLUMNS = {
  authorName: profiles.fullName,
  authorAvatarUrl: profiles.avatarUrl,
};

function selectWithAuthor() {
  return db
    .select({ ...getPostColumns(), ...AUTHOR_COLUMNS })
    .from(posts)
    .leftJoin(profiles, eq(posts.authorId, profiles.id));
}

// Spelled out rather than `...posts` so adding a column to the table does not
// silently start shipping it to the client.
function getPostColumns() {
  return {
    id: posts.id,
    kind: posts.kind,
    slug: posts.slug,
    title: posts.title,
    subtitle: posts.subtitle,
    excerpt: posts.excerpt,
    coverImageUrl: posts.coverImageUrl,
    coverAlt: posts.coverAlt,
    bodyJson: posts.bodyJson,
    bodyHtml: posts.bodyHtml,
    bodyText: posts.bodyText,
    readingMinutes: posts.readingMinutes,
    tags: posts.tags,
    status: posts.status,
    publishedAt: posts.publishedAt,
    featured: posts.featured,
    authorId: posts.authorId,
    seoTitle: posts.seoTitle,
    seoDescription: posts.seoDescription,
    canonicalUrl: posts.canonicalUrl,
    noindex: posts.noindex,
    clientOrg: posts.clientOrg,
    period: posts.period,
    outcomes: posts.outcomes,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
  };
}

/* -------------------------------------------------------------------------
 * Slugs
 * ---------------------------------------------------------------------- */

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      // Keep any script's letters and numbers, not just ASCII. Titles here are
      // sometimes transliterated Urdu and stripping to [a-z0-9] would empty them.
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70)
      .replace(/-+$/g, "")
  );
}

/**
 * A slug not already taken, suffixing -2, -3 and so on.
 *
 * Checked against both kinds: slugs share one namespace so that reclassifying
 * an article as a case study never has to break its URL.
 */
export async function uniqueSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(title) || "post";
  const taken = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(
      excludeId
        ? and(ne(posts.id, excludeId), sql`${posts.slug} like ${base + "%"}`)
        : sql`${posts.slug} like ${base + "%"}`,
    );

  const set = new Set(taken.map((r) => r.slug));
  if (!set.has(base)) return base;
  for (let n = 2; n < 500; n++) {
    const candidate = `${base}-${n}`;
    if (!set.has(candidate)) return candidate;
  }
  // Practically unreachable; better than looping forever.
  return `${base}-${Date.now()}`;
}

/* -------------------------------------------------------------------------
 * Public reads
 * ---------------------------------------------------------------------- */

const isPublished = and(
  eq(posts.status, "published"),
  sql`${posts.publishedAt} is not null`,
);

export async function listPublishedPosts({
  kind,
  tag,
  limit = 24,
  offset = 0,
}: {
  kind?: PostKind;
  tag?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<PostWithAuthor[]> {
  const filters = [isPublished];
  if (kind) filters.push(eq(posts.kind, kind));
  if (tag) filters.push(arrayOverlaps(posts.tags, [tag]));

  return selectWithAuthor()
    .where(and(...filters))
    .orderBy(desc(posts.featured), desc(posts.publishedAt))
    .limit(limit)
    .offset(offset) as Promise<PostWithAuthor[]>;
}

export async function getPublishedPost(
  slug: string,
): Promise<PostWithAuthor | null> {
  const [row] = await selectWithAuthor()
    .where(and(isPublished, eq(posts.slug, slug)))
    .limit(1);
  return (row as PostWithAuthor) ?? null;
}

/**
 * Everything the sitemap, RSS feed and llms.txt need, and nothing they do not.
 *
 * Kept separate from listPublishedPosts because those callers iterate every
 * post on the site and have no use for the body, which is by far the largest
 * column.
 */
export async function listPublishedIndex(): Promise<
  Pick<
    Post,
    | "slug"
    | "kind"
    | "title"
    | "excerpt"
    | "publishedAt"
    | "updatedAt"
    | "tags"
    | "noindex"
  >[]
> {
  return db
    .select({
      slug: posts.slug,
      kind: posts.kind,
      title: posts.title,
      excerpt: posts.excerpt,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      tags: posts.tags,
      noindex: posts.noindex,
    })
    .from(posts)
    .where(isPublished)
    .orderBy(desc(posts.publishedAt));
}

/** Distinct tags across published posts, most used first. */
export async function listPublishedTags(): Promise<
  { tag: string; count: number }[]
> {
  const rows = await db.execute<{ tag: string; count: number }>(sql`
    select unnest(tags) as tag, count(*)::int as count
    from posts
    where status = 'published' and published_at is not null
    group by 1
    order by count desc, tag asc
  `);
  return [...rows];
}

/**
 * Up to `limit` other published posts, tag matches first.
 *
 * A single query rather than "try tags, then top up with recents", which would
 * cost two round trips to render a footer strip.
 */
export async function getRelatedPosts(
  post: Pick<Post, "id" | "kind" | "tags">,
  limit = 3,
): Promise<PostWithAuthor[]> {
  const sharesTag =
    post.tags.length > 0 ? arrayOverlaps(posts.tags, post.tags) : undefined;

  return selectWithAuthor()
    .where(and(isPublished, ne(posts.id, post.id)))
    .orderBy(
      // Tag matches float to the top; same-kind next; then recency.
      sharesTag ? desc(sharesTag) : desc(posts.publishedAt),
      desc(eq(posts.kind, post.kind)),
      desc(posts.publishedAt),
    )
    .limit(limit) as Promise<PostWithAuthor[]>;
}

/* -------------------------------------------------------------------------
 * Studio reads
 * ---------------------------------------------------------------------- */

export async function listAllPosts(kind?: PostKind): Promise<PostWithAuthor[]> {
  return selectWithAuthor()
    .where(kind ? eq(posts.kind, kind) : undefined)
    .orderBy(desc(posts.updatedAt)) as Promise<PostWithAuthor[]>;
}

export async function getPostById(id: string): Promise<PostWithAuthor | null> {
  const [row] = await selectWithAuthor().where(eq(posts.id, id)).limit(1);
  return (row as PostWithAuthor) ?? null;
}

/** Draft preview: any status, by slug. Studio only — never call from a public page. */
export async function getAnyPostBySlug(
  slug: string,
): Promise<PostWithAuthor | null> {
  const [row] = await selectWithAuthor().where(eq(posts.slug, slug)).limit(1);
  return (row as PostWithAuthor) ?? null;
}

export async function countPostsByStatus(): Promise<
  Record<PostStatus, number> & { total: number }
> {
  const rows = await db.execute<{ status: PostStatus; n: number }>(sql`
    select status::text as status, count(*)::int as n from posts group by 1
  `);
  const out = { draft: 0, published: 0, archived: 0, total: 0 };
  for (const r of rows) {
    out[r.status] = r.n;
    out.total += r.n;
  }
  return out;
}

/* -------------------------------------------------------------------------
 * Writes
 * ---------------------------------------------------------------------- */

export type PostInput = {
  kind: PostKind;
  title: string;
  subtitle?: string | null;
  /** Raw HTML from the editor. Sanitised here, never trusted as given. */
  bodyHtml: string;
  bodyJson: unknown;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  coverAlt?: string | null;
  tags?: string[];
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;
  clientOrg?: string | null;
  period?: string | null;
  outcomes?: PostOutcome[] | null;
};

/** Tag hygiene, applied once on the way in so reads never have to repeat it. */
function normaliseTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (tag && tag.length <= 40) seen.add(tag);
  }
  return [...seen].slice(0, 12);
}

function buildValues(input: PostInput) {
  const derived = deriveBody(input.bodyHtml);
  const excerpt = input.excerpt?.trim() || derived.excerpt;

  return {
    kind: input.kind,
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || null,
    bodyJson: input.bodyJson,
    bodyHtml: derived.html,
    bodyText: derived.text,
    readingMinutes: derived.readingMinutes,
    excerpt,
    coverImageUrl: input.coverImageUrl || null,
    coverAlt: input.coverAlt?.trim() || null,
    tags: normaliseTags(input.tags),
    featured: input.featured ?? false,
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
    canonicalUrl: input.canonicalUrl?.trim() || null,
    noindex: input.noindex ?? false,
    clientOrg: input.clientOrg?.trim() || null,
    period: input.period?.trim() || null,
    outcomes:
      input.outcomes?.filter((o) => o.label.trim() && o.value.trim()) ?? null,
  };
}

export async function createPost(input: PostInput): Promise<Post> {
  const author = await requireEditor();
  const slug = await uniqueSlug(input.title);

  const [row] = await db
    .insert(posts)
    .values({ ...buildValues(input), slug, authorId: author.id })
    .returning();

  return row;
}

export async function updatePost(id: string, input: PostInput): Promise<Post> {
  await requireEditor();

  const [row] = await db
    .update(posts)
    .set(buildValues(input))
    .where(eq(posts.id, id))
    .returning();

  if (!row) throw new Error("Post not found");
  return row;
}

/** Change the slug deliberately. Separate from updatePost because it breaks links. */
export async function setPostSlug(id: string, slug: string): Promise<Post> {
  await requireEditor();

  const clean = slugify(slug);
  if (!clean) throw new Error("That slug is empty once cleaned up");

  const [clash] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.slug, clean), ne(posts.id, id)))
    .limit(1);
  if (clash) throw new Error("Another post already uses that slug");

  const [row] = await db
    .update(posts)
    .set({ slug: clean })
    .where(eq(posts.id, id))
    .returning();
  if (!row) throw new Error("Post not found");
  return row;
}

/**
 * Publish, preserving the original publication date on republish.
 *
 * Resetting publishedAt on every edit would reorder the archive and tell
 * readers, RSS clients and search engines that an old piece is new. Fixing a
 * typo is not publishing.
 */
export async function publishPost(id: string): Promise<Post> {
  await requireEditor();

  const [row] = await db
    .update(posts)
    .set({
      status: "published",
      publishedAt: sql`coalesce(${posts.publishedAt}, now())`,
    })
    .where(eq(posts.id, id))
    .returning();

  if (!row) throw new Error("Post not found");
  return row;
}

export async function setPostStatus(
  id: string,
  status: Exclude<PostStatus, "published">,
): Promise<Post> {
  await requireEditor();

  const [row] = await db
    .update(posts)
    .set({ status })
    .where(eq(posts.id, id))
    .returning();

  if (!row) throw new Error("Post not found");
  return row;
}

export async function deletePost(id: string): Promise<void> {
  await requireEditor();
  await db.delete(posts).where(eq(posts.id, id));
}

/** Every image URL referenced by a post, for storage cleanup on delete. */
export function referencedImageUrls(post: Pick<Post, "bodyHtml" | "coverImageUrl">): string[] {
  const urls = new Set<string>();
  if (post.coverImageUrl) urls.add(post.coverImageUrl);
  for (const match of (post.bodyHtml ?? "").matchAll(/<img[^>]+src="([^"]+)"/g)) {
    urls.add(match[1]);
  }
  return [...urls];
}

/** Search across published posts, for the studio filter and the site search. */
export async function searchPublishedPosts(query: string, limit = 10) {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q}%`;
  return selectWithAuthor()
    .where(
      and(
        isPublished,
        or(
          sql`${posts.title} ilike ${pattern}`,
          sql`${posts.bodyText} ilike ${pattern}`,
        ),
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(limit) as Promise<PostWithAuthor[]>;
}
