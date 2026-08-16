import { and, asc, count, eq } from "drizzle-orm";
import { db } from "./db";
import {
  checkIns,
  events,
  registrations,
  type CheckIn,
  type Registration,
} from "./schema";
import { requireUser, requireModerator } from "./auth";

/* ── Core logic ────────────────────────────────────────────────────────────
   These take an explicit userId rather than reading the session, so the
   transactional behaviour can be tested directly. The exported actions below
   resolve the session and delegate here. */

function assertRegistrationOpen(event: typeof events.$inferSelect) {
  if (event.status !== "published") {
    throw new Error("Registration is not open for this event");
  }
  const now = new Date();
  if (event.registrationOpensAt && now < event.registrationOpensAt) {
    throw new Error("Registration is not yet open for this event");
  }
  if (event.registrationClosesAt && now > event.registrationClosesAt) {
    throw new Error("Registration for this event has closed");
  }
}

/**
 * Registers a user, confirming if there is room and waitlisting otherwise.
 *
 * CONCURRENCY: the transaction takes `FOR UPDATE` on the parent event row
 * before counting. This is the whole point. Postgres has no predicate locks at
 * read committed, so locking the registrations rows would not stop a
 * concurrent INSERT — two requests for the last seat would each count N-1 and
 * both confirm. Serialising on the event row is what prevents overselling.
 *
 * Returns null if the user was already registered.
 */
export async function registerUserForEvent(
  eventId: string,
  userId: string,
  /** Injectable so concurrency tests can supply a multi-connection pool.
   *  The app client uses max:1, which serialises transactions and would make
   *  a contention test pass whether or not the row lock exists. */
  handle: Pick<typeof db, "transaction"> = db,
): Promise<Registration | null> {
  return handle.transaction(
    async (tx) => {
      const [event] = await tx
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .for("update"); // concurrent writers block here

      if (!event) throw new Error("Event not found");
      assertRegistrationOpen(event);

      const [{ taken }] = await tx
        .select({ taken: count() })
        .from(registrations)
        .where(
          and(
            eq(registrations.eventId, eventId),
            eq(registrations.status, "confirmed"),
          ),
        );

      const status =
        event.capacity === null || taken < event.capacity
          ? "confirmed"
          : "waitlisted";

      // The unique index on (event_id, user_id) makes a double submit a no-op
      // rather than a duplicate. A previously cancelled row is revived.
      const [row] = await tx
        .insert(registrations)
        .values({ eventId, userId, status })
        .onConflictDoUpdate({
          target: [registrations.eventId, registrations.userId],
          set: { status, registeredAt: new Date(), cancelledAt: null },
          where: eq(registrations.status, "cancelled"),
        })
        .returning();

      return row ?? null;
    },
    { isolationLevel: "read committed" },
  );
}

/**
 * Cancels a registration and promotes the longest-waiting person if that
 * frees a seat. Both happen under the same event-row lock, so a cancellation
 * racing a new registration cannot double-fill the vacancy.
 */
export async function cancelUserRegistration(
  eventId: string,
  userId: string,
  handle: Pick<typeof db, "transaction"> = db,
): Promise<void> {
  await handle.transaction(
    async (tx) => {
      const [event] = await tx
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .for("update");

      if (!event) throw new Error("Event not found");

      const [existing] = await tx
        .select()
        .from(registrations)
        .where(
          and(
            eq(registrations.eventId, eventId),
            eq(registrations.userId, userId),
          ),
        );

      if (!existing || existing.status === "cancelled") return;

      await tx
        .update(registrations)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(registrations.id, existing.id));

      // Only a confirmed seat frees capacity; cancelling from the waitlist
      // promotes nobody.
      if (existing.status !== "confirmed" || event.capacity === null) return;

      const [{ taken }] = await tx
        .select({ taken: count() })
        .from(registrations)
        .where(
          and(
            eq(registrations.eventId, eventId),
            eq(registrations.status, "confirmed"),
          ),
        );

      if (taken >= event.capacity) return;

      // Waitlist order is registeredAt — no stored position to renumber.
      const [next] = await tx
        .select()
        .from(registrations)
        .where(
          and(
            eq(registrations.eventId, eventId),
            eq(registrations.status, "waitlisted"),
          ),
        )
        .orderBy(asc(registrations.registeredAt))
        .limit(1);

      if (!next) return;

      await tx
        .update(registrations)
        .set({ status: "confirmed" })
        .where(eq(registrations.id, next.id));
    },
    { isolationLevel: "read committed" },
  );
}

/**
 * Records attendance.
 *
 * Only a confirmed registration can be checked in — someone who never got a
 * seat must not be marked as having attended, because attendance is what
 * earns a certificate. Idempotent, so scanning a code twice is harmless.
 */
export async function checkInRegistration(
  registrationId: string,
  checkedInBy: string | null,
  method: "qr" | "manual",
): Promise<CheckIn> {
  const [registration] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, registrationId))
    .limit(1);

  if (!registration) throw new Error("Registration not found");
  if (registration.status !== "confirmed") {
    throw new Error("Only a confirmed registration can be checked in");
  }

  const [existing] = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.registrationId, registrationId))
    .limit(1);

  if (existing) return existing;

  const [row] = await db
    .insert(checkIns)
    .values({ registrationId, checkedInBy, method })
    .onConflictDoNothing({ target: checkIns.registrationId })
    .returning();

  if (row) return row;

  // Lost the race against a concurrent scan — return the winner's row.
  const [winner] = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.registrationId, registrationId))
    .limit(1);
  return winner;
}

/* ── Session-bound wrappers ────────────────────────────────────────────── */

export async function registerForEvent(eventId: string) {
  const me = await requireUser();
  return registerUserForEvent(eventId, me.id);
}

export async function cancelMyRegistration(eventId: string) {
  const me = await requireUser();
  return cancelUserRegistration(eventId, me.id);
}

export async function checkIn(registrationId: string, method: "qr" | "manual") {
  // Moderators run the door at events, so this is not admin-only.
  const staff = await requireModerator();
  return checkInRegistration(registrationId, staff.id, method);
}

export async function getMyRegistration(
  eventId: string,
): Promise<Registration | null> {
  const me = await requireUser();
  const [row] = await db
    .select()
    .from(registrations)
    .where(
      and(eq(registrations.eventId, eventId), eq(registrations.userId, me.id)),
    )
    .limit(1);
  return row ?? null;
}
