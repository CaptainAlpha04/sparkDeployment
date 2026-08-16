import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  lt,
  sql,
} from "drizzle-orm";
import { db } from "./db";
import {
  checkIns,
  events,
  profiles,
  registrations,
  type Event,
  type Registration,
} from "./schema";
import { requireAdmin, requireModerator, requireUser } from "./auth";

export type EventWithCounts = Event & {
  confirmedCount: number;
  waitlistedCount: number;
  checkedInCount: number;
};

/**
 * Attaches registration and attendance tallies to a set of events.
 *
 * Two queries regardless of how many events are passed, and both are scoped to
 * the ids in hand — aggregating the whole registrations table would get slower
 * with every event ever run, even when listing a single one.
 */
async function withCounts(rows: Event[]): Promise<EventWithCounts[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const tallies = await db
    .select({
      eventId: registrations.eventId,
      status: registrations.status,
      n: count(),
    })
    .from(registrations)
    .where(inArray(registrations.eventId, ids))
    .groupBy(registrations.eventId, registrations.status);

  const checked = await db
    .select({ eventId: registrations.eventId, n: count() })
    .from(checkIns)
    .innerJoin(registrations, eq(checkIns.registrationId, registrations.id))
    .where(inArray(registrations.eventId, ids))
    .groupBy(registrations.eventId);

  return rows.map((event) => ({
    ...event,
    confirmedCount:
      tallies.find((t) => t.eventId === event.id && t.status === "confirmed")?.n ?? 0,
    waitlistedCount:
      tallies.find((t) => t.eventId === event.id && t.status === "waitlisted")?.n ?? 0,
    checkedInCount: checked.find((c) => c.eventId === event.id)?.n ?? 0,
  }));
}

/* ── Public ────────────────────────────────────────────────────────────── */

/** Published, not-yet-finished events, soonest first. */
export async function listUpcomingEvents(): Promise<EventWithCounts[]> {
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), gte(events.endsAt, new Date())))
    .orderBy(asc(events.startsAt));
  return withCounts(rows);
}

export async function listPastEvents(): Promise<EventWithCounts[]> {
  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        sql`${events.status} in ('published','completed')`,
        lt(events.endsAt, new Date()),
      ),
    )
    .orderBy(desc(events.startsAt));
  return withCounts(rows);
}

/** Public detail lookup. Draft events are invisible until published. */
export async function getPublishedEventBySlug(
  slug: string,
): Promise<EventWithCounts | null> {
  const [row] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.slug, slug),
        sql`${events.status} in ('published','completed','cancelled')`,
      ),
    )
    .limit(1);

  if (!row) return null;
  const [withCount] = await withCounts([row]);
  return withCount;
}

/* ── Admin ─────────────────────────────────────────────────────────────── */

export async function listAllEvents(): Promise<EventWithCounts[]> {
  await requireModerator();
  const rows = await db.select().from(events).orderBy(desc(events.startsAt));
  return withCounts(rows);
}

export async function getEvent(id: string): Promise<Event | null> {
  await requireModerator();
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row ?? null;
}

export type EventInput = {
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  startsAt: Date;
  endsAt: Date;
  capacity?: number | null;
  registrationOpensAt?: Date | null;
  registrationClosesAt?: Date | null;
  status: "draft" | "published" | "cancelled" | "completed";
  coverImageUrl?: string | null;
};

function validate(input: EventInput) {
  if (!input.title.trim()) throw new Error("Title is required");
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error("Slug can contain lowercase letters, numbers, and dashes only");
  }
  if (input.endsAt <= input.startsAt) {
    throw new Error("The event must end after it starts");
  }
  if (input.capacity !== null && input.capacity !== undefined && input.capacity < 1) {
    throw new Error("Capacity must be at least 1, or empty for unlimited");
  }
  if (
    input.registrationOpensAt &&
    input.registrationClosesAt &&
    input.registrationClosesAt <= input.registrationOpensAt
  ) {
    throw new Error("Registration must close after it opens");
  }
}

export async function createEvent(input: EventInput): Promise<Event> {
  const admin = await requireAdmin();
  validate(input);
  const [row] = await db
    .insert(events)
    .values({ ...input, createdBy: admin.id })
    .returning();
  return row;
}

export async function updateEvent(id: string, input: EventInput): Promise<Event> {
  await requireAdmin();
  validate(input);

  // Reducing capacity below the number already confirmed would silently
  // oversell the room, so it is refused rather than quietly accepted.
  if (input.capacity !== null && input.capacity !== undefined) {
    const [{ taken }] = await db
      .select({ taken: count() })
      .from(registrations)
      .where(
        and(eq(registrations.eventId, id), eq(registrations.status, "confirmed")),
      );
    if (input.capacity < taken) {
      throw new Error(
        `${taken} people are already confirmed. Cancel some registrations before reducing capacity below ${taken}.`,
      );
    }
  }

  const [row] = await db
    .update(events)
    .set(input)
    .where(eq(events.id, id))
    .returning();
  if (!row) throw new Error("Event not found");
  return row;
}

export type AttendeeRow = {
  registration: Registration;
  fullName: string | null;
  university: string | null;
  checkedInAt: Date | null;
};

/** Attendee list for the door. Moderators run check-in, so not admin-only. */
export async function listEventAttendees(eventId: string): Promise<AttendeeRow[]> {
  await requireModerator();

  const rows = await db
    .select({
      registration: registrations,
      fullName: profiles.fullName,
      university: profiles.university,
      checkedInAt: checkIns.checkedInAt,
    })
    .from(registrations)
    .innerJoin(profiles, eq(registrations.userId, profiles.id))
    .leftJoin(checkIns, eq(checkIns.registrationId, registrations.id))
    .where(eq(registrations.eventId, eventId))
    .orderBy(asc(registrations.registeredAt));

  return rows;
}

/* ── Member ────────────────────────────────────────────────────────────── */

export type MyRegistrationRow = {
  registration: Registration;
  event: Event;
  attended: boolean;
};

export async function getMyRegistrations(): Promise<MyRegistrationRow[]> {
  const me = await requireUser();

  const rows = await db
    .select({
      registration: registrations,
      event: events,
      checkedInAt: checkIns.checkedInAt,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(checkIns, eq(checkIns.registrationId, registrations.id))
    .where(eq(registrations.userId, me.id))
    .orderBy(desc(events.startsAt));

  return rows.map((r) => ({
    registration: r.registration,
    event: r.event,
    attended: r.checkedInAt !== null,
  }));
}

/* ── Dashboard tallies ─────────────────────────────────────────────────── */

export async function getAdminOverview() {
  await requireModerator();

  // One round trip for four numbers rather than four. This also used to be a
  // Promise.all of four separate queries, which deadlocked the connection pool
  // and hung the entire admin dashboard. See the comment in db.ts.
  const [tallies] = await db.execute<{
    events: number;
    members: number;
    confirmed: number;
    checked_in: number;
  }>(sql`
    select
      (select count(*) from events)::int as events,
      (select count(*) from profiles)::int as members,
      (select count(*) from registrations where status = 'confirmed')::int as confirmed,
      (select count(*) from check_ins)::int as checked_in
  `);

  const eventTally = { n: tallies.events };
  const memberTally = { n: tallies.members };
  const regTally = { n: tallies.confirmed };
  const checkTally = { n: tallies.checked_in };

  const upcoming = await db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), gte(events.endsAt, new Date())))
    .orderBy(asc(events.startsAt))
    .limit(5);

  return {
    totalEvents: eventTally.n,
    totalMembers: memberTally.n,
    totalConfirmed: regTally.n,
    totalCheckedIn: checkTally.n,
    upcoming: await withCounts(upcoming),
  };
}

export async function getMemberOverview() {
  const me = await requireUser();

  const [[upcomingTally], [attendedTally]] = await Promise.all([
    db
      .select({ n: count() })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(
        and(
          eq(registrations.userId, me.id),
          eq(registrations.status, "confirmed"),
          gte(events.endsAt, new Date()),
        ),
      ),
    db
      .select({ n: count() })
      .from(checkIns)
      .innerJoin(registrations, eq(checkIns.registrationId, registrations.id))
      .where(eq(registrations.userId, me.id)),
  ]);

  return {
    profile: me,
    upcomingCount: upcomingTally.n,
    attendedCount: attendedTally.n,
  };
}

/** Events this user attended that have no certificate yet — used for nudges. */
export async function countAttendedWithoutCertificate(): Promise<number> {
  const me = await requireUser();
  const [row] = await db
    .select({ n: count() })
    .from(checkIns)
    .innerJoin(registrations, eq(checkIns.registrationId, registrations.id))
    .where(and(eq(registrations.userId, me.id), isNotNull(checkIns.checkedInAt)));
  return row.n;
}
