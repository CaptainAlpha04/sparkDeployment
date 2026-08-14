import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "./db";
import { profiles, type Profile } from "./schema";

export type Role = "member" | "moderator" | "admin";

/**
 * Role predicates.
 *
 * Deliberately exact-match and deny-by-default: an unrecognised or absent
 * role is never privileged. The old app read a boolean `admin` field that any
 * visitor could set from the browser console.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export function isModeratorRole(role: string | null | undefined): boolean {
  return role === "moderator" || role === "admin";
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * The authenticated user id, or null.
 *
 * Uses getClaims(), which verifies the JWT signature against the project's
 * published keys. Never use getSession() for this — it reads from storage
 * without revalidating, so its user object cannot be trusted server-side.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile ?? null;
}

/** Throws unless signed in. Call at the top of every authenticated action. */
export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AuthError("Not authenticated");
  return profile;
}

/** Throws unless signed in AND admin. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (!isAdminRole(profile.role)) throw new AuthError("Not authorised");
  return profile;
}

/** Throws unless signed in AND moderator or admin. */
export async function requireModerator(): Promise<Profile> {
  const profile = await requireUser();
  if (!isModeratorRole(profile.role)) throw new AuthError("Not authorised");
  return profile;
}
