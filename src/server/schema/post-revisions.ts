import { pgTable, uuid, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { posts } from "./posts";
import { profiles } from "./profiles";

/**
 * Point-in-time snapshots of a post's body and headline fields.
 *
 * These are the *previous* state, written just before an update overwrites it,
 * so the newest revision is what the post looked like before the most recent
 * save — not a duplicate of the current row. Restoring is then always "take
 * revision N and write it back", with no special case for the first one.
 *
 * Snapshots are throttled rather than written on every save. Autosave fires
 * roughly every 1.5 seconds while someone is typing, and a row per keystroke
 * would be a changelog nobody can read stored in a table nobody can afford.
 * See REVISION_THROTTLE_MINUTES in posts.ts.
 *
 * Deliberately not versioned by number. A counter needs either a lock or a
 * unique constraint to stay correct under concurrent writes, and the timestamp
 * already orders them.
 */
export const postRevisions = pgTable(
  "post_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      // Cascade: a revision of a deleted post is not a record worth keeping,
      // and orphans here would grow without bound.
      .references(() => posts.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    subtitle: text("subtitle"),
    excerpt: text("excerpt"),
    bodyJson: jsonb("body_json").$type<unknown>(),
    bodyHtml: text("body_html"),
    bodyText: text("body_text"),
    coverImageUrl: text("cover_image_url"),
    coverAlt: text("cover_alt"),

    /** Cached so the history list can show a size delta without loading bodies. */
    wordCount: integer("word_count").notNull().default(0),

    /** Why this snapshot exists, e.g. "before publishing". */
    reason: text("reason"),

    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("post_revisions_post_id_created_at_idx").on(t.postId, t.createdAt)],
).enableRLS();

export type PostRevision = typeof postRevisions.$inferSelect;
export type NewPostRevision = typeof postRevisions.$inferInsert;
