# SPARK Phase 1a — Foundation & Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Firebase-based scaffold with a Next.js 16 + Tailwind 4 + shadcn/ui application backed by Supabase Postgres, with the complete Phase 1 schema live behind Drizzle migrations.

**Architecture:** Fresh `create-next-app` scaffold on a branch, preserving `public/` and `docs/`. Design tokens are defined CSS-first (Tailwind 4 `@theme inline`) before any component is built. All database access is confined to `src/server/**` by an enforced ESLint boundary. Drizzle owns the `public` schema; migrations run over a direct connection while runtime queries use the transaction pooler.

**Tech Stack:** Next.js 16.3.x, React 19.2.x, TypeScript strict, Tailwind CSS 4.3.x, shadcn/ui (CLI 4.x, Radix), Drizzle ORM + drizzle-kit, postgres-js, Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-14-spark-phase1-foundation-design.md`

---

## Prerequisites

Before Task 1, confirm these are available. Stop and report if any are missing.

- **Node >= 20.9** — `node --version`
- **Docker Desktop running** — required by `supabase start` for the local stack. `docker ps` must succeed.
- **Supabase CLI** — `npx supabase --version`
- A **Supabase cloud project** created, with these values to hand: project ref, database password, project URL, publishable key.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/app/` | Routes. Phase 1a ships only the root layout and a placeholder home page. |
| `src/app/globals.css` | Tailwind import, design tokens (`:root`/`.dark`), `@theme inline` mapping. |
| `src/server/db.ts` | Drizzle client. The only place a DB connection is constructed. |
| `src/server/schema/enums.ts` | Postgres enums, shared by all tables. |
| `src/server/schema/profiles.ts` | `profiles` table, FK to `auth.users`. |
| `src/server/schema/events.ts` | `events` + `event_questions`. |
| `src/server/schema/registrations.ts` | `registrations`, `registration_answers`, `check_ins`. |
| `src/server/schema/index.ts` | Re-exports all schema; the single import surface for Drizzle. |
| `drizzle.config.ts` | drizzle-kit config. Points at `DIRECT_URL`. |
| `drizzle/` | Generated migration SQL + snapshots. Committed. |
| `supabase/` | Local stack config. |
| `eslint.config.mjs` | Includes the `src/server/**` import boundary rule. |
| `vitest.config.ts` | Test runner config. |
| `src/test/setup.ts` | Test env loading. |

Schema is split by aggregate rather than kept in one file, so later tasks touching registrations never need to load event or profile definitions into context.

---

## Task 1: Branch and scaffold

**Files:**
- Create: entire Next.js scaffold at repo root
- Delete: `app/`, `middleware.ts`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`, `.eslintrc.json`, `cors.json`
- Preserve: `public/`, `docs/`, `.git/`, `README.md`

- [ ] **Step 1: Create the branch**

```bash
git checkout -b rebuild/phase-1
```

- [ ] **Step 2: Preserve assets that survive the rebuild**

```bash
mkdir -p ../spark-preserve
cp -r public ../spark-preserve/public
```

`docs/` stays in place — it is not touched by the scaffold.

- [ ] **Step 3: Delete the old application**

```bash
rm -rf app middleware.ts next.config.mjs postcss.config.mjs tailwind.config.ts \
       tsconfig.json package.json package-lock.json .eslintrc.json cors.json public
```

- [ ] **Step 4: Scaffold Next.js 16**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir \
  --turbopack --import-alias "@/*" --use-npm --yes
```

If it refuses to write into a non-empty directory, scaffold into `../spark-tmp` with the same flags and move the generated files in, keeping `.git/` and `docs/`.

- [ ] **Step 5: Restore preserved assets**

```bash
rm -rf public
cp -r ../spark-preserve/public public
rm -rf ../spark-preserve
```

- [ ] **Step 6: Verify versions match the spec**

```bash
node -e "const p=require('./package.json');console.log('next',p.dependencies.next);console.log('react',p.dependencies.react);console.log('tailwind',p.devDependencies.tailwindcss)"
```

Expected: `next` 16.x, `react` 19.x, `tailwind` 4.x. **If Next is not 16.x, stop and report** — the plan's `proxy.ts` assumptions depend on it.

- [ ] **Step 7: Verify the app builds and runs under Turbopack**

```bash
npm run build
```

Expected: build succeeds. If it fails citing a webpack config from a dependency, retry with `npm run build -- --webpack` and note it in the commit message.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next 16 + Tailwind 4, remove Firebase application"
```

---

## Task 2: Design tokens

**Files:**
- Modify: `src/app/globals.css`

The cosmic palette is defined once, dark-first, before any component exists. Components reference tokens only — never colour literals.

- [ ] **Step 1: Replace `globals.css` entirely**

```css
@import "tailwindcss";

/*
 * SPARK design tokens.
 * Dark-first: `:root` carries the dark palette, `.light` overrides.
 * Never write a colour literal in a component — reference a token.
 */
:root {
  --background: oklch(0.14 0.02 275);
  --foreground: oklch(0.97 0.01 275);

  --card: oklch(0.18 0.025 275);
  --card-foreground: oklch(0.97 0.01 275);

  --popover: oklch(0.16 0.025 275);
  --popover-foreground: oklch(0.97 0.01 275);

  --primary: oklch(0.62 0.19 296);
  --primary-foreground: oklch(0.99 0.005 296);

  --secondary: oklch(0.24 0.03 275);
  --secondary-foreground: oklch(0.97 0.01 275);

  --muted: oklch(0.22 0.025 275);
  --muted-foreground: oklch(0.68 0.02 275);

  --accent: oklch(0.70 0.17 45);
  --accent-foreground: oklch(0.15 0.02 45);

  --destructive: oklch(0.58 0.21 25);
  --destructive-foreground: oklch(0.98 0.01 25);

  --border: oklch(0.28 0.03 275);
  --input: oklch(0.28 0.03 275);
  --ring: oklch(0.62 0.19 296);

  --radius: 0.75rem;

  /* SPARK-specific */
  --nebula: oklch(0.62 0.19 296);
  --ember: oklch(0.70 0.17 45);
  --void: oklch(0.09 0.015 275);
  --starlight: oklch(0.99 0.005 275);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-nebula: var(--nebula);
  --color-ember: var(--ember);
  --color-void: var(--void);
  --color-starlight: var(--starlight);

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

- [ ] **Step 2: Prove a token resolves**

Replace the body of `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-10">
      <h1 className="text-4xl font-bold text-primary">SPARK</h1>
      <p className="text-muted-foreground mt-2">Token check.</p>
      <div className="mt-6 h-16 w-full rounded-lg bg-nebula" />
    </main>
  );
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`
Expected: dark background, purple heading, a purple `--nebula` bar. If the bar is transparent, `@theme inline` is not mapping — check that the custom property is declared in `:root` *and* mapped in `@theme inline`.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/page.tsx
git commit -m "feat: add SPARK design tokens (dark-first, OKLCH)"
```

---

## Task 3: shadcn/ui init

**Files:**
- Create: `components.json`, `src/components/ui/*`, `src/lib/utils.ts`

`baseColor` and `cssVariables` cannot be changed after init. They are set here deliberately.

- [ ] **Step 1: Init**

> **As built:** CLI 4.18 has no `--base-color` flag — base color moved into presets, and `--css-variables` is already the default. It also prompts for a preset, which hangs a non-interactive shell, so `-p` is required.

```bash
npx shadcn@latest init -b radix -p nova --css-variables -y --force
```

`-b radix` selects the primitive layer (alternatives: `base`, `aria`). `-p nova` is the Lucide/Geist preset, matching the create-next-app fonts.

- [ ] **Step 2: Verify `components.json`**

Run: `cat components.json`
Expected: `"tailwind.cssVariables": true` and `"tailwind.config": ""` (empty — correct for Tailwind 4). `style` will read `radix-nova`.

**If `cssVariables` is false, delete `components.json` and re-run Step 1.** It cannot be fixed later. `baseColor` will read `neutral` rather than `zinc`; that is fine and not worth re-initialising for, since every colour token gets replaced in Step 3 anyway.

- [ ] **Step 3: Reconcile the palette — init WILL overwrite it**

Run: `grep -c "nebula" src/app/globals.css`

shadcn rewrites `globals.css`, replacing `--background`, `--primary`, and every other core token with its greyscale defaults, and restructures the file as light-first with a `.dark` block. The SPARK-specific tokens (`--nebula`, `--ember`, `--void`, `--starlight`) survive; the palette does not.

Reconcile by hand: **keep** shadcn's structural additions (`@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`, `@custom-variant dark`, sidebar and chart tokens, the radius scale, `@layer base`), and **restore** the cosmic values from Task 2 into both `:root` and `.dark`.

Two defects in shadcn's output to fix while you are in there:
- It emits `--font-sans: var(--font-sans);` — self-referential, resolving to nothing. Change to `var(--font-geist-sans)`.
- Add `dark` to the `<html>` className in `src/app/layout.tsx`, so `dark:` variants resolve against the dark-first palette.

Verify with a build, then confirm the compiled CSS carries the cosmic purple rather than shadcn's grey:

```bash
npm run build
grep -o "primary:#[0-9a-f]*" $(find .next -name "*.css" -path "*static*" | head -1) | head -2
```

Expected: `primary:#9367e9`. If you see a grey like `#171717`, the reconcile did not take.

- [ ] **Step 4: Add the base component set**

```bash
npx shadcn@latest add button input label card dialog dropdown-menu \
  select textarea badge avatar table tabs sheet skeleton sonner --yes
```

- [ ] **Step 5: Verify the build still passes**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: init shadcn/ui with zinc base and CSS variables"
```

---

## Task 4: ESLint data-access boundary

**Files:**
- Modify: `eslint.config.mjs`

This rule is the primary structural mitigation for app-layer authorization. It must exist before any query is written.

- [ ] **Step 1: Add the rule**

Append to the exported config array in `eslint.config.mjs`:

```js
  {
    rules: {
      "no-restricted-imports": ["error", {
        paths: [
          { name: "drizzle-orm", message: "Database access is confined to src/server/**. Import a function from src/server instead." },
          { name: "postgres", message: "Database access is confined to src/server/**." },
        ],
        patterns: [
          { group: ["drizzle-orm/*"], message: "Database access is confined to src/server/**." },
          { group: ["**/server/db", "**/server/schema", "**/server/schema/*"], message: "Do not import the DB client or schema outside src/server/**." },
        ],
      }],
    },
  },
  {
    files: ["src/server/**/*.ts"],
    rules: { "no-restricted-imports": "off" },
  },
```

- [ ] **Step 2: Prove the rule fires**

Create `src/app/boundary-check.ts`:

```ts
import { eq } from "drizzle-orm";
export const x = eq;
```

Run: `npx eslint src/app/boundary-check.ts`
Expected: FAIL — "Database access is confined to src/server/**."

- [ ] **Step 3: Prove the exemption works**

```bash
mkdir -p src/server
mv src/app/boundary-check.ts src/server/boundary-check.ts
npx eslint src/server/boundary-check.ts
```

Expected: PASS, no errors.

- [ ] **Step 4: Remove the probe and commit**

```bash
rm src/server/boundary-check.ts
git add eslint.config.mjs
git commit -m "feat: enforce src/server data-access boundary in eslint"
```

---

## Task 5: Vitest setup

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Install**

> **As built:** `@vitejs/plugin-react` is deliberately omitted. It pulls `@babel/core@8` via `@rolldown/plugin-babel`, which conflicts with shadcn's `@babel/core@7` and fails install with ERESOLVE. No Phase 1a test renders React, so it is not needed. Add it (with an override) only when component tests arrive.

```bash
npm install -D vitest vite-tsconfig-paths dotenv cross-env tsx
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    fileParallelism: false, // DB tests share one database
    testTimeout: 20_000,
  },
});
```

`fileParallelism: false` matters — the registration concurrency tests in Plan 1c mutate shared rows and will produce false failures if files run in parallel.

- [ ] **Step 3: Create `src/test/setup.ts`**

```ts
import { config } from "dotenv";

config({ path: ".env.test" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing. Copy .env.test.example to .env.test and run `npx supabase start`.");
}
```

- [ ] **Step 4: Add scripts to `package.json`**

```json
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:migrate:prod": "cross-env DRIZZLE_ENV=prod drizzle-kit migrate"
```

- [ ] **Step 5: Verify the runner starts and fails for the right reason**

Run: `npm test`
Expected: FAIL with "DATABASE_URL missing" — this proves setup runs. Task 6 supplies the value.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json package-lock.json
git commit -m "test: add vitest with serial db-test execution"
```

---

## Task 6: Supabase local stack and environment

**Files:**
- Create: `supabase/config.toml` (generated), `.env.local`, `.env.test`, `.env.example`, `.env.test.example`
- Modify: `.gitignore`

- [ ] **Step 1: Init and start the local stack**

```bash
npx supabase init
npx supabase start
```

Expected: a table of local URLs and keys. Note `DB URL`, `API URL`, and the publishable/anon key. If Docker is not running this fails — start Docker Desktop and retry.

- [ ] **Step 2: Create `.env.example`** (committed; no secrets)

```bash
# Supabase (cloud)
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Runtime queries — transaction pooler, port 6543. Requires prepare:false.
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres

# Migrations only — direct connection, port 5432.
DIRECT_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
```

- [ ] **Step 3: Create `.env.test.example`** (committed)

```bash
# Local Supabase stack (`npx supabase start`). Both URLs are direct; there is no local pooler.
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key from `supabase start` output>
```

- [ ] **Step 4: Create the real env files**

```bash
cp .env.test.example .env.test
cp .env.example .env.local
```

Fill `.env.test` with the actual anon key from Step 1's output. Fill `.env.local` with the cloud project values.

- [ ] **Step 5: Confirm secrets are ignored**

Run: `git check-ignore .env.local .env.test`
Expected: both paths printed. If not, add to `.gitignore`:

```
.env.local
.env.test
```

- [ ] **Step 6: Commit**

```bash
git add .env.example .env.test.example .gitignore supabase/
git commit -m "chore: add supabase local stack and env templates"
```

---

## Task 7: Drizzle client and config

**Files:**
- Create: `src/server/db.ts`, `drizzle.config.ts`, `src/server/schema/index.ts`

- [ ] **Step 1: Install**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

- [ ] **Step 2: Create `src/server/schema/index.ts`** (empty barrel for now)

```ts
export {};
```

- [ ] **Step 3: Create `src/server/db.ts`**

```ts
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
```

- [ ] **Step 4: Create `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Defaults to the LOCAL stack (.env.test) so `db:migrate` and `npm test` always
// target the same database. Set DRIZZLE_ENV=prod to migrate the cloud project.
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
```

- [ ] **Step 5: Verify drizzle-kit reads the config**

Run: `npx drizzle-kit generate --name init`
Expected: "No schema changes, nothing to migrate" or an empty migration — it connects and finds no tables. If it errors on connection, check `DIRECT_URL` in `.env.local`.

- [ ] **Step 6: Commit**

```bash
git add src/server drizzle.config.ts package.json package-lock.json
git commit -m "feat: add drizzle client with transaction-pooler safety"
```

---

## Task 8: Enums and profiles schema

**Files:**
- Create: `src/server/schema/enums.ts`, `src/server/schema/profiles.ts`
- Modify: `src/server/schema/index.ts`
- Test: `src/server/schema/schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/server/schema/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";

describe("profiles table", () => {
  it("exists with the expected columns", async () => {
    const rows = await db.execute(sql`
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
    `);
    const cols = rows.map((r) => r.column_name as string);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id", "full_name", "avatar_url", "bio", "university",
        "degree", "phone", "grad_year", "role", "created_at", "updated_at",
      ]),
    );
  });

  it("cascades from auth.users", async () => {
    const rows = await db.execute(sql`
      select rc.delete_rule
      from information_schema.referential_constraints rc
      join information_schema.table_constraints tc
        on tc.constraint_name = rc.constraint_name
      where tc.table_name = 'profiles' and tc.constraint_type = 'FOREIGN KEY'
    `);
    expect(rows.map((r) => r.delete_rule)).toContain("CASCADE");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- schema.test.ts`
Expected: FAIL — the `profiles` relation does not exist, so the column list is empty.

- [ ] **Step 3: Create `src/server/schema/enums.ts`**

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["member", "moderator", "admin"]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft", "published", "cancelled", "completed",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "confirmed", "waitlisted", "cancelled",
]);

// NOTE: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction and cannot
// be rolled back. If this set churns in practice, migrate to text + a check
// constraint rather than fighting enum migrations.
export const questionTypeEnum = pgEnum("question_type", [
  "short_text", "long_text", "select", "multi_select",
  "number", "email", "url", "checkbox",
]);

export const checkInMethodEnum = pgEnum("check_in_method", ["qr", "manual"]);
```

- [ ] **Step 4: Create `src/server/schema/profiles.ts`**

```ts
import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { roleEnum } from "./enums";

export const profiles = pgTable("profiles", {
  // FK into Supabase's auth schema. `authUsers` is marked as existing, so
  // drizzle-kit references it without trying to create auth.users.
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  university: text("university"),
  degree: text("degree"),
  phone: text("phone"),
  gradYear: integer("grad_year"),
  role: roleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}).enableRLS();

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
```

`.enableRLS()` with no policy is deliberate: it seals the publishable-key surface. All reads go through `src/server/**`.

- [ ] **Step 5: Update `src/server/schema/index.ts`**

```ts
export * from "./enums";
export * from "./profiles";
```

- [ ] **Step 6: Generate and apply the migration**

```bash
npm run db:generate -- --name profiles
npm run db:migrate
```

Expected: a file appears under `drizzle/`, and migrate reports success.

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -- schema.test.ts`
Expected: PASS, both assertions.

- [ ] **Step 8: Commit**

```bash
git add src/server drizzle
git commit -m "feat: add profiles schema with auth.users cascade"
```

---

## Task 9: Events and event questions schema

**Files:**
- Create: `src/server/schema/events.ts`
- Modify: `src/server/schema/index.ts`
- Test: `src/server/schema/events.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/server/schema/events.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { events } from "./events";

describe("events table", () => {
  it("stores timestamps with time zone", async () => {
    const rows = await db.execute(sql`
      select column_name, data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'events'
        and column_name in ('starts_at', 'ends_at')
    `);
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.data_type).toBe("timestamp with time zone");
    }
  });

  it("allows null capacity meaning unlimited", async () => {
    const rows = await db.execute(sql`
      select is_nullable from information_schema.columns
      where table_schema = 'public' and table_name = 'events' and column_name = 'capacity'
    `);
    expect(rows[0].is_nullable).toBe("YES");
  });

  it("enforces slug uniqueness", async () => {
    const base = {
      slug: "dup-slug-test",
      title: "A",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3600_000),
    };
    await db.insert(events).values(base);
    await expect(db.insert(events).values(base)).rejects.toThrow();
    await db.execute(sql`delete from events where slug = 'dup-slug-test'`);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- events.test.ts`
Expected: FAIL — cannot import `./events`, module does not exist.

- [ ] **Step 3: Create `src/server/schema/events.ts`**

```ts
import {
  pgTable, uuid, text, integer, boolean, timestamp, jsonb, index,
} from "drizzle-orm/pg-core";
import { eventStatusEnum, questionTypeEnum } from "./enums";
import { profiles } from "./profiles";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  description: text("description"), // markdown
  coverImageUrl: text("cover_image_url"),
  venueName: text("venue_name"),
  venueAddress: text("venue_address"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  // null = unlimited capacity
  capacity: integer("capacity"),
  registrationOpensAt: timestamp("registration_opens_at", { withTimezone: true }),
  registrationClosesAt: timestamp("registration_closes_at", { withTimezone: true }),
  status: eventStatusEnum("status").notNull().default("draft"),
  createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("events_status_starts_at_idx").on(t.status, t.startsAt),
]).enableRLS();

export const eventQuestions = pgTable("event_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  helpText: text("help_text"),
  type: questionTypeEnum("type").notNull(),
  // Choices for select / multi_select. Shape: string[]
  options: jsonb("options").$type<string[]>(),
  required: boolean("required").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("event_questions_event_id_position_idx").on(t.eventId, t.position),
]).enableRLS();

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventQuestion = typeof eventQuestions.$inferSelect;
export type NewEventQuestion = typeof eventQuestions.$inferInsert;
```

- [ ] **Step 4: Update `src/server/schema/index.ts`**

```ts
export * from "./enums";
export * from "./profiles";
export * from "./events";
```

- [ ] **Step 5: Generate and apply**

```bash
npm run db:generate -- --name events
npm run db:migrate
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- events.test.ts`
Expected: PASS, all three assertions.

- [ ] **Step 7: Commit**

```bash
git add src/server drizzle
git commit -m "feat: add events and event_questions schema"
```

---

## Task 10: Registrations, answers, and check-ins schema

**Files:**
- Create: `src/server/schema/registrations.ts`
- Modify: `src/server/schema/index.ts`
- Test: `src/server/schema/registrations.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/server/schema/registrations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";

describe("registrations schema", () => {
  it("enforces one registration per user per event", async () => {
    const rows = await db.execute(sql`
      select indexdef from pg_indexes
      where schemaname = 'public' and tablename = 'registrations'
    `);
    const defs = rows.map((r) => r.indexdef as string).join("\n");
    expect(defs).toMatch(/UNIQUE.*event_id.*user_id/i);
  });

  it("enforces one check-in per registration", async () => {
    const rows = await db.execute(sql`
      select indexdef from pg_indexes
      where schemaname = 'public' and tablename = 'check_ins'
    `);
    const defs = rows.map((r) => r.indexdef as string).join("\n");
    expect(defs).toMatch(/UNIQUE.*registration_id/i);
  });

  it("enforces one answer per question per registration", async () => {
    const rows = await db.execute(sql`
      select indexdef from pg_indexes
      where schemaname = 'public' and tablename = 'registration_answers'
    `);
    const defs = rows.map((r) => r.indexdef as string).join("\n");
    expect(defs).toMatch(/UNIQUE.*registration_id.*question_id/i);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- registrations.test.ts`
Expected: FAIL — the tables do not exist, so no index definitions match.

- [ ] **Step 3: Create `src/server/schema/registrations.ts`**

```ts
import {
  pgTable, uuid, timestamp, jsonb, unique, index,
} from "drizzle-orm/pg-core";
import { registrationStatusEnum, checkInMethodEnum } from "./enums";
import { profiles } from "./profiles";
import { events, eventQuestions } from "./events";

export const registrations = pgTable("registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  status: registrationStatusEnum("status").notNull(),
  // Waitlist order derives from registeredAt — no stored position column, so
  // cancellations never require renumbering.
  registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
}, (t) => [
  // Makes double-submit idempotent via onConflictDoNothing.
  unique("registrations_event_user_unique").on(t.eventId, t.userId),
  index("registrations_event_status_registered_idx")
    .on(t.eventId, t.status, t.registeredAt),
]).enableRLS();

export const registrationAnswers = pgTable("registration_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull()
    .references(() => eventQuestions.id, { onDelete: "cascade" }),
  value: jsonb("value").notNull(),
}, (t) => [
  unique("registration_answers_registration_question_unique")
    .on(t.registrationId, t.questionId),
]).enableRLS();

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id").notNull().unique()
    .references(() => registrations.id, { onDelete: "cascade" }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
  checkedInBy: uuid("checked_in_by").references(() => profiles.id, { onDelete: "set null" }),
  method: checkInMethodEnum("method").notNull(),
}).enableRLS();

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type RegistrationAnswer = typeof registrationAnswers.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
```

- [ ] **Step 4: Update `src/server/schema/index.ts`**

```ts
export * from "./enums";
export * from "./profiles";
export * from "./events";
export * from "./registrations";
```

- [ ] **Step 5: Generate and apply**

```bash
npm run db:generate -- --name registrations
npm run db:migrate
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- registrations.test.ts`
Expected: PASS, all three assertions.

- [ ] **Step 7: Commit**

```bash
git add src/server drizzle
git commit -m "feat: add registrations, answers, and check-ins schema"
```

---

## Task 11: Verify RLS is enabled everywhere

**Files:**
- Test: `src/server/schema/rls.test.ts`

RLS is the only thing standing between the public publishable key and the entire database. This test is the guard against a future table shipping without it.

- [ ] **Step 1: Write the test**

Create `src/server/schema/rls.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";

describe("row level security", () => {
  it("is enabled on every public table", async () => {
    const rows = await db.execute(sql`
      select c.relname as table_name, c.relrowsecurity as rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and c.relname not like '__drizzle%'
    `);

    expect(rows.length).toBeGreaterThan(0);
    const unprotected = rows
      .filter((r) => r.rls_enabled === false)
      .map((r) => r.table_name);

    expect(unprotected).toEqual([]);
  });

  it("grants no permissive policies (deny-all by design)", async () => {
    const rows = await db.execute(sql`
      select tablename, policyname from pg_policies where schemaname = 'public'
    `);
    // Phase 1 deliberately ships zero policies: all access is server-side.
    expect(rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm test -- rls.test.ts`
Expected: PASS. If a table appears in `unprotected`, add `.enableRLS()` to its schema definition, regenerate, and re-migrate.

- [ ] **Step 3: Commit**

```bash
git add src/server/schema/rls.test.ts
git commit -m "test: assert RLS enabled and no permissive policies"
```

---

## Task 12: Profile trigger on auth.users

**Files:**
- Create: `drizzle/<timestamp>_profile_trigger/migration.sql` (via `--custom`)
- Test: `src/server/schema/trigger.test.ts`

A failing trigger blocks **all** signups with an opaque `Database error saving new user`. It gets a test.

- [ ] **Step 1: Write the failing test**

Create `src/server/schema/trigger.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../db";

async function createAuthUser(email: string, meta: Record<string, unknown>) {
  const id = crypto.randomUUID();
  await db.execute(sql`
    insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (${id}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            ${email}, ${JSON.stringify(meta)}::jsonb, now(), now())
  `);
  return id;
}

describe("handle_new_user trigger", () => {
  it("creates a profile for an email/password signup", async () => {
    const id = await createAuthUser(`pw-${Date.now()}@test.dev`, { full_name: "Pass Word" });
    const rows = await db.execute(sql`select full_name, role from profiles where id = ${id}`);
    expect(rows).toHaveLength(1);
    expect(rows[0].full_name).toBe("Pass Word");
    expect(rows[0].role).toBe("member");
    await db.execute(sql`delete from auth.users where id = ${id}`);
  });

  it("maps Google OAuth metadata keys", async () => {
    const id = await createAuthUser(`oauth-${Date.now()}@test.dev`, {
      full_name: "Goo Gle",
      avatar_url: "https://example.com/a.png",
    });
    const rows = await db.execute(sql`select full_name, avatar_url from profiles where id = ${id}`);
    expect(rows[0].full_name).toBe("Goo Gle");
    expect(rows[0].avatar_url).toBe("https://example.com/a.png");
    await db.execute(sql`delete from auth.users where id = ${id}`);
  });

  it("cascades profile deletion", async () => {
    const id = await createAuthUser(`del-${Date.now()}@test.dev`, {});
    await db.execute(sql`delete from auth.users where id = ${id}`);
    const rows = await db.execute(sql`select 1 from profiles where id = ${id}`);
    expect(rows).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- trigger.test.ts`
Expected: FAIL — no profile row is created, `rows` is empty.

- [ ] **Step 3: Scaffold a custom migration**

```bash
npx drizzle-kit generate --custom --name profile_trigger
```

- [ ] **Step 4: Write the trigger into the generated SQL file**

```sql
-- SECURITY DEFINER with an EMPTY search_path is mandatory: omitting it is a
-- documented privilege-escalation vector. Consequence: every reference below
-- must be fully schema-qualified.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 5: Apply**

Run: `npm run db:migrate`
Expected: success.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- trigger.test.ts`
Expected: PASS, all three assertions.

- [ ] **Step 7: Commit**

```bash
git add drizzle src/server/schema/trigger.test.ts
git commit -m "feat: mirror auth.users into profiles via trigger"
```

---

## Task 13: Storage buckets

**Files:**
- Create: `drizzle/<timestamp>_storage_buckets/migration.sql` (via `--custom`)

- [ ] **Step 1: Scaffold the migration**

```bash
npx drizzle-kit generate --custom --name storage_buckets
```

- [ ] **Step 2: Write the bucket definitions and policies**

```sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

-- Public read: these are profile pictures and event posters shown to anonymous
-- visitors. Signed URLs would add latency for no benefit.
create policy "avatars are publicly readable" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "event covers are publicly readable" on storage.objects
  for select using (bucket_id = 'event-covers');

-- Writes: a user may only write within a folder named for their own uid.
create policy "users write own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Event covers are written server-side by admins; no client-side insert policy.
```

- [ ] **Step 3: Apply**

Run: `npm run db:migrate`
Expected: success.

- [ ] **Step 4: Verify the buckets exist**

Run: `npx supabase status` then check Studio at the printed URL, or:

```bash
npx supabase db query "select id, public from storage.buckets"
```

Expected: `avatars` and `event-covers`, both `public = true`.

- [ ] **Step 5: Commit**

```bash
git add drizzle
git commit -m "feat: add avatars and event-covers storage buckets"
```

---

## Task 14: Seed script

**Files:**
- Create: `src/server/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `src/server/seed.ts`**

```ts
import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Promotes an existing user to admin. The user must have signed up first —
 * this does not create auth users, since password hashing belongs to Supabase.
 *
 * Usage: npm run db:seed -- admin@example.com
 */
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:seed -- <email>");
    process.exit(1);
  }

  const result = await db.execute(sql`
    update profiles set role = 'admin'
    where id = (select id from auth.users where email = ${email})
    returning id
  `);

  if (result.length === 0) {
    console.error(`No user found with email ${email}. Sign up first, then re-run.`);
    process.exit(1);
  }

  console.log(`Promoted ${email} to admin.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the script to `package.json`**

```json
    "db:seed": "tsx src/server/seed.ts"
```

- [ ] **Step 3: Install tsx**

```bash
npm install -D tsx
```

- [ ] **Step 4: Verify the error path**

Run: `npm run db:seed -- nobody@nowhere.test`
Expected: exit 1 with "No user found with email nobody@nowhere.test. Sign up first, then re-run."

- [ ] **Step 5: Commit**

```bash
git add src/server/seed.ts package.json package-lock.json
git commit -m "feat: add admin promotion seed script"
```

---

## Task 15: Full verification

- [ ] **Step 1: Run the whole suite**

Run: `npm test`
Expected: all tests pass across `schema.test.ts`, `events.test.ts`, `registrations.test.ts`, `rls.test.ts`, `trigger.test.ts`.

- [ ] **Step 2: Lint**

Run: `npx eslint .`
Expected: no errors. The data-access boundary rule must not be triggered by any file.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Check for duplicate Tailwind versions**

Run: `npm ls tailwindcss`
Expected: exactly one entry, `4.x`. Two resolved versions is the most common Vercel build failure for Tailwind 4.

- [ ] **Step 6: Verify migrations replay from scratch**

```bash
npx supabase db reset
npm run db:migrate
npm test
```

Expected: reset succeeds, all migrations apply cleanly in order, all tests pass. This proves the migration chain is valid for a fresh production database.

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "chore: phase 1a foundation and data layer complete"
git push -u origin rebuild/phase-1
```

---

## Definition of Done

- Next 16 + React 19 + Tailwind 4 + shadcn/ui scaffold builds and runs.
- Design tokens defined dark-first in OKLCH and mapped through `@theme inline`.
- Firebase, Redis sessions, browser bcrypt, nodemailer, and all old API routes deleted.
- Full Phase 1 schema live: profiles, events, event_questions, registrations, registration_answers, check_ins.
- RLS enabled on every table with zero permissive policies, asserted by test.
- `handle_new_user` trigger creates profiles for both email/password and OAuth signups, asserted by test.
- Storage buckets configured with public read and owner-scoped writes.
- ESLint blocks database imports outside `src/server/**`, verified by probe.
- Migrations replay cleanly from `supabase db reset`.

**Not in this plan:** authentication flows and UI (Plan 1b), event/registration logic and dashboards (Plan 1c).
