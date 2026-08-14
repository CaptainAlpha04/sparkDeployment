import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";

describe("registrations schema", () => {
  it("enforces one registration per user per event", async () => {
    // This unique constraint is what makes double-submit idempotent via
    // onConflictDoNothing in the registration transaction.
    const rows = await db.execute(sql`
      select indexdef from pg_indexes
      where schemaname = 'public' and tablename = 'registrations'
    `);
    const defs = rows.map((r) => r.indexdef as string).join("\n");
    expect(defs).toMatch(/UNIQUE.*event_id.*user_id/i);
  });

  it("keys registrations on user_id, not display name", async () => {
    // The old app stored attendee display names, so two members called "Ali"
    // collided and one could never register.
    const rows = await db.execute(sql`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'registrations'
    `);
    const cols = rows.map((r) => r.column_name as string);
    expect(cols).toContain("user_id");
    expect(cols).not.toContain("user_name");
  });

  it("enforces one check-in per registration", async () => {
    const rows = await db.execute(sql`
      select indexdef from pg_indexes
      where schemaname = 'public' and tablename = 'check_ins'
    `);
    const defs = rows.map((r) => r.indexdef as string).join("\n");
    expect(defs).toMatch(/UNIQUE.*registration_id/i);
  });

  it("enforces one answer per question per registration", async () => {
    const rows = await db.execute(sql`
      select indexdef from pg_indexes
      where schemaname = 'public' and tablename = 'registration_answers'
    `);
    const defs = rows.map((r) => r.indexdef as string).join("\n");
    expect(defs).toMatch(/UNIQUE.*registration_id.*question_id/i);
  });
});
