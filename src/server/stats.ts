import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { siteStats, type SiteStat } from "./schema";
import { requireAdmin } from "./auth";

/**
 * Strict read — throws if the database is unreachable. Use in admin screens,
 * where a silent empty list would be misleading.
 */
export async function getSiteStats(): Promise<SiteStat[]> {
  return db.select().from(siteStats).orderBy(asc(siteStats.position));
}

/**
 * Resilient read for public pages.
 *
 * The homepage is the most important page on the site and it must not return
 * 500 because one decorative section could not load. On failure this logs
 * loudly and returns an empty list; the caller renders without the stats block
 * rather than taking the whole page down.
 */
export async function getSiteStatsSafe(): Promise<SiteStat[]> {
  try {
    return await getSiteStats();
  } catch (error) {
    console.error(
      "[stats] Could not load site stats; rendering homepage without them.",
      error,
    );
    return [];
  }
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
