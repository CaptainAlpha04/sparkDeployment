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
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
});

export const db = drizzle({ client, schema });
export type DB = typeof db;
