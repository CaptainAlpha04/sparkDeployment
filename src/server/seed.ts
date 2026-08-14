import { config } from "dotenv";

config({ path: process.env.DRIZZLE_ENV === "prod" ? ".env.local" : ".env.test" });

/**
 * Promotes an existing user to admin.
 *
 * The user must have signed up first — this deliberately does not create auth
 * users, because credentials belong to Supabase Auth, not to us. That was the
 * old app's mistake.
 *
 * Usage:
 *   npm run db:seed -- admin@example.com               (dev/test database)
 *   DRIZZLE_ENV=prod npm run db:seed -- admin@spark.pk (production)
 */
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:seed -- <email>");
    process.exit(1);
  }

  // Imported lazily so dotenv runs before src/server/db.ts reads DATABASE_URL.
  const { db } = await import("./db");
  const { sql } = await import("drizzle-orm");

  const rows = await db.execute(sql`
    update profiles set role = 'admin'
    where id = (select id from auth.users where email = ${email})
    returning id
  `);

  if (rows.length === 0) {
    console.error(
      `No user found with email ${email}. Sign up through the app first, then re-run.`,
    );
    process.exit(1);
  }

  console.log(`Promoted ${email} to admin.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
