import { asc, eq, sql } from "drizzle-orm";
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

function slugifyKey(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || `stat_${Date.now()}`
  );
}

export async function createSiteStat(input: {
  label: string;
  value: string;
}): Promise<SiteStat> {
  const admin = await requireAdmin();

  const label = input.label.trim();
  const value = input.value.trim();
  if (!label || !value) throw new Error("Both a label and a figure are required");
  if (label.length > 80) throw new Error("Label is too long");
  if (value.length > 16) throw new Error("Figure is too long");

  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(position), -1) + 1` })
    .from(siteStats);

  const [row] = await db
    .insert(siteStats)
    .values({
      key: slugifyKey(label),
      label,
      value,
      position: next,
      updatedBy: admin.id,
    })
    .returning();

  return row;
}

export async function deleteSiteStat(key: string): Promise<void> {
  await requireAdmin();
  const [row] = await db
    .delete(siteStats)
    .where(eq(siteStats.key, key))
    .returning({ key: siteStats.key });
  if (!row) throw new Error("That figure no longer exists");
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
