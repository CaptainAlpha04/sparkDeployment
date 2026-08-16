"use server";

import { revalidatePath } from "next/cache";
import { updateMemberRole } from "@/server/members";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const ROLES = ["member", "moderator", "admin"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AuthError") {
      return "You are not signed in as an admin any more. Sign in again.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/**
 * Changes a member's role.
 *
 * The role string is re-checked here even though the UI only offers three
 * options — a Server Action is a public POST endpoint, so the select element
 * is not the boundary. `updateMemberRole` additionally refuses to demote the
 * caller; that message is passed through verbatim because it is a real guard
 * the admin needs to read, not an internal failure.
 */
export async function updateMemberRoleAction(
  userId: string,
  role: string,
): Promise<ActionResult<{ role: Role }>> {
  try {
    if (typeof userId !== "string" || userId.trim() === "") {
      return { ok: false, error: "Missing member reference." };
    }
    if (!isRole(role)) {
      return { ok: false, error: "That is not a valid role." };
    }

    const updated = await updateMemberRole(userId, role);

    revalidatePath("/admin/members");
    revalidatePath("/admin");

    return { ok: true, data: { role: updated.role as Role } };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
