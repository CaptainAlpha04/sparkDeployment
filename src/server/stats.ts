import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { siteStats, type SiteStat } from "./schema";
import { requireAdmin } from "./auth";

export async function getSiteStats(): Promise<SiteStat[]> {
  return db.select().from(siteStats).orderBy(asc(siteStats.position));
}

export async function updateSiteStat(
  key: string,
  input: { label: string; value: string },
): Promise<SiteStat> {
  // requireAdmin FIRST. These figures are public-facing claims about the
  // organisation, so editing them is an admin-only action.
  const admin = await requireAdmin();

  const label = input.label.trim();
  const value = input.value.trim();
  if (!label || !value) throw new Error("Label and value are required");
  if (label.length > 80 || value.length > 16) {
    throw new Error("Label or value too long");
  }

  const [updated] = await db
    .update(siteStats)
    .set({ label, value, updatedBy: admin.id })
    .where(eq(siteStats.key, key))
    .returning();

  if (!updated) throw new Error(`No stat with key ${key}`);
  return updated;
}
