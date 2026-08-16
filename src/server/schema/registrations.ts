import { pgTable, uuid, timestamp, jsonb, unique, index } from "drizzle-orm/pg-core";
import { registrationStatusEnum, checkInMethodEnum } from "./enums";
import { profiles } from "./profiles";
import { events, eventQuestions } from "./events";

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: registrationStatusEnum("status").notNull(),
    // Waitlist order derives from registeredAt — no stored position column, so
    // cancellations never require renumbering.
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    // Makes double-submit idempotent via onConflictDoNothing.
    unique("registrations_event_user_unique").on(t.eventId, t.userId),
    index("registrations_event_status_registered_idx").on(
      t.eventId,
      t.status,
      t.registeredAt,
    ),
  ],
).enableRLS();

export const registrationAnswers = pgTable(
  "registration_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => eventQuestions.id, { onDelete: "cascade" }),
    value: jsonb("value").notNull(),
  },
  (t) => [
    unique("registration_answers_registration_question_unique").on(
      t.registrationId,
      t.questionId,
    ),
  ],
).enableRLS();

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id")
    .notNull()
    .unique()
    .references(() => registrations.id, { onDelete: "cascade" }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  checkedInBy: uuid("checked_in_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  method: checkInMethodEnum("method").notNull(),
}).enableRLS();

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type RegistrationAnswer = typeof registrationAnswers.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
