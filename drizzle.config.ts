import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Defaults to the dev/test database (.env.test) so `db:migrate` and `npm test`
// always target the same database. `db:migrate:prod` sets DRIZZLE_ENV=prod to
// migrate the production project instead.
config({ path: process.env.DRIZZLE_ENV === "prod" ? ".env.local" : ".env.test" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    // Migrations use the DIRECT connection, never the 6543 pooler:
    // drizzle-kit relies on session state and long DDL transactions.
    url: process.env.DIRECT_URL!,
  },
  // Without schemaFilter, introspection sees Supabase's auth/storage/realtime
  // schemas and generates destructive DDL against them.
  schemaFilter: ["public"],
  // Prevents drizzle-kit emitting DROP ROLE for anon/authenticated/service_role.
  entities: { roles: { provider: "supabase" } },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
