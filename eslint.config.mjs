import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ---------------------------------------------------------------------
  // Data-access boundary.
  //
  // Authorization for this app lives in TypeScript, not in Postgres: RLS is
  // enabled with no policies (sealing the publishable-key surface), but the
  // app's own connection is the table owner and bypasses RLS entirely. That
  // makes a forgotten `where` clause a data leak with no database backstop.
  //
  // The mitigation is to keep every query inside a small, reviewable surface.
  // This rule enforces that: the DB client and schema are importable only
  // from src/server/**.
  //
  // See docs/superpowers/specs/2026-08-14-spark-phase1-foundation-design.md §3
  // ---------------------------------------------------------------------
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "drizzle-orm",
              message:
                "Database access is confined to src/server/**. Import a function from src/server instead.",
            },
            {
              name: "postgres",
              message: "Database access is confined to src/server/**.",
            },
          ],
          patterns: [
            {
              group: ["drizzle-orm/*"],
              message: "Database access is confined to src/server/**.",
            },
            {
              group: ["**/server/db", "**/server/schema", "**/server/schema/*"],
              message:
                "Do not import the DB client or schema outside src/server/**.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/**/*.ts", "drizzle.config.ts"],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;
