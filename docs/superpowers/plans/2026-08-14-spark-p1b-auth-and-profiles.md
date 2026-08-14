# SPARK Phase 1b — Auth & Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the deleted hand-rolled auth with Supabase Auth — email/password and Google OAuth — using httpOnly cookie sessions, plus role-guarded server helpers that every later mutation depends on.

**Architecture:** `@supabase/ssr` manages session cookies. A root `proxy.ts` (Next 16's renamed middleware, Node runtime only) refreshes the session on every request. Identity is verified with `getClaims()`, which validates the JWT signature locally rather than round-tripping to the auth server. Authorization helpers live in `src/server/auth.ts` and are mandatory at the top of every mutating Server Action.

**Tech Stack:** `@supabase/ssr` (pinned exactly — it is 0.x and ships signature changes across minors), `@supabase/supabase-js`, Next 16 Server Actions, react-hook-form + zod.

**Depends on:** Plan 1a (schema, `profiles` table, `handle_new_user` trigger).

**Spec:** `docs/superpowers/specs/2026-08-14-spark-phase1-foundation-design.md` §3.4

---

## Prerequisites

- Plan 1a complete; `npm test` green.
- `.env.test` and `.env.local` populated with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- For Task 7 only: Google OAuth configured in the Supabase dashboard (Authentication → Sign In / Providers → Google). The authorised redirect URI in Google Cloud Console is **Supabase's**, not ours: `https://<ref>.supabase.co/auth/v1/callback`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/supabase/client.ts` | Browser client. |
| `src/lib/supabase/server.ts` | Server client for Server Components, Actions, Route Handlers. Async. |
| `src/lib/supabase/proxy.ts` | `updateSession` — the session refresh used by the root proxy. |
| `proxy.ts` (repo root) | Next 16 proxy entry point. |
| `src/server/auth.ts` | `getCurrentUser`, `getCurrentProfile`, `requireUser`, `requireAdmin`. |
| `src/server/profiles.ts` | Profile queries and mutations. |
| `src/app/(auth)/login/page.tsx` | Login form. |
| `src/app/(auth)/signup/page.tsx` | Signup form. |
| `src/app/(auth)/actions.ts` | `signIn`, `signUp`, `signOut`, `signInWithGoogle`. |
| `src/app/auth/callback/route.ts` | OAuth PKCE code exchange. |
| `src/app/auth/auth-code-error/page.tsx` | OAuth failure surface. |
| `src/lib/validation/auth.ts` | zod schemas shared by client and server. |

---

## Task 1: Install and pin Supabase packages

**Files:** Modify `package.json`

- [ ] **Step 1: Install with an exact pin on @supabase/ssr**

```bash
npm install @supabase/supabase-js
npm install --save-exact @supabase/ssr
```

The exact pin is deliberate. `@supabase/ssr` is still 0.x; 0.10.0 added a second `headers` argument to `setAll`, and code written against earlier minors silently drops CDN cache-control headers on authenticated responses.

- [ ] **Step 2: Verify the pin has no caret**

```bash
node -e "const p=require('./package.json');const v=p.dependencies['@supabase/ssr'];console.log(v);if(/[\^~]/.test(v))throw new Error('must be exact')"
```

Expected: a bare version like `0.12.4`, no `^`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase-js and pin @supabase/ssr exactly"
```

---

## Task 2: Supabase clients

**Files:** Create `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`

- [ ] **Step 1: Create the browser client**

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

- [ ] **Step 2: Create the server client**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server client for Server Components, Server Actions, and Route Handlers.
 *
 * ASYNC: `cookies()` is a Promise in Next 15+. Every call site must `await`
 * this. Forgetting the await yields a Promise whose `.auth.*` calls fail with
 * a confusing "not a function" error.
 *
 * Never hoist the returned client into module scope — it closes over one
 * request's cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies. Safe to ignore ONLY
            // because the root proxy refreshes tokens on every request.
            // Remove the proxy and users get randomly logged out.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase
git commit -m "feat: add supabase browser and server clients"
```

---

## Task 3: Session refresh proxy

**Files:** Create `src/lib/supabase/proxy.ts`, `proxy.ts`

Next 16 renames `middleware.ts` to `proxy.ts` with a `proxy` export. It runs on the **Node.js runtime only** — Edge is not supported there.

- [ ] **Step 1: Create `src/lib/supabase/proxy.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/", "/mission", "/alliance", "/highlights", "/events", "/legal",
  "/sponsorship", "/products", "/research", "/jobs",
  "/login", "/signup", "/auth",
];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/")),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // One client per request. Never hoist to module scope — with Fluid compute
  // the module is reused across requests and you would leak sessions.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          // These are Cache-Control/Expires/Pragma. They MUST reach the
          // response — they stop a CDN caching an authenticated page and
          // serving one user's session to another.
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do NOT put code between createServerClient and getClaims(). Interleaving
  // here has caused hard-to-debug random logouts.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user && !isPublic(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Return this exact object. To customise, build with
  // NextResponse.next({ request }) and copy cookies across with
  // myResponse.cookies.setAll(supabaseResponse.cookies.getAll()).
  // Dropping cookies desyncs browser and server and kills the session.
  return supabaseResponse;
}
```

- [ ] **Step 2: Create `src/middleware.ts`**

> **As built — important.** The Next 16 `middleware.ts` → `proxy.ts` rename is documented but **is not active in 16.3.1**. A `proxy.ts` at the repo root *or* in `src/` is silently ignored: no build error, and an empty `middleware-manifest.json`. `middleware.ts` exporting `middleware` is what actually registers. With `--src-dir` it must live at `src/middleware.ts`, not the repo root.

```ts
// src/middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|otf|woff2?)$).*)",
  ],
};
```

- [ ] **Step 3: Verify it actually registered — a passing build is NOT sufficient**

```bash
npm run build
node -e "const m=require('./.next/server/middleware-manifest.json');console.log(JSON.stringify(m.sortedMiddleware));if(!m.sortedMiddleware.length)throw new Error('middleware NOT registered')"
```

Expected: build output contains `ƒ Proxy (Middleware)`, and the manifest prints `["/"]`. An empty array means the file is in the wrong place or exports the wrong name — and the build will still succeed, which is exactly how this gets missed. Without registration every session silently expires and users are randomly logged out.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/proxy.ts proxy.ts
git commit -m "feat: add supabase session refresh proxy"
```

---

## Task 4: Authorization helpers

**Files:** Create `src/server/auth.ts`; Test `src/server/auth.test.ts`

These are the mandatory guard at the top of every mutating action. Because RLS does not constrain our own connection, these helpers *are* the authorization layer.

- [ ] **Step 1: Write the failing test**

```ts
// src/server/auth.test.ts
import { describe, expect, it } from "vitest";
import { isAdminRole, isModeratorRole } from "./auth";

describe("role predicates", () => {
  it("treats admin as admin", () => {
    expect(isAdminRole("admin")).toBe(true);
  });

  it("does not treat member or moderator as admin", () => {
    expect(isAdminRole("member")).toBe(false);
    expect(isAdminRole("moderator")).toBe(false);
  });

  it("treats both moderator and admin as moderator-capable", () => {
    expect(isModeratorRole("moderator")).toBe(true);
    expect(isModeratorRole("admin")).toBe(true);
    expect(isModeratorRole("member")).toBe(false);
  });

  it("rejects null and unknown roles", () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isModeratorRole(null)).toBe(false);
    expect(isAdminRole("superuser")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- auth.test.ts`
Expected: FAIL — cannot resolve `./auth`.

- [ ] **Step 3: Create `src/server/auth.ts`**

```ts
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "./db";
import { profiles, type Profile } from "./schema";

export type Role = "member" | "moderator" | "admin";

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export function isModeratorRole(role: string | null | undefined): boolean {
  return role === "moderator" || role === "admin";
}

/**
 * The authenticated user id, or null.
 *
 * Uses getClaims(), which verifies the JWT signature against the project's
 * published keys. Never use getSession() for this: it reads from storage
 * without revalidating, so its user object cannot be trusted server-side.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile ?? null;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** Throws unless signed in. Call at the top of every authenticated action. */
export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AuthError("Not authenticated");
  return profile;
}

/** Throws unless signed in AND admin. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (!isAdminRole(profile.role)) throw new AuthError("Not authorised");
  return profile;
}

/** Throws unless signed in AND moderator or admin. */
export async function requireModerator(): Promise<Profile> {
  const profile = await requireUser();
  if (!isModeratorRole(profile.role)) throw new AuthError("Not authorised");
  return profile;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- auth.test.ts`
Expected: PASS, all four assertions.

- [ ] **Step 5: Commit**

```bash
git add src/server/auth.ts src/server/auth.test.ts
git commit -m "feat: add role-guarded auth helpers"
```

---

## Task 5: Validation schemas

**Files:** Create `src/lib/validation/auth.ts`; Test `src/lib/validation/auth.test.ts`

Shared by client and server so validation cannot drift. The old app validated passwords only in the browser.

- [ ] **Step 1: Install**

```bash
npm install zod react-hook-form @hookform/resolvers
```

- [ ] **Step 2: Write the failing test**

```ts
// src/lib/validation/auth.test.ts
import { describe, expect, it } from "vitest";
import { signUpSchema, signInSchema } from "./auth";

describe("signUpSchema", () => {
  const valid = {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    password: "Str0ng!pass",
    confirmPassword: "Str0ng!pass",
  };

  it("accepts a valid signup", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const r = signUpSchema.safeParse({ ...valid, confirmPassword: "other" });
    expect(r.success).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    const r = signUpSchema.safeParse({ ...valid, password: "Ab1!", confirmPassword: "Ab1!" });
    expect(r.success).toBe(false);
  });

  it("requires upper, lower, digit, and symbol", () => {
    for (const pw of ["alllowercase1!", "ALLUPPERCASE1!", "NoDigits!!", "NoSymbol123"]) {
      expect(signUpSchema.safeParse({ ...valid, password: pw, confirmPassword: pw }).success).toBe(false);
    }
  });

  it("rejects a malformed email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts email and non-empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- validation/auth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Create `src/lib/validation/auth.ts`**

```ts
import { z } from "zod";

const password = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "One uppercase letter")
  .regex(/[a-z]/, "One lowercase letter")
  .regex(/\d/, "One number")
  .regex(/[^A-Za-z0-9]/, "One special character");

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Please enter your name").max(120),
    email: z.email("Enter a valid email"),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
```

> If zod v3 is installed rather than v4, `z.email()` does not exist — use `z.string().email()`. Check with `npm ls zod`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- validation/auth.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/validation package.json package-lock.json
git commit -m "feat: add shared auth validation schemas"
```

---

## Task 6: Auth server actions

**Files:** Create `src/app/(auth)/actions.ts`

- [ ] **Step 1: Create the actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signIn(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Deliberately generic: distinguishing "no such user" from "wrong
    // password" is an account-enumeration oracle.
    return { ok: false, error: "Incorrect email or password" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by the handle_new_user trigger into profiles.full_name.
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/actions.ts"
git commit -m "feat: add sign in, sign up, and sign out actions"
```

---

## Task 7: Google OAuth and callback route

**Files:** Create `src/app/auth/callback/route.ts`, `src/app/auth/auth-code-error/page.tsx`; Modify `src/app/(auth)/actions.ts`

- [ ] **Step 1: Add the OAuth action**

Append to `src/app/(auth)/actions.ts`:

```ts
export async function signInWithGoogle(next: string = "/") {
  const supabase = await createClient();
  const origin = (await headers()).get("origin")!;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) redirect("/auth/auth-code-error");
  redirect(data.url);
}
```

Add `import { headers } from "next/headers";` to the top of the file.

- [ ] **Step 2: Create the callback route**

```ts
// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Open-redirect guard: only same-origin relative paths.
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";

      // Behind Vercel's load balancer, `origin` is the internal host.
      // Without this branch the user is redirected somewhere unreachable.
      if (isLocal) return NextResponse.redirect(`${origin}${next}`);
      if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

- [ ] **Step 3: Create the error page**

```tsx
// src/app/auth/auth-code-error/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-10 text-center">
      <h1 className="text-3xl font-bold">Sign-in failed</h1>
      <p className="text-muted-foreground max-w-md">
        We could not complete your sign-in. The link may have expired or already
        been used. Please try again.
      </p>
      <Button asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </main>
  );
}
```

- [ ] **Step 4: Verify the open-redirect guard**

```bash
npm run build
```

Expected: success. Manually confirm by reading the route that `next=//evil.com` and `next=https://evil.com` both fall back to `/`.

- [ ] **Step 5: Commit**

```bash
git add src/app/auth "src/app/(auth)/actions.ts"
git commit -m "feat: add Google OAuth with PKCE callback and redirect guards"
```

---

## Task 8: Login and signup pages

**Files:** Create `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`

**Port the existing visual design.** The old pages are at `git show a630ff7:app/auth/login/page.tsx` and `.../register/page.tsx` — a split layout with a backdrop-blurred panel over a `planet-bg` gradient, logo, and the SPARK starfield. Reproduce that layout and copy; rebuild the controls on shadcn `Input`/`Button`/`Label`.

- [ ] **Step 1: Fix the bug the old forms had**

The old login and register buttons sat inside a `<form>` with no `type` attribute, defaulting to `type="submit"`. Clicking fired the handler **and** a native GET submit that reloaded the page mid-request, putting email and password in the URL.

Every button in these forms must be either `type="submit"` on a form with a real `onSubmit`/`action`, or explicitly `type="button"`. Never untyped.

- [ ] **Step 2: Create the auth route-group layout**

```tsx
// src/app/(auth)/layout.tsx
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
```

- [ ] **Step 3: Create the login page**

```tsx
// src/app/(auth)/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signInWithGoogle } from "../actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";

  async function onSubmit(formData: FormData) {
    setError(null);
    const result = await signIn(formData);
    if (result.ok) router.push(next);
    else setError(result.error);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and password to log in.
          </p>
        </div>

        <form action={(fd) => startTransition(() => { void onSubmit(fd); })} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Logging in…" : "Login"}
          </Button>
        </form>

        <form action={() => signInWithGoogle(next)}>
          <Button type="submit" variant="outline" className="w-full">
            Continue with Google
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Create the signup page**

Mirror the login page, with `fullName`, `email`, `password`, and `confirmPassword` fields calling `signUp`. On success, show "Check your email to confirm your account." rather than redirecting — Supabase requires email confirmation by default.

```tsx
// src/app/(auth)/signup/page.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, signInWithGoogle } from "../actions";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setError(null);
    const result = await signUp(formData);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="text-muted-foreground text-sm">
            Enter your details to become a member.
          </p>
        </div>

        {sent ? (
          <p className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-center text-sm">
            Check your email to confirm your account.
          </p>
        ) : (
          <>
            <form action={(fd) => startTransition(() => { void onSubmit(fd); })} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Name</Label>
                <Input id="fullName" name="fullName" required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
              </div>

              <p className="text-xs text-muted-foreground">
                Password must contain one uppercase and one lowercase letter, a
                number, and a special character.
              </p>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Registering…" : "Register"}
              </Button>
            </form>

            <form action={() => signInWithGoogle("/")}>
              <Button type="submit" variant="outline" className="w-full">
                Continue with Google
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: success, with `/login` and `/signup` in the route list.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(auth)"
git commit -m "feat: add login and signup pages"
```

---

## Task 9: Profile read and update

**Files:** Create `src/server/profiles.ts`; Test `src/server/profiles.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/server/profiles.test.ts
import { describe, expect, it } from "vitest";
import { profileUpdateSchema } from "@/lib/validation/profile";

describe("profileUpdateSchema", () => {
  it("accepts a full valid profile", () => {
    const r = profileUpdateSchema.safeParse({
      fullName: "Ada Lovelace",
      university: "NUST",
      degree: "BSCS",
      phone: "03001234567",
      gradYear: 2027,
      bio: "Builder.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an implausible graduation year", () => {
    expect(profileUpdateSchema.safeParse({ fullName: "A B", gradYear: 1800 }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ fullName: "A B", gradYear: 3000 }).success).toBe(false);
  });

  it("does not permit changing email or role", () => {
    const r = profileUpdateSchema.safeParse({
      fullName: "A B",
      email: "attacker@example.com",
      role: "admin",
    });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty("email");
    expect(r.data).not.toHaveProperty("role");
  });
});
```

The last assertion is the important one: zod strips unknown keys by default, so a crafted form post cannot escalate to admin.

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- profiles.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/lib/validation/profile.ts`**

```ts
import { z } from "zod";

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(120),
  university: z.string().max(160).optional().or(z.literal("")),
  degree: z.string().max(160).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  gradYear: z.coerce.number().int().min(1950).max(2100).optional(),
  bio: z.string().max(500).optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
```

- [ ] **Step 4: Create `src/server/profiles.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "./db";
import { profiles, type Profile } from "./schema";
import { requireUser } from "./auth";
import { profileUpdateSchema } from "@/lib/validation/profile";

export async function getProfile(userId: string): Promise<Profile | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return row ?? null;
}

export async function updateOwnProfile(input: unknown): Promise<Profile> {
  // requireUser FIRST, always. The id comes from the verified session, never
  // from user input — otherwise anyone could update anyone's profile.
  const current = await requireUser();
  const data = profileUpdateSchema.parse(input);

  const [updated] = await db
    .update(profiles)
    .set({
      fullName: data.fullName,
      university: data.university || null,
      degree: data.degree || null,
      phone: data.phone || null,
      gradYear: data.gradYear ?? null,
      bio: data.bio || null,
    })
    .where(eq(profiles.id, current.id))
    .returning();

  return updated;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- profiles.test.ts`
Expected: PASS, all three assertions.

- [ ] **Step 6: Commit**

```bash
git add src/server/profiles.ts src/server/profiles.test.ts src/lib/validation/profile.ts
git commit -m "feat: add profile read and self-update with escalation guard"
```

---

## Task 10: Authorization integration tests

**Files:** Test `src/server/authz.test.ts`

Proves the guards actually stop a member from doing admin things — the exact failure the old app had.

- [ ] **Step 1: Write the test**

```ts
// src/server/authz.test.ts
import { describe, expect, it, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { isAdminRole, isModeratorRole } from "./auth";

const ids: string[] = [];

async function makeUser(role: "member" | "moderator" | "admin") {
  const id = crypto.randomUUID();
  await db.execute(sql`
    insert into auth.users
      (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (${id}, '00000000-0000-0000-0000-000000000000', 'authenticated',
            'authenticated', ${`azt-${id}@test.dev`}, '{}'::jsonb, now(), now())
  `);
  await db.execute(sql`update profiles set role = ${role}::role where id = ${id}`);
  ids.push(id);
  return id;
}

afterAll(async () => {
  for (const id of ids) {
    await db.execute(sql`delete from auth.users where id = ${id}`);
  }
});

describe("role assignment", () => {
  it("defaults a new signup to member, never admin", async () => {
    const id = crypto.randomUUID();
    await db.execute(sql`
      insert into auth.users
        (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
      values (${id}, '00000000-0000-0000-0000-000000000000', 'authenticated',
              'authenticated', ${`def-${id}@test.dev`}, '{}'::jsonb, now(), now())
    `);
    ids.push(id);

    const rows = await db.execute(sql`select role from profiles where id = ${id}`);
    expect(rows[0].role).toBe("member");
  });

  it("stores each role faithfully", async () => {
    for (const role of ["member", "moderator", "admin"] as const) {
      const id = await makeUser(role);
      const rows = await db.execute(sql`select role from profiles where id = ${id}`);
      expect(rows[0].role).toBe(role);
    }
  });

  it("gates admin capability to admins only", async () => {
    expect(isAdminRole("member")).toBe(false);
    expect(isAdminRole("moderator")).toBe(false);
    expect(isAdminRole("admin")).toBe(true);
  });

  it("gates moderator capability to moderators and admins", async () => {
    expect(isModeratorRole("member")).toBe(false);
    expect(isModeratorRole("moderator")).toBe(true);
    expect(isModeratorRole("admin")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm test -- authz.test.ts`
Expected: PASS. A new signup defaulting to anything but `member` is a critical failure — the old app let anyone set `admin: true` from the browser console.

- [ ] **Step 3: Commit**

```bash
git add src/server/authz.test.ts
git commit -m "test: assert new users default to member and role gates hold"
```

---

## Task 11: Full verification

- [ ] **Step 1: Whole suite**

Run: `npm test`
Expected: all pass, including Plan 1a's 18.

- [ ] **Step 2: Lint, typecheck, build**

```bash
npm run lint && npm run typecheck && npm run build
```

Expected: all clean. The data-access boundary must not be triggered — `src/app/**` may import from `src/server/auth` and `src/server/profiles`, but never `src/server/db` or `src/server/schema`.

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Verify in the browser:
1. `/` loads signed out.
2. `/dashboard` redirects to `/login?next=/dashboard`.
3. Sign up → confirmation message → confirm via the emailed link → `/login`.
4. Log in → redirected to `next`.
5. A `profiles` row exists with `role = 'member'` and the name from signup.
6. Sign out → `/dashboard` redirects again.
7. `/auth/callback?next=//evil.com` redirects to `/`, not to evil.com.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore: phase 1b auth and profiles complete"
git push
```

---

## Definition of Done

- Supabase Auth handles email/password and Google, with httpOnly cookie sessions.
- Root `proxy.ts` refreshes sessions; protected routes redirect signed-out users with a `next` param.
- Identity verified via `getClaims()`; `getSession()` never drives authorization.
- `requireUser` / `requireAdmin` / `requireModerator` exist and are tested.
- New signups always land as `member`; role cannot be set through any form post.
- OAuth callback guards against open redirects and honours `x-forwarded-host`.
- Auth form buttons are explicitly typed, fixing the old accidental-GET-submit bug.
- Validation schemas shared between client and server.

**Not in this plan:** events, registration, dashboards, and the marketing page ports (Plan 1c).
