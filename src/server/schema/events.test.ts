import { describe, expect, it, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { events } from "./events";

const SLUG = "dup-slug-test";

afterAll(async () => {
  await db.execute(sql`delete from events where slug = ${SLUG}`);
});

describe("events table", () => {
  it("stores timestamps with time zone", async () => {
    // The old app stored dates as free-text strings, making ordering and
    // timezone handling impossible.
    const rows = await db.execute(sql`
      select column_name, data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'events'
        and column_name in ('starts_at', 'ends_at')
    `);
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.data_type).toBe("timestamp with time zone");
    }
  });

  it("allows null capacity meaning unlimited", async () => {
    const rows = await db.execute(sql`
      select is_nullable from information_schema.columns
      where table_schema = 'public' and table_name = 'events'
        and column_name = 'capacity'
    `);
    expect(rows[0].is_nullable).toBe("YES");
  });

  it("defaults status to draft", async () => {
    const rows = await db.execute(sql`
      select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'events'
        and column_name = 'status'
    `);
    expect(String(rows[0].column_default)).toContain("draft");
  });

  it("enforces slug uniqueness", async () => {
    const base = {
      slug: SLUG,
      title: "A",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3_600_000),
    };
    await db.insert(events).values(base);
    await expect(db.insert(events).values(base)).rejects.toThrow();
  });
});
