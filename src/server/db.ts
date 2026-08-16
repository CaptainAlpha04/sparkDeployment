import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// `prepare: false` is REQUIRED on Supabase's transaction pooler (port 6543).
// postgres-js pipelines named prepared statements by default; under transaction
// pooling a follow-up statement can land on a different backend, producing
// intermittent `prepared statement "s1" does not exist` errors that pass
// locally and fail under production load. Do not remove this.
//
// `max` must be greater than 1. The common serverless advice is one socket per
// instance, but with `max: 1` and `prepare: false` this driver DEADLOCKS as
// soon as four or more queries are issued concurrently. Measured against this
// database: 2 and 3 concurrent queries succeed, 4 hangs forever with no error
// and no timeout. It took down the whole admin dashboard, because that was the
// only page issuing four counts through Promise.all.
//
// The request never fails, it simply never returns, so nothing surfaces in
// logs. Any future `Promise.all` over queries would hit the same wall.
// See src/server/db.test.ts, which pins this behaviour.
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle({ client, schema });
export type DB = typeof db;
