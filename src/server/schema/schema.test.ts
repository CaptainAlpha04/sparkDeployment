import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";

describe("profiles table", () => {
  it("exists with the expected columns", async () => {
    const rows = await db.execute(sql`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
    `);
    const cols = rows.map((r) => r.column_name as string);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "full_name",
        "avatar_url",
        "bio",
        "university",
        "degree",
        "phone",
        "grad_year",
        "role",
        "created_at",
        "updated_at",
      ]),
    );
  });

  it("does not expose a password column", async () => {
    // The old Firebase app stored bcrypt hashes in the user document and
    // returned them to the browser. Supabase Auth owns credentials now;
    // profiles must never carry one.
    const rows = await db.execute(sql`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
    `);
    const cols = rows.map((r) => r.column_name as string);
    expect(cols).not.toContain("password");
  });

  it("cascades from auth.users", async () => {
    const rows = await db.execute(sql`
      select rc.delete_rule
      from information_schema.referential_constraints rc
      join information_schema.table_constraints tc
        on tc.constraint_name = rc.constraint_name
      where tc.table_name = 'profiles' and tc.constraint_type = 'FOREIGN KEY'
    `);
    expect(rows.map((r) => r.delete_rule)).toContain("CASCADE");
  });

  it("defaults role to member", async () => {
    const rows = await db.execute(sql`
      select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
        and column_name = 'role'
    `);
    expect(String(rows[0].column_default)).toContain("member");
  });
});
