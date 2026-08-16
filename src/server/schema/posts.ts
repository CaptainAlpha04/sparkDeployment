import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { postKindEnum, postStatusEnum } from "./enums";
import { profiles } from "./profiles";

import type { PostOutcome } from "@/lib/post-types";

export type { PostOutcome } from "@/lib/post-types";

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: postKindEnum("kind").notNull().default("article"),

    // Slugs are unique across both kinds even though they live under different
    // URL prefixes. Sharing one namespace means a piece can be reclassified
    // from article to case study without breaking every link to it.
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),

    // Derived from the body when the editor leaves it blank. Feeds the card,
    // the meta description, the RSS entry and the JSON-LD abstract, so it is
    // never allowed to be genuinely empty on a published post.
    excerpt: text("excerpt"),

    coverImageUrl: text("cover_image_url"),
    // Not optional in the UI when a cover is set. An uncaptioned hero image is
    // invisible to a screen reader and to an indexer alike.
    coverAlt: text("cover_alt"),

    /*
     * Three representations of one body, written together on every save.
     *
     * `bodyJson` is canonical: it is what the editor reloads and the only one
     * safe to edit. The other two are derived, and exist so that reading a
     * post costs no parsing. `bodyHtml` is sanitised at write time and
     * rendered directly. `bodyText` backs reading time, the generated excerpt,
     * and the plain-text variant that agents fetch.
     *
     * Never write to the derived columns from anywhere but savePostBody().
     */
    bodyJson: jsonb("body_json").$type<unknown>(),
    bodyHtml: text("body_html"),
    bodyText: text("body_text"),
    readingMinutes: integer("reading_minutes").notNull().default(1),

    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),

    status: postStatusEnum("status").notNull().default("draft"),
    // Set once, on the first transition to published, and preserved through
    // later edits. Republishing must not reorder the archive or tell readers
    // an old piece is new.
    publishedAt: timestamp("published_at", { withTimezone: true }),
    featured: boolean("featured").notNull().default(false),

    authorId: uuid("author_id").references(() => profiles.id, {
      onDelete: "set null",
    }),

    /*
     * SEO overrides. All optional by design: every one of these has a sane
     * derivation from the content, and an empty override means "derive it".
     * They exist for the rare piece that needs a different search headline
     * than its own title, not as fields anyone is expected to fill in.
     */
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    // Points at the original when a piece is syndicated from elsewhere, so we
    // do not compete with the source in the index.
    canonicalUrl: text("canonical_url"),
    noindex: boolean("noindex").notNull().default(false),

    // Case study only, null on articles.
    clientOrg: text("client_org"),
    period: text("period"),
    outcomes: jsonb("outcomes").$type<PostOutcome[]>(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // The index feed: one kind, published only, newest first.
    index("posts_kind_status_published_at_idx").on(
      t.kind,
      t.status,
      t.publishedAt,
    ),
    // Tag filtering. GIN is what makes `tags && '{x}'` an index scan rather
    // than a sequential read of every post.
    index("posts_tags_idx").using("gin", t.tags),
    uniqueIndex("posts_slug_idx").on(t.slug),
  ],
).enableRLS();

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
