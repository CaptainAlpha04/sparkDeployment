import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["member", "moderator", "admin"]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
  "completed",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "confirmed",
  "waitlisted",
  "cancelled",
]);

// NOTE: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction and cannot
// be rolled back. If this set churns in practice, migrate to text + a check
// constraint rather than fighting enum migrations.
export const questionTypeEnum = pgEnum("question_type", [
  "short_text",
  "long_text",
  "select",
  "multi_select",
  "number",
  "email",
  "url",
  "checkbox",
]);

export const checkInMethodEnum = pgEnum("check_in_method", ["qr", "manual"]);
