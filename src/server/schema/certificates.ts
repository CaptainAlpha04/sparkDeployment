import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { events } from "./events";

import type { TemplateField } from "@/lib/certificate-types";

export type { TemplateField, TemplateFieldSource } from "@/lib/certificate-types";

export const certificateTemplates = pgTable(
  "certificate_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** Optional default event. Templates can be reused across events. */
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    backgroundUrl: text("background_url").notNull(),
    /** Intrinsic size of the background, used to preserve aspect ratio. */
    backgroundWidth: integer("background_width").notNull(),
    backgroundHeight: integer("background_height").notNull(),
    fields: jsonb("fields").$type<TemplateField[]>().notNull(),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
).enableRLS();

export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Public verification code, e.g. SPARK-A7K2-9QX4. Unguessable by design. */
    code: text("code").notNull().unique(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => certificateTemplates.id, { onDelete: "restrict" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    // Snapshots. A certificate is a historical record: if someone later edits
    // their profile name or an admin renames the event, an already-issued
    // certificate must not silently change. Verification shows what was
    // actually awarded.
    recipientName: text("recipient_name").notNull(),
    eventTitle: text("event_title").notNull(),
    eventDate: timestamp("event_date", { withTimezone: true }).notNull(),

    issuedAt: timestamp("issued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    issuedBy: uuid("issued_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    /** Non-null means revoked. Verification reports this rather than 404ing. */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedReason: text("revoked_reason"),
  },
  (t) => [
    index("certificates_user_idx").on(t.userId),
    index("certificates_event_idx").on(t.eventId),
  ],
).enableRLS();

export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type NewCertificateTemplate = typeof certificateTemplates.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
