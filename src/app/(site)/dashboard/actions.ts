"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cancelMyRegistration } from "@/server/registrations";
import { updateOwnProfile } from "@/server/profiles";
import type { ProfileUpdateInput } from "@/lib/validation/profile";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Collapses anything thrown below the action boundary into one readable
 * sentence.
 *
 * A raw throw from a Server Action reaches production clients as the opaque
 * "An error occurred in the Server Components render", which tells the member
 * nothing. Every action here returns a result instead.
 */
function toMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    // The client validates with the same schema first, so reaching this means
    // a hand-crafted POST — still worth answering in words rather than JSON.
    return error.issues.map((issue) => issue.message).join(". ");
  }
  if (error instanceof Error) {
    if (error.name === "AuthError") {
      return "Your session has expired. Sign in again to continue.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/**
 * Cancels the caller's own registration.
 *
 * Only the event id crosses the boundary — the user is resolved from the
 * session inside `cancelMyRegistration`, so this cannot be pointed at someone
 * else's seat. Cancelling a confirmed seat promotes the next waitlisted
 * member in the same transaction, which is why `/events` is revalidated too.
 */
export async function cancelRegistrationAction(
  eventId: string,
): Promise<ActionResult> {
  try {
    if (typeof eventId !== "string" || eventId.trim() === "") {
      return { ok: false, error: "Missing event reference." };
    }

    await cancelMyRegistration(eventId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/events");
    revalidatePath("/events");

    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/**
 * Saves the caller's own profile. `role` and `email` are absent from
 * `profileUpdateSchema` and stripped by zod, so this cannot escalate.
 */
export async function updateProfileAction(
  input: ProfileUpdateInput,
): Promise<ActionResult<{ fullName: string | null }>> {
  try {
    const profile = await updateOwnProfile(input);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");

    return { ok: true, data: { fullName: profile.fullName } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
