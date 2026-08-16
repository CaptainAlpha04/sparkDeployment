import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { eventStatusEnum, questionTypeEnum } from "./enums";
import { profiles } from "./profiles";

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary"),
    description: text("description"), // markdown
    coverImageUrl: text("cover_image_url"),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    // null = unlimited capacity
    capacity: integer("capacity"),
    registrationOpensAt: timestamp("registration_opens_at", {
      withTimezone: true,
    }),
    registrationClosesAt: timestamp("registration_closes_at", {
      withTimezone: true,
    }),
    status: eventStatusEnum("status").notNull().default("draft"),
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
  (t) => [index("events_status_starts_at_idx").on(t.status, t.startsAt)],
).enableRLS();

export const eventQuestions = pgTable(
  "event_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    helpText: text("help_text"),
    type: questionTypeEnum("type").notNull(),
    // Choices for select / multi_select. Shape: string[]
    options: jsonb("options").$type<string[]>(),
    required: boolean("required").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("event_questions_event_id_position_idx").on(t.eventId, t.position),
  ],
).enableRLS();

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventQuestion = typeof eventQuestions.$inferSelect;
export type NewEventQuestion = typeof eventQuestions.$inferInsert;
