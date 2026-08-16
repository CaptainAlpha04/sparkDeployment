import { afterAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./db";
import {
  getPublishedEventBySlug,
  listPastEvents,
  listUpcomingEvents,
} from "./events";
import { CLEANUP_TIMEOUT, deleteEventsByIds } from "@/test/cleanup";

/**
 * The listing and lookup functions are public — no auth guard, because the
 * events page is public — so they are directly testable, and the visibility
 * rules are worth pinning down. A draft event leaking publicly would expose
 * an unannounced event before the organisation is ready.
 */

const eventIds: string[] = [];
const tag = crypto.randomUUID().slice(0, 8);

async function makeEvent(opts: {
  status: "draft" | "published" | "cancelled" | "completed";
  daysFromNow: number;
  slug?: string;
}): Promise<string> {
  const slug = opts.slug ?? `ev-${tag}-${crypto.randomUUID().slice(0, 8)}`;
  const [row] = await db.execute(sql`
    insert into events (slug, title, starts_at, ends_at, status)
    values (
      ${slug},
      ${`Test ${opts.status}`},
      now() + (${opts.daysFromNow} || ' days')::interval,
      now() + (${opts.daysFromNow} || ' days')::interval + interval '3 hours',
      ${opts.status}::event_status
    )
    returning id
  `);
  const id = row.id as string;
  eventIds.push(id);
  return id;
}

afterAll(async () => {
  await deleteEventsByIds(eventIds);
}, CLEANUP_TIMEOUT);

describe("listUpcomingEvents", () => {
  it("never includes draft events", async () => {
    // The most important assertion here. A draft is an unannounced event.
    const draftId = await makeEvent({ status: "draft", daysFromNow: 5 });
    const rows = await listUpcomingEvents();
    expect(rows.map((r) => r.id)).not.toContain(draftId);
  });

  it("never includes cancelled events", async () => {
    const cancelledId = await makeEvent({ status: "cancelled", daysFromNow: 5 });
    const rows = await listUpcomingEvents();
    expect(rows.map((r) => r.id)).not.toContain(cancelledId);
  });

  it("includes published future events", async () => {
    const id = await makeEvent({ status: "published", daysFromNow: 5 });
    const rows = await listUpcomingEvents();
    expect(rows.map((r) => r.id)).toContain(id);
  });

  it("excludes events that have already finished", async () => {
    const past = await makeEvent({ status: "published", daysFromNow: -10 });
    const rows = await listUpcomingEvents();
    expect(rows.map((r) => r.id)).not.toContain(past);
  });

  it("orders soonest first", async () => {
    const later = await makeEvent({ status: "published", daysFromNow: 40 });
    const sooner = await makeEvent({ status: "published", daysFromNow: 30 });

    const rows = await listUpcomingEvents();
    const ids = rows.map((r) => r.id);
    expect(ids.indexOf(sooner)).toBeLessThan(ids.indexOf(later));
  });

  it("reports zero counts for an event with no registrations", async () => {
    const id = await makeEvent({ status: "published", daysFromNow: 6 });
    const row = (await listUpcomingEvents()).find((r) => r.id === id);
    expect(row?.confirmedCount).toBe(0);
    expect(row?.waitlistedCount).toBe(0);
    expect(row?.checkedInCount).toBe(0);
  });
});

describe("listPastEvents", () => {
  it("includes finished published events", async () => {
    const id = await makeEvent({ status: "published", daysFromNow: -20 });
    const rows = await listPastEvents();
    expect(rows.map((r) => r.id)).toContain(id);
  });

  it("never includes drafts, even old ones", async () => {
    const id = await makeEvent({ status: "draft", daysFromNow: -20 });
    const rows = await listPastEvents();
    expect(rows.map((r) => r.id)).not.toContain(id);
  });
});

describe("getPublishedEventBySlug", () => {
  it("returns null for a draft, so drafts 404 publicly", async () => {
    const slug = `draft-${tag}`;
    await makeEvent({ status: "draft", daysFromNow: 5, slug });
    expect(await getPublishedEventBySlug(slug)).toBeNull();
  });

  it("returns a published event", async () => {
    const slug = `live-${tag}`;
    await makeEvent({ status: "published", daysFromNow: 5, slug });
    const row = await getPublishedEventBySlug(slug);
    expect(row?.slug).toBe(slug);
  });

  it("still returns a cancelled event, so the page can say it was cancelled", async () => {
    // 404ing a cancelled event would leave anyone holding the link confused
    // about whether they had the wrong address.
    const slug = `cancelled-${tag}`;
    await makeEvent({ status: "cancelled", daysFromNow: 5, slug });
    const row = await getPublishedEventBySlug(slug);
    expect(row?.status).toBe("cancelled");
  });

  it("returns null for an unknown slug", async () => {
    expect(await getPublishedEventBySlug("no-such-event-anywhere")).toBeNull();
  });
});
