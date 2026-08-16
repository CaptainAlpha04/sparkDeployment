"use server";

import { revalidatePath } from "next/cache";
import {
  cancelMyRegistration,
  getMyRegistration,
  registerForEvent,
} from "@/server/registrations";

/**
 * Discriminated result so the client never has to inspect a thrown value.
 * `status` is the registration status the server settled on — 'confirmed' or
 * 'waitlisted' — which is not knowable client-side before the call.
 */
export type RegistrationActionResult =
  | { ok: true; status?: string }
  | { ok: false; error: string };

/** Both the listing (capacity counters) and the detail page go stale on write. */
function revalidateEvent(slug: string) {
  revalidatePath("/events");
  revalidatePath(`/events/${slug}`);
}

/**
 * The server layer throws typed errors ("Not authenticated", "Event is not open
 * for registration", …). Those messages are written for humans and are safe to
 * surface, but an unexpected throw must not leak a stack or a driver message to
 * the browser, so anything that is not an Error gets a generic fallback.
 */
function toMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Please try again.";
}

export async function registerAction(
  eventId: string,
  slug: string,
): Promise<RegistrationActionResult> {
  try {
    // Null means the upsert left an existing live registration untouched —
    // a double submit, not a failure. Read back what the user actually has so
    // the button never regresses to "Register" for someone already holding a
    // seat.
    const registration =
      (await registerForEvent(eventId)) ?? (await getMyRegistration(eventId));

    revalidateEvent(slug);
    return { ok: true, status: registration?.status };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function cancelRegistrationAction(
  eventId: string,
  slug: string,
): Promise<RegistrationActionResult> {
  try {
    await cancelMyRegistration(eventId);
    revalidateEvent(slug);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
