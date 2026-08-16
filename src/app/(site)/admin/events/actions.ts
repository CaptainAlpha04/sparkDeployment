"use server";

import { revalidatePath } from "next/cache";
import { createEvent, getEvent, updateEvent, type EventInput } from "@/server/events";
import { cancelUserRegistration, checkIn } from "@/server/registrations";

/**
 * Discriminated result. The server layer throws — `requireAdmin`, the slug and
 * date validators, and the capacity-below-confirmed refusal all raise Errors —
 * and a raw throw crossing the action boundary reaches the client as an opaque
 * digest with the message stripped in production. Every entry point here
 * catches and hands back a string the UI can render.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

/**
 * What the form posts.
 *
 * Instants travel as ISO 8601 strings, never as `datetime-local` text. The
 * browser's `datetime-local` value is a bare wall clock with no zone, so the
 * form resolves it against Asia/Karachi before it gets here; by this point the
 * moment is already unambiguous and `new Date(iso)` cannot shift it.
 */
export type EventFormPayload = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  venueName: string;
  venueAddress: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  status: EventStatus;
};

function toMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Please try again.";
}

/** Empty strings become null so the column stays NULL rather than holding "". */
function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function requiredInstant(iso: string, label: string): Date {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is required`);
  return date;
}

function optionalInstant(iso: string | null, label: string): Date | null {
  if (iso === null || iso === "") return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is not a valid date`);
  return date;
}

function toInput(payload: EventFormPayload): EventInput {
  return {
    title: payload.title.trim(),
    slug: payload.slug.trim().toLowerCase(),
    summary: nullable(payload.summary),
    description: nullable(payload.description),
    venueName: nullable(payload.venueName),
    venueAddress: nullable(payload.venueAddress),
    startsAt: requiredInstant(payload.startsAt, "A start date and time"),
    endsAt: requiredInstant(payload.endsAt, "An end date and time"),
    capacity: payload.capacity,
    registrationOpensAt: optionalInstant(
      payload.registrationOpensAt,
      "Registration opening",
    ),
    registrationClosesAt: optionalInstant(
      payload.registrationClosesAt,
      "Registration closing",
    ),
    status: payload.status,
  };
}

/**
 * An event write invalidates the admin list, the admin editor, and both public
 * surfaces. `slugs` takes more than one because an edit can rename the slug,
 * leaving the old public path cached against a URL that no longer resolves.
 */
function revalidateEvent(id: string | null, slugs: string[]) {
  revalidatePath("/admin/events");
  revalidatePath("/events");
  if (id) {
    revalidatePath(`/admin/events/${id}`);
    revalidatePath(`/admin/events/${id}/attendees`);
  }
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/events/${slug}`);
  }
}

export async function createEventAction(
  payload: EventFormPayload,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const event = await createEvent(toInput(payload));
    revalidateEvent(event.id, [event.slug]);
    return { ok: true, data: { id: event.id, slug: event.slug } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function updateEventAction(
  id: string,
  payload: EventFormPayload,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    // Read first so a slug rename can invalidate the path it used to live at.
    const previous = await getEvent(id);
    const event = await updateEvent(id, toInput(payload));
    revalidateEvent(event.id, [event.slug, previous?.slug ?? ""]);
    return { ok: true, data: { id: event.id, slug: event.slug } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

const checkInTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Karachi",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Door check-in. Returns the recorded time already formatted, so the table can
 * show the row as done immediately without inventing a timestamp of its own or
 * formatting a Date in the browser's zone.
 */
export async function checkInAction(
  eventId: string,
  registrationId: string,
): Promise<ActionResult<{ checkedInAt: string }>> {
  try {
    const record = await checkIn(registrationId, "manual");
    revalidatePath(`/admin/events/${eventId}/attendees`);
    revalidatePath("/admin/events");
    return {
      ok: true,
      data: { checkedInAt: checkInTimeFormatter.format(record.checkedInAt) },
    };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/**
 * Cancels on an attendee's behalf. The server promotes the longest-waiting
 * person under the same event-row lock, so the counts the table re-reads after
 * this call already reflect the promotion.
 */
export async function cancelRegistrationAction(
  eventId: string,
  userId: string,
): Promise<ActionResult> {
  try {
    await cancelUserRegistration(eventId, userId);
    const event = await getEvent(eventId);
    revalidateEvent(eventId, [event?.slug ?? ""]);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
