import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";

/**
 * A failing handle_new_user trigger blocks ALL signups, surfacing only as an
 * opaque `Database error saving new user` from the Auth API. It gets a test.
 */
async function createAuthUser(email: string, meta: Record<string, unknown>) {
  const id = crypto.randomUUID();
  await db.execute(sql`
    insert into auth.users
      (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values
      (${id}, '00000000-0000-0000-0000-000000000000', 'authenticated',
       'authenticated', ${email}, ${JSON.stringify(meta)}::jsonb, now(), now())
  `);
  return id;
}

async function deleteAuthUser(id: string) {
  await db.execute(sql`delete from auth.users where id = ${id}`);
}

describe("handle_new_user trigger", () => {
  it("creates a profile for an email/password signup", async () => {
    const id = await createAuthUser(`pw-${Date.now()}@test.dev`, {
      full_name: "Pass Word",
    });
    try {
      const rows = await db.execute(
        sql`select full_name, role from profiles where id = ${id}`,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].full_name).toBe("Pass Word");
      expect(rows[0].role).toBe("member");
    } finally {
      await deleteAuthUser(id);
    }
  });

  it("maps Google OAuth metadata keys", async () => {
    // Google puts full_name and avatar_url in raw_user_meta_data.
    const id = await createAuthUser(`oauth-${Date.now()}@test.dev`, {
      full_name: "Goo Gle",
      avatar_url: "https://example.com/a.png",
    });
    try {
      const rows = await db.execute(
        sql`select full_name, avatar_url from profiles where id = ${id}`,
      );
      expect(rows[0].full_name).toBe("Goo Gle");
      expect(rows[0].avatar_url).toBe("https://example.com/a.png");
    } finally {
      await deleteAuthUser(id);
    }
  });

  it("survives a signup with no metadata at all", async () => {
    const id = await createAuthUser(`bare-${Date.now()}@test.dev`, {});
    try {
      const rows = await db.execute(sql`select id from profiles where id = ${id}`);
      expect(rows).toHaveLength(1);
    } finally {
      await deleteAuthUser(id);
    }
  });

  it("cascades profile deletion", async () => {
    const id = await createAuthUser(`del-${Date.now()}@test.dev`, {});
    await deleteAuthUser(id);
    const rows = await db.execute(sql`select 1 from profiles where id = ${id}`);
    expect(rows).toHaveLength(0);
  });
});
