import { config } from "dotenv";

config({ path: ".env.test" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL missing. Copy .env.test.example to .env.test and fill in your Supabase connection strings.",
  );
}
