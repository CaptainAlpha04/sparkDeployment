import { count, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { checkIns, profiles, registrations, type Profile } from "./schema";
import { requireAdmin } from "./auth";

export type MemberRow = Profile & {
  registrationCount: number;
  attendedCount: number;
};

export async function listMembers(): Promise<MemberRow[]> {
  await requireAdmin();

  const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt));

  const regTallies = await db
    .select({ userId: registrations.userId, n: count() })
    .from(registrations)
    .where(eq(registrations.status, "confirmed"))
    .groupBy(registrations.userId);

  const attendTallies = await db
    .select({ userId: registrations.userId, n: count() })
    .from(checkIns)
    .innerJoin(registrations, eq(checkIns.registrationId, registrations.id))
    .groupBy(registrations.userId);

  return rows.map((profile) => ({
    ...profile,
    registrationCount: regTallies.find((t) => t.userId === profile.id)?.n ?? 0,
    attendedCount: attendTallies.find((t) => t.userId === profile.id)?.n ?? 0,
  }));
}

/**
 * Changes a member's role.
 *
 * Refuses to demote the caller. Without this an admin can remove their own
 * access with one click and, if they are the only admin, lock the entire
 * organisation out of its own dashboard with no recovery path short of a
 * database console.
 */
export async function updateMemberRole(
  userId: string,
  role: "member" | "moderator" | "admin",
): Promise<Profile> {
  const admin = await requireAdmin();

  if (userId === admin.id && role !== "admin") {
    throw new Error(
      "You cannot remove your own admin access. Ask another admin to do it.",
    );
  }

  const [row] = await db
    .update(profiles)
    .set({ role })
    .where(eq(profiles.id, userId))
    .returning();

  if (!row) throw new Error("Member not found");
  return row;
}
