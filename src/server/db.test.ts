import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Regression guard for a deadlock that silently took down the admin dashboard.
 *
 * With `max: 1`, postgres-js hangs forever once four or more queries are issued
 * concurrently on the pool. No error, no timeout, no log line. The page just
 * never responds, which is far harder to diagnose than a crash.
 *
 * `getAdminOverview` fires four counts through Promise.all, so /admin hung
 * while every other page worked. This test fails if the pool size is ever
 * reduced back to 1.
 */
describe("database pool", () => {
  it("handles more concurrent queries than the admin dashboard issues", async () => {
    // getAdminOverview issues 4. Testing 8 leaves headroom for the page
    // growing another tile without silently reintroducing the hang.
    const queries = Array.from({ length: 8 }, () =>
      db.execute(sql`select 1 as ok`),
    );

    const result = await Promise.race([
      Promise.all(queries).then(() => "completed"),
      new Promise((resolve) =>
        setTimeout(() => resolve("deadlocked"), 15_000),
      ),
    ]);

    expect(result).toBe("completed");
  }, 20_000);
});
