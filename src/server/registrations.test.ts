import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./db";
import {
  cancelUserRegistration,
  checkInRegistration,
  registerUserForEvent,
} from "./registrations";
import { concurrentDb, closeConcurrentDb } from "@/test/concurrent-db";

const userIds: string[] = [];
const eventIds: string[] = [];

async function makeUser(name = "Test User"): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(sql`
    insert into auth.users
      (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (${id}, '00000000-0000-0000-0000-000000000000', 'authenticated',
            'authenticated', ${`reg-${id}@test.dev`},
            ${JSON.stringify({ full_name: name })}::jsonb, now(), now())
  `);
  userIds.push(id);
  return id;
}

async function makeEvent(capacity: number | null): Promise<string> {
  const [row] = await db.execute(sql`
    insert into events (slug, title, starts_at, ends_at, capacity, status)
    values (${`reg-ev-${crypto.randomUUID()}`}, 'Capacity Test',
            now() + interval '7 days', now() + interval '7 days 3 hours',
            ${capacity}, 'published')
    returning id
  `);
  const id = row.id as string;
  eventIds.push(id);
  return id;
}

async function countConfirmed(eventId: string): Promise<number> {
  const [row] = await db.execute(sql`
    select count(*)::int as n from registrations
    where event_id = ${eventId} and status = 'confirmed'
  `);
  return row.n as number;
}

afterAll(async () => {
  await closeConcurrentDb();
  for (const id of eventIds) {
    await db.execute(sql`delete from events where id = ${id}`);
  }
  for (const id of userIds) {
    await db.execute(sql`delete from auth.users where id = ${id}`);
  }
});

describe("registerUserForEvent", () => {
  it("confirms when there is room", async () => {
    const eventId = await makeEvent(10);
    const userId = await makeUser();

    const result = await registerUserForEvent(eventId, userId);
    expect(result?.status).toBe("confirmed");
  });

  it("waitlists once capacity is reached", async () => {
    const eventId = await makeEvent(1);
    const first = await makeUser();
    const second = await makeUser();

    expect((await registerUserForEvent(eventId, first))?.status).toBe("confirmed");
    expect((await registerUserForEvent(eventId, second))?.status).toBe("waitlisted");
  });

  it("treats null capacity as unlimited", async () => {
    const eventId = await makeEvent(null);
    for (let i = 0; i < 5; i++) {
      const userId = await makeUser();
      expect((await registerUserForEvent(eventId, userId))?.status).toBe("confirmed");
    }
    expect(await countConfirmed(eventId)).toBe(5);
  });

  it("is idempotent — double submit does not double register", async () => {
    const eventId = await makeEvent(10);
    const userId = await makeUser();

    await registerUserForEvent(eventId, userId);
    await registerUserForEvent(eventId, userId);

    expect(await countConfirmed(eventId)).toBe(1);
  });

  /**
   * THE test. Without a lock on the parent event row, two concurrent
   * registrations for the last seat each count N-1 and both confirm, and the
   * event is oversold. Postgres has no predicate locks at read committed, so
   * locking the registrations rows would not help — only the event row
   * serialises writers.
   *
   * MUST use `concurrentDb`. The application client is configured `max: 1`
   * (correct for serverless: one socket per instance), which queues every
   * transaction through a single connection. Run against it, this test passes
   * whether or not the lock exists — verified by deleting `.for("update")`
   * and watching it still go green. The multi-connection pool reproduces what
   * actually happens in production, where separate instances contend for the
   * same row.
   */
  it("never oversells under concurrent registration", async () => {
    const CAPACITY = 3;
    const CONTENDERS = 12;

    const eventId = await makeEvent(CAPACITY);
    const users = await Promise.all(
      Array.from({ length: CONTENDERS }, () => makeUser()),
    );

    const results = await Promise.all(
      users.map((userId) => registerUserForEvent(eventId, userId, concurrentDb)),
    );

    const confirmed = results.filter((r) => r?.status === "confirmed").length;
    const waitlisted = results.filter((r) => r?.status === "waitlisted").length;

    expect(confirmed).toBe(CAPACITY);
    expect(waitlisted).toBe(CONTENDERS - CAPACITY);
    // Belt and braces: verify against the database, not just return values.
    expect(await countConfirmed(eventId)).toBe(CAPACITY);
  });
});

describe("cancelUserRegistration", () => {
  it("promotes exactly one waitlisted person when a seat frees", async () => {
    const eventId = await makeEvent(1);
    const holder = await makeUser("Holder");
    const waiting1 = await makeUser("First In Line");
    const waiting2 = await makeUser("Second In Line");

    await registerUserForEvent(eventId, holder);
    await registerUserForEvent(eventId, waiting1);
    await registerUserForEvent(eventId, waiting2);

    await cancelUserRegistration(eventId, holder);

    expect(await countConfirmed(eventId)).toBe(1);

    // Promotion is by registration order, so the first to join the waitlist
    // gets the seat.
    const [promoted] = await db.execute(sql`
      select user_id from registrations
      where event_id = ${eventId} and status = 'confirmed'
    `);
    expect(promoted.user_id).toBe(waiting1);
  });

  it("does not promote anyone when the event is under capacity", async () => {
    const eventId = await makeEvent(5);
    const a = await makeUser();
    const b = await makeUser();

    await registerUserForEvent(eventId, a);
    await registerUserForEvent(eventId, b);
    await cancelUserRegistration(eventId, a);

    expect(await countConfirmed(eventId)).toBe(1);
  });

  it("lets someone re-register after cancelling", async () => {
    const eventId = await makeEvent(5);
    const userId = await makeUser();

    await registerUserForEvent(eventId, userId);
    await cancelUserRegistration(eventId, userId);
    const again = await registerUserForEvent(eventId, userId);

    expect(again?.status).toBe("confirmed");
    expect(await countConfirmed(eventId)).toBe(1);
  });
});

describe("checkInRegistration", () => {
  it("records attendance for a confirmed registration", async () => {
    const eventId = await makeEvent(5);
    const userId = await makeUser();
    const registration = await registerUserForEvent(eventId, userId);

    const checkIn = await checkInRegistration(registration!.id, null, "manual");
    expect(checkIn.registrationId).toBe(registration!.id);
  });

  it("is idempotent — scanning a code twice does not duplicate", async () => {
    const eventId = await makeEvent(5);
    const userId = await makeUser();
    const registration = await registerUserForEvent(eventId, userId);

    await checkInRegistration(registration!.id, null, "manual");
    await checkInRegistration(registration!.id, null, "qr");

    const [row] = await db.execute(sql`
      select count(*)::int as n from check_ins
      where registration_id = ${registration!.id}
    `);
    expect(row.n).toBe(1);
  });

  it("refuses to check in a waitlisted registration", async () => {
    // Someone who never got a seat must not be marked as having attended —
    // attendance is what earns a certificate.
    const eventId = await makeEvent(1);
    const holder = await makeUser();
    const waiting = await makeUser();

    await registerUserForEvent(eventId, holder);
    const waitlisted = await registerUserForEvent(eventId, waiting);

    await expect(
      checkInRegistration(waitlisted!.id, null, "manual"),
    ).rejects.toThrow(/confirmed/i);
  });
});

describe("registration eligibility", () => {
  beforeEach(() => {});

  it("refuses registration for a draft event", async () => {
    const eventId = await makeEvent(10);
    await db.execute(sql`update events set status = 'draft' where id = ${eventId}`);
    const userId = await makeUser();

    await expect(registerUserForEvent(eventId, userId)).rejects.toThrow(/not open/i);
  });

  it("refuses registration for a cancelled event", async () => {
    const eventId = await makeEvent(10);
    await db.execute(
      sql`update events set status = 'cancelled' where id = ${eventId}`,
    );
    const userId = await makeUser();

    await expect(registerUserForEvent(eventId, userId)).rejects.toThrow(/not open/i);
  });

  it("refuses registration before the window opens", async () => {
    const eventId = await makeEvent(10);
    await db.execute(sql`
      update events set registration_opens_at = now() + interval '2 days'
      where id = ${eventId}
    `);
    const userId = await makeUser();

    await expect(registerUserForEvent(eventId, userId)).rejects.toThrow(
      /not yet open/i,
    );
  });

  it("refuses registration after the window closes", async () => {
    const eventId = await makeEvent(10);
    await db.execute(sql`
      update events set registration_closes_at = now() - interval '1 hour'
      where id = ${eventId}
    `);
    const userId = await makeUser();

    await expect(registerUserForEvent(eventId, userId)).rejects.toThrow(/closed/i);
  });
});
