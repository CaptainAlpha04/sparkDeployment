import { sql } from "drizzle-orm";
import { db } from "@/server/db";

/**
 * Bulk fixture cleanup.
 *
 * Deleting fixtures one row at a time worked locally against a nearby
 * database and then began timing out the default 10s afterAll hook against a
 * remote one. The failure is quiet in the worst way: the tests all pass, only
 * the hook fails, and every fixture the run created is left behind. Enough
 * runs like that and the database fills with test users and events.
 *
 * One statement per table instead, so cleanup is two round trips regardless of
 * how many fixtures a suite made.
 */
function idList(ids: string[]) {
  // Interpolating the array directly expands to a tuple, which Postgres will
  // not parse as an array. sql.join builds "in ($1, $2, ...)".
  return sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
}

export async function deleteEventsByIds(ids: string[]) {
  if (ids.length === 0) return;
  await db.execute(sql`delete from events where id in (${idList(ids)})`);
}

export async function deleteAuthUsersByIds(ids: string[]) {
  if (ids.length === 0) return;
  await db.execute(sql`delete from auth.users where id in (${idList(ids)})`);
}

export async function deleteTemplatesByIds(ids: string[]) {
  if (ids.length === 0) return;
  await db.execute(
    sql`delete from certificate_templates where id in (${idList(ids)})`,
  );
}

export async function deletePostsByIds(ids: string[]) {
  if (ids.length === 0) return;
  await db.execute(sql`delete from posts where id in (${idList(ids)})`);
}

/** Generous, because these run against a remote database. */
export const CLEANUP_TIMEOUT = 60_000;
