import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/server/schema";

/**
 * A test-only database handle with a real connection pool.
 *
 * The application client (src/server/db.ts) uses `max: 1`, which is correct
 * for serverless — one socket per instance — but it means every transaction
 * queues through a single connection locally. Concurrency tests written
 * against it pass whether or not the row lock exists, because the queries can
 * never actually overlap.
 *
 * This handle opens several connections so contention is genuine, reproducing
 * what happens in production when multiple instances hit the same event row.
 */
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 10,
  idle_timeout: 5,
});

export const concurrentDb = drizzle({ client, schema });

export async function closeConcurrentDb() {
  await client.end({ timeout: 5 });
}
