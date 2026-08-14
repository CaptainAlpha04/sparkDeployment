import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { roleEnum } from "./enums";

export const profiles = pgTable("profiles", {
  // FK into Supabase's auth schema. `authUsers` is marked as existing, so
  // drizzle-kit references it without trying to create auth.users.
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  university: text("university"),
  degree: text("degree"),
  phone: text("phone"),
  gradYear: integer("grad_year"),
  role: roleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}).enableRLS();

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
