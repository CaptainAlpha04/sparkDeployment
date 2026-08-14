# SPARK Platform Rebuild — Phase 1: Foundation

**Date:** 2026-08-14
**Status:** Approved for planning
**Scope:** Phase 1 of 3. Phases 2 (Forum) and 3 (Certificates) are sketched here only far enough to keep the Phase 1 schema from boxing them out.

---

## 1. Context

SPARK is a Pakistani student innovation community. The existing site (Next.js 14 + Firebase + a hand-rolled Redis session system) was a passion project and is being taken to production seriously. A review of the current codebase found the architecture unsalvageable for that purpose:

- The Firebase **client** SDK performs nearly all writes directly from the browser, with no Firebase Auth. Security rules must therefore be fully open. Any visitor can read every user record (including bcrypt hashes), grant themselves `admin`, or delete arbitrary data.
- `/api/verify-email` overwrites `users/{email}` with no existence check, permitting account takeover.
- The session cookie is set via `document.cookie` with no `httpOnly`/`Secure`/`SameSite`/expiry; Redis sessions never expire.
- Passwords are hashed in the browser, making the stored hash itself the credential.
- `/api/send-verification-email` accepts an arbitrary recipient and sends from the org's Gmail.
- `/api/checkSession` is unauthenticated and returns the full user record, including the password hash.

Phase 1 replaces the foundation entirely rather than patching it.

### Decisions taken during design

| Decision | Choice |
|---|---|
| Delivery | Phased: Foundation → Forum → Certificates |
| Database / Auth / Storage | Supabase |
| ORM | Drizzle + drizzle-kit |
| Sign-in | Email/password + Google OAuth |
| Event features | Capacity + waitlist, check-in/attendance, custom registration questions |
| Payments | **Out of scope.** Free events only; `ticketPrice` is dropped |
| Certificates | In-app template designer (Phase 3) |
| DB authorization | App-layer authz in Server Actions; RLS enabled with no policies, sealing the anon-key surface |
| Visual direction | **Preserve the existing UI exactly** — same layout, copy, and colour identity — rebuilt on tokens and shadcn, with substantially richer animation and effects |
| Forum shape | Reddit-style: admin-defined categories, cross-category feed, posting inside categories |
| Next.js version | 16 |
| Migration strategy | Fresh scaffold, port content across |

### Assumptions

- **No data migration.** The user base is not meaningful and existing Firestore content is not carried over. Marketing copy, images, and page structure are ported from the repo; events and members are re-entered. If this is wrong, a migration becomes a separate work item.
- The Supabase project uses **asymmetric JWT signing keys** (default for new projects). If not, `getClaims()` degrades to a network call per check — correct, just slower.
- Deployment target is Vercel.

---

## 2. Stack

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.x |
| Runtime | React | 19.2.x |
| Language | TypeScript (`strict`) | 5.x |
| Database | Supabase Postgres | — |
| ORM | Drizzle ORM + drizzle-kit | current |
| PG driver | `postgres` (postgres-js) | current |
| Auth | `@supabase/ssr` + `@supabase/supabase-js` | ssr 0.12.4 (pinned) |
| Styling | Tailwind CSS | 4.3.x |
| Components | shadcn/ui (CLI 4.x, Radix base) | current |
| Forms | react-hook-form + zod + @hookform/resolvers | 7.85 / 4.4 / 5.8 |
| Tables | @tanstack/react-table | 9.x |
| Toasts | sonner | 2.0.x |
| Icons | lucide-react | 1.31.x |
| Tests | Vitest + Playwright | current |

Node **>= 20.9** (set explicitly in Vercel project settings).

`@supabase/ssr` is pinned exactly, not caret-ranged. It is still 0.x and has shipped signature changes across minors — notably the `setAll(cookiesToSet, headers)` second argument added in 0.10.0.

### Why these replacements

**daisyUI → shadcn/ui.** daisyUI's opinionated themes fight a custom identity; every screen ends up overriding it. shadcn gives Radix accessibility primitives and components the project owns outright, which is what a genuine design system requires.

**Firebase → Supabase.** Postgres gives real relational integrity (foreign keys, transactions, row locks) that the event/registration/waitlist logic depends on and Firestore cannot provide. Supabase Auth subsumes the entire broken verification flow.

---

## 3. Architecture

### 3.1 Data access boundary

**Hard rule: `drizzle` and the database client are imported only inside `src/server/**`. No React component, page, or route handler imports them directly.**

This is load-bearing, not stylistic. Because authorization lives in application code (§3.3), every query must pass through a small, reviewable surface. An ESLint `no-restricted-imports` rule enforces the boundary, and CI fails on violation.

```
src/server/
  db.ts                 # drizzle client
  schema.ts             # drizzle schema (single source of truth)
  auth.ts               # requireUser(), requireAdmin(), requireModerator()
  events.ts             # event queries + mutations
  registrations.ts      # registration / waitlist / check-in logic
  profiles.ts           # profile queries + mutations
```

Server Actions live beside their feature but delegate to these modules.

### 3.2 Database connections

Two URLs, and mixing them up produces intermittent production-only failures:

- **`DATABASE_URL`** — transaction pooler, port **6543**, used at runtime, **with `prepare: false`**. postgres-js pipelines named prepared statements by default; under transaction pooling a follow-up statement can land on a different backend, producing sporadic `prepared statement "s1" does not exist` errors that pass locally and fail under load.
- **`DIRECT_URL`** — direct connection, port **5432**, used by drizzle-kit for migrations only. Migrations use session state and long DDL transactions that transaction pooling breaks.

```ts
// src/server/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,   // required on the 6543 transaction pooler
  max: 1,
  idle_timeout: 20,
});

export const db = drizzle({ client, schema });
```

`drizzle.config.ts` sets `dbCredentials.url` to `DIRECT_URL`, `schemaFilter: ['public']` (so introspection never emits DDL against Supabase's `auth`/`storage`/`realtime` schemas), and `entities.roles.provider: 'supabase'` (so drizzle-kit does not try to drop `anon`/`authenticated`/`service_role`).

Migrations use **`generate` + `migrate`**, never `push`. Drizzle owns the `public` schema; the Supabase CLI is used only for local stack, auth/storage configuration, and edge functions. `supabase db diff` is never run against Drizzle-managed tables.

### 3.3 Authorization model

Chosen: **application-layer authorization, with RLS enabled and deny-all as a seal on the public surface.**

The honest statement of what this does and does not buy:

- RLS **does** close the anon-key surface. The publishable key ships to every browser, and PostgREST, Realtime, and Storage are all reachable with it. `ENABLE ROW LEVEL SECURITY` with no permissive policy means that surface returns nothing.
- RLS **does not** constrain the app's own queries. Drizzle connects as `postgres`, which carries `BYPASSRLS` and owns the tables, and Postgres skips RLS for a table's owner. Policies are inert on that path.

Therefore **a forgotten `where` clause in a Server Action is a data leak with no database backstop.** The mitigations are structural: the `src/server/**` import boundary (§3.1), mandatory `requireUser()`/`requireAdmin()` at the top of every mutating action, and tests asserting cross-tenant reads return empty.

**Every table gets `.enableRLS()` with no permissive policies at all.** There are no carve-outs, because no browser code ever queries a table directly: all reads happen in Server Components and Server Actions through Drizzle, and public pages are server-rendered. If a future feature genuinely needs a client-side query, it gets a narrow policy added deliberately at that point rather than pre-emptively.

Storage is separate from table RLS: the `avatars` and `event-covers` buckets carry **public read** policies so images load without signed URLs, with writes restricted to authenticated users (own avatar) and admins (event covers).

Roles are `member | moderator | admin` on `profiles.role`. `moderator` exists from Phase 1 so Phase 2 needs no migration; in Phase 1 it grants no privileges beyond `member`.

### 3.4 Auth flow

Files: `src/lib/supabase/client.ts` (browser), `server.ts` (Server Components/Actions/Route Handlers), `proxy.ts` (session refresh).

On Next 16 the root file is **`proxy.ts`** exporting `proxy`, and it runs on the **Node.js runtime only** — Edge is not supported there. `vercel.json` function paths must reference `proxy`, not `middleware`.

Rules that prevent the classic random-logout bugs:

1. `cookies()` is async, so `createClient()` is async and **every call site must `await`** it.
2. Server Components cannot write cookies; `setAll` swallows the error in a `try/catch`. This is only safe *because* the proxy refreshes tokens each request.
3. **No code between `createServerClient(...)` and `getClaims()`** in the proxy.
4. Return the exact `supabaseResponse` object. To customise it, build with `NextResponse.next({ request })` and copy cookies via `cookies.setAll(supabaseResponse.cookies.getAll())`.
5. Never hoist a server client into module scope — one per request.

**Verifying identity uses `getClaims()`.** It validates the JWT signature locally against the project's published keys. `getSession()` is not revalidated and must never drive authorization; `getUser()` is safe but costs a network round-trip per call.

Google OAuth uses PKCE: `signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/auth/callback' } })`, with `app/auth/callback/route.ts` calling `exchangeCodeForSession`. That route must guard `next` against open redirects (reject anything not starting with `/`) and honour `x-forwarded-host` behind Vercel's load balancer, or it redirects to an internal origin.

`auth.users` is mirrored into `public.profiles` by an `AFTER INSERT` trigger. The function must be `SECURITY DEFINER SET search_path = ''` — omitting the empty search_path is a known privilege-escalation vector — and every reference inside it schema-qualified. Google's OAuth metadata arrives in `raw_user_meta_data` under `full_name` and `avatar_url`. **A failing trigger blocks signup entirely**, surfacing as an opaque `Database error saving new user`, so it gets an explicit test.

---

## 4. Schema (Phase 1)

Enums: `role`, `event_status`, `registration_status`, `question_type`, `check_in_method`.

> Enum churn note: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block and cannot be rolled back. `question_type` is the most likely to grow; if it churns in practice, migrate it to `text` + a check constraint.

**profiles**
`id` uuid PK → `auth.users(id)` ON DELETE CASCADE · `full_name` · `avatar_url` · `bio` · `university` · `degree` · `phone` · `grad_year` int · `role` role NOT NULL DEFAULT `'member'` · `created_at` · `updated_at`

The cross-schema FK uses `authUsers` from `drizzle-orm/supabase` so drizzle-kit treats `auth.users` as existing rather than trying to create it.

**events**
`id` uuid PK · `slug` text UNIQUE · `title` · `summary` · `description` (markdown) · `cover_image_url` · `venue_name` · `venue_address` · `starts_at` timestamptz · `ends_at` timestamptz · `capacity` int NULL (null = unlimited) · `registration_opens_at` · `registration_closes_at` · `status` event_status DEFAULT `'draft'` · `created_by` → profiles · `created_at` · `updated_at`

Dates are **timestamptz**, replacing the current free-text date strings. `draft` status allows building an event before announcing it.

**event_questions**
`id` · `event_id` → events CASCADE · `label` · `help_text` · `type` question_type · `options` jsonb (for select types) · `required` bool · `position` int

**registrations**
`id` · `event_id` → events CASCADE · `user_id` → profiles CASCADE · `status` registration_status · `registered_at` · `cancelled_at` · **UNIQUE (event_id, user_id)**

Keyed on `user_id`, fixing the current bug where attendees are tracked by display name and two members called "Ali" collide. Waitlist order is derived from `registered_at` rather than a stored position column, which avoids renumbering on every cancellation.

**registration_answers**
`id` · `registration_id` → registrations CASCADE · `question_id` → event_questions CASCADE · `value` jsonb · UNIQUE (registration_id, question_id)

Normalized rather than a jsonb blob on `registrations`, so admins can filter and export by answer.

**check_ins**
`id` · `registration_id` UNIQUE → registrations CASCADE · `checked_in_at` · `checked_in_by` → profiles · `method` check_in_method

Certificates (Phase 3) issue against `check_ins`, not registrations — attendance is what earns one.

Storage buckets: `avatars`, `event-covers`.

---

## 5. Event registration mechanics

The correctness-critical path. Naive implementations oversell the last seat.

**Registration is race-safe by locking the parent `events` row.** `SELECT ... FOR UPDATE` on *registrations* would not help: Postgres has no predicate locks at `read committed`, so two concurrent requests each counting 9 of 10 seats would both confirm. Locking the event row serializes all writers for that event.

```ts
export async function register(eventId: string, userId: string) {
  return db.transaction(async (tx) => {
    const [event] = await tx
      .select({ id: events.id, capacity: events.capacity })
      .from(events)
      .where(eq(events.id, eventId))
      .for('update');                       // concurrent writers block here

    if (!event) tx.rollback();

    const [{ taken }] = await tx
      .select({ taken: count() })
      .from(registrations)
      .where(and(
        eq(registrations.eventId, eventId),
        eq(registrations.status, 'confirmed'),
      ));

    const status =
      event.capacity === null || taken < event.capacity ? 'confirmed' : 'waitlisted';

    const [row] = await tx
      .insert(registrations)
      .values({ eventId, userId, status })
      .onConflictDoNothing({ target: [registrations.eventId, registrations.userId] })
      .returning();

    return row ?? null;   // null = already registered
  }, { isolationLevel: 'read committed' });
}
```

The UNIQUE constraint plus `onConflictDoNothing` makes double-submit idempotent.

**Cancellation promotes the oldest waitlisted registration** in the same transaction, under the same event-row lock.

**No external I/O inside these transactions.** Awaiting an email send or any network call holds the lock for its duration and serializes every other registrant behind it. Notifications are dispatched after commit.

Other rules:
- Registration is rejected outside the `registration_opens_at` / `registration_closes_at` window, and unless `status = 'published'`.
- Answers to `required` questions are validated with zod at the action boundary before the transaction opens.
- Check-in requires an existing confirmed registration.

---

## 6. Design system

**The existing UI is preserved, not redesigned.** Layout, section order, copy, imagery, and colour identity all carry over unchanged. What improves is the *execution*: components rebuilt on tokens and shadcn primitives, and markedly richer motion — scroll-triggered reveals, staggered entrances, parallax on the hero, hover micro-interactions, and a better starfield. No section is moved, renamed, or restyled beyond that.

The old markup remains recoverable from git history at commit `a630ff7` and is the source of truth for the port.

**Tokens before components.** shadcn is initialised with `cssVariables: true` and a base color; **both are immutable after init**, so they are decided up front.

> As built: CLI 4.18 replaced the `--base-color` flag with presets. Init ran as `shadcn init -b radix -p nova`, which set `baseColor: neutral`. This is inert — base color only seeds initial token values, and every one has been replaced by the cosmic palette. The `radix` primitive base is what matters and is as specced.

Three layers, per Tailwind 4's CSS-first model:

1. Raw OKLCH values in `:root` / `.dark` in `globals.css`.
2. `@theme inline` maps them to utilities (`--color-background: var(--background)`). The `inline` keyword preserves the `var()` indirection so overrides work at runtime.
3. Custom cosmic tokens follow the identical path — define, then expose via `@theme inline`.

The system is **dark-first**, matching the existing identity. There is no `tailwind.config.ts` in Tailwind 4; `postcss.config.mjs` uses `@tailwindcss/postcss`, and `postcss-import` and `autoprefixer` are removed. `tw-animate-css` replaces the deprecated `tailwindcss-animate`.

**Typography drops from four families to two.** Current code loads Poppins, Josefin Sans, Audiowide, and Azonix. Azonix is reserved for the SPARK wordmark; one grotesk carries all UI and body text.

**The starfield survives, rebuilt.** It is genuine brand identity, but the current implementation never cancels its `requestAnimationFrame` loop on unmount, leaking a running animation on every navigation. The rebuild cancels on cleanup, respects `prefers-reduced-motion`, and pauses when off-screen.

Colours are never written as literals in components — only token references. This is what keeps admin and member surfaces visually identical.

---

## 7. Information architecture

The current admin and settings pages are two unrelated visual languages. Phase 1 unifies them behind **one app shell with role-driven navigation**, sharing the same table, dialog, form, and toast components.

**Public** — `/` · `/mission` · `/alliance` · `/highlights` · `/legal` · `/sponsorship` · `/products` · `/research` · `/jobs` · `/events` · `/events/[slug]` · `/login` · `/signup` · `/auth/callback` · `/auth/auth-code-error`

**Member** (authenticated) — `/dashboard` · `/dashboard/events` (upcoming, past, waitlisted) · `/dashboard/profile`

**Admin** (`role = admin`) — `/admin` · `/admin/events` · `/admin/events/[id]/edit` · `/admin/events/[id]/questions` · `/admin/events/[id]/registrations` (table, CSV export, check-in) · `/admin/members` (list, role management)

Phase 2 adds `/forum`, `/forum/[category]`, `/forum/[category]/[slug]`, `/admin/forum`. Phase 3 adds `/dashboard/certificates`, `/admin/certificates`, and public `/verify/[code]`.

---

## 8. Error handling

Server Actions return discriminated results — `{ ok: true, data }` | `{ ok: false, error }` — rather than throwing across the boundary. Every action validates input with zod at its entry point; the same schema is reused client-side by react-hook-form so validation cannot drift.

`error.tsx` boundaries per route segment; `not-found.tsx` retained. User-facing feedback via sonner. Server errors are logged with context and never returned raw to the client.

---

## 9. Testing

**Vitest (unit/integration, against a local Supabase):**
- Race-safe registration: N parallel registrations against capacity 1 must yield exactly one `confirmed`. This is the single most important test in Phase 1.
- Waitlist promotion on cancellation, including promoting exactly one.
- Registration window and event-status rejection.
- Double-submit idempotency.
- `handle_new_user` trigger fires on signup for both email/password and OAuth-shaped metadata — a failing trigger silently blocks all signups.
- Authorization: a member calling an admin action is rejected; cross-user reads return empty.

**Playwright (end-to-end):** signup → email confirm → login; Google OAuth callback; register for an event; hit capacity and land on the waitlist; admin creates an event and checks someone in.

Registration logic is written test-first.

---

## 10. Deletions

Removed with the fresh scaffold: `firebase` + `app/firebaseconfig.ts`; the Redis session system (`app/lib/redis.ts`, `app/utils/session.ts`, `app/utils/cookies.ts`); browser-side bcrypt; `nodemailer` + `app/lib/mailer.ts` + both verification routes; all four `app/api/*` routes; `app/AdminLink.tsx` (dead — reads a localStorage key nothing writes); `app/..auth/` (stray typo'd directory); the `sparkweb: "file:"` self-dependency; and the unused `cors`, `ioredis`, and `redis` packages. `cors.json` is obsoleted by Supabase configuration.

Carried over: marketing copy, `public/` images and fonts, page structure, and the starfield concept.

---

## 11. Phase 2 / Phase 3 shape

Recorded so Phase 1's schema does not need reworking. Neither is designed in detail here; each gets its own spec.

**Phase 2 — Forum.** `categories` (admin-defined; seeded with the eight existing goal areas — Innovation, Collaboration, Education, Creativity, Technology, Entrepreneurship, Leadership, Research — plus General, University Admissions, Jokes, Random, Explain Me), `posts`, `comments` (self-referencing `parent_id` for threading), `votes` (unique per user per target). Home is a cross-category feed; posting always happens inside a category. User-created categories are explicitly out of scope. Rich text via Tiptap, **sanitized server-side** — editor HTML is never trusted. Moderation uses the `moderator` role already present.

**Phase 3 — Certificates.** `certificate_templates` (background image + positioned field definitions in jsonb), `certificates` (unique short code, issued_at, revoked_at, pdf_url), public `/verify/[code]`. Issued only against `check_ins`. The in-app template designer is the largest single component in the project and may warrant splitting further at planning time.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| Missing `where` in an action leaks data (no DB backstop) | `src/server/**` import boundary enforced by ESLint; `requireUser`/`requireAdmin` mandatory; authorization tests |
| `prepare: false` omitted → intermittent production failures | Set once in `db.ts`; documented; never bypassed |
| `handle_new_user` trigger failure blocks all signups | Explicit test for both auth paths |
| Turbopack is Next 16's default; a dependency's webpack config hard-fails the build | Verify build locally before first deploy; `--webpack` escape hatch |
| Two `tailwindcss` versions resolving at once (common Vercel failure) | `npm ls tailwindcss` in CI |
| TanStack Table v9 is a rewrite; most examples and training data are v8 | Follow shadcn's v9-updated data-table docs; ignore v8 snippets |
| `proxy.ts` runs on Node, not Edge — different latency profile | Accepted; measured after deploy |
| Certificate template designer (Phase 3) is larger than it looks | Re-scope at Phase 3 planning; split if needed |
