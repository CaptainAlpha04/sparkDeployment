import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";

/**
 * RLS is the only thing standing between the public publishable key and the
 * entire database. The old Firebase app shipped open security rules, which let
 * any visitor read every user record and grant themselves admin.
 *
 * These tests are the guard against a future table shipping without RLS.
 */
describe("row level security", () => {
  it("is enabled on every public table", async () => {
    const rows = await db.execute(sql`
      select c.relname as table_name, c.relrowsecurity as rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and c.relname not like '%drizzle%'
    `);

    expect(rows.length).toBeGreaterThan(0);

    const unprotected = rows
      .filter((r) => r.rls_enabled === false)
      .map((r) => r.table_name);

    expect(unprotected).toEqual([]);
  });

  it("grants no permissive policies (deny-all by design)", async () => {
    // Phase 1 ships zero policies deliberately: every read and write goes
    // through src/server/**, so the anon key needs no access at all.
    const rows = await db.execute(sql`
      select tablename, policyname from pg_policies where schemaname = 'public'
    `);
    expect(rows).toEqual([]);
  });
});
