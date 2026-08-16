import { pgEnum } from "drizzle-orm/pg-core";

// `editor` is orthogonal to `moderator`, not a rung above it. A moderator
// polices discussion; an editor publishes to the site's own masthead. Neither
// implies the other, and `admin` implies both — see isEditorRole in auth.ts.
export const roleEnum = pgEnum("role", [
  "member",
  "moderator",
  "editor",
  "admin",
]);

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

// NOTE: `ALTER TYPE ... ADD VALUE` runs fine inside a transaction here —
// measured against this database on Postgres 17.6 when `editor` was added to
// roleEnum. The restriction that remains is that the new value cannot be
// *used* in the transaction that added it, which is why 0009 is a separate
// migration file from 0008. If this set churns in practice, migrate to text
// plus a check constraint rather than fighting enum migrations.
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

// Blog posts and case studies are the same object with a different reading
// context, so they share one table and differ by kind. Splitting them would
// duplicate the editor, the studio UI, and every SEO derivation twice over.
export const postKindEnum = pgEnum("post_kind", ["article", "case_study"]);

// No `review` state: editors publish directly, so a submitted-for-approval
// rung would be a workflow nobody walks. `archived` unpublishes without
// destroying the row, which matters because the URL may already be cited.
export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
]);
