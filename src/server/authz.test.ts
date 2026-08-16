import { describe, expect, it, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { isAdminRole, isModeratorRole } from "./auth";

const created: string[] = [];

async function makeAuthUser(): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(sql`
    insert into auth.users
      (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (${id}, '00000000-0000-0000-0000-000000000000', 'authenticated',
            'authenticated', ${`azt-${id}@test.dev`}, '{}'::jsonb, now(), now())
  `);
  created.push(id);
  return id;
}

afterAll(async () => {
  for (const id of created) {
    await db.execute(sql`delete from auth.users where id = ${id}`);
  }
});

describe("role assignment", () => {
  it("defaults a new signup to member, never admin", async () => {
    // The old app let anyone set admin:true from the browser console. A new
    // account landing as anything but `member` is a critical failure.
    const id = await makeAuthUser();
    const rows = await db.execute(sql`select role from profiles where id = ${id}`);
    expect(rows[0].role).toBe("member");
  });

  it("stores each role faithfully", async () => {
    for (const role of ["member", "moderator", "admin"] as const) {
      const id = await makeAuthUser();
      await db.execute(sql`update profiles set role = ${role}::role where id = ${id}`);
      const rows = await db.execute(sql`select role from profiles where id = ${id}`);
      expect(rows[0].role).toBe(role);
    }
  });

  it("never grants admin as a side effect of signing up", async () => {
    // The real risk is privilege escalation through the signup path, not the
    // existence of admins — real admins are expected once someone runs
    // `npm run db:seed`. So this asserts the trigger's default, not a global
    // count, which would start failing the moment a genuine admin exists.
    const id = await makeAuthUser();
    const rows = await db.execute(sql`
      select role from profiles where id = ${id}
    `);
    expect(rows[0].role).toBe("member");
    expect(rows[0].role).not.toBe("admin");
  });
});

describe("role gates", () => {
  it("gates admin capability to admins only", () => {
    expect(isAdminRole("member")).toBe(false);
    expect(isAdminRole("moderator")).toBe(false);
    expect(isAdminRole("admin")).toBe(true);
  });

  it("gates moderator capability to moderators and admins", () => {
    expect(isModeratorRole("member")).toBe(false);
    expect(isModeratorRole("moderator")).toBe(true);
    expect(isModeratorRole("admin")).toBe(true);
  });
});
