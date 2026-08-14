import { eq } from "drizzle-orm";
import { db } from "./db";
import { profiles, type Profile } from "./schema";
import { requireUser } from "./auth";
import { profileUpdateSchema } from "@/lib/validation/profile";

export async function getProfile(userId: string): Promise<Profile | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row ?? null;
}

export async function updateOwnProfile(input: unknown): Promise<Profile> {
  // requireUser FIRST, always. The id comes from the verified session, never
  // from user input — otherwise anyone could update anyone's profile, which is
  // exactly what the old client-side Firestore write allowed.
  const current = await requireUser();
  const data = profileUpdateSchema.parse(input);

  const [updated] = await db
    .update(profiles)
    .set({
      fullName: data.fullName,
      university: data.university || null,
      degree: data.degree || null,
      phone: data.phone || null,
      gradYear: data.gradYear ?? null,
      bio: data.bio || null,
    })
    .where(eq(profiles.id, current.id))
    .returning();

  return updated;
}
