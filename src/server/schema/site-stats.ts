import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

/**
 * Homepage "Our Impact" figures.
 *
 * These were hardcoded strings in the old build, which is how the site ended
 * up publishing numbers nobody could substantiate. Admin-editable so they can
 * be corrected as the organisation grows, with an audit trail of who last
 * touched each one.
 *
 * `value` is text, not a number, because the figures are presented with
 * suffixes ("500+"). The CountUp component parses the numeric prefix and
 * re-appends the remainder.
 */
export const siteStats = pgTable("site_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Stable identifier, e.g. "student_members". Never shown to users. */
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  position: integer("position").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  updatedBy: uuid("updated_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
}).enableRLS();

export type SiteStat = typeof siteStats.$inferSelect;
export type NewSiteStat = typeof siteStats.$inferInsert;
