# Setup — Supabase and Google OAuth

Everything the app needs from outside the codebase. Your project ref is
`pikexguxlyrgoriucpql`; substitute your own if you create a second project.

---

## 1. Supabase — already done, but here's what it was

Both `.env.local` (dev server) and `.env.test` (migrations + tests) are filled
in and gitignored. Five values, all from one project:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → Data API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Settings → API Keys → publishable (`sb_publishable_…`), or the legacy anon key |
| `DATABASE_URL` | Connect → **Transaction pooler**, port **6543** |
| `DIRECT_URL` | Connect → **Direct** or **Session pooler**, port **5432** |

The two database URLs are deliberately different and not interchangeable:

- **6543** is used at runtime. The client sets `prepare: false` because
  prepared statements break under transaction pooling — the failure is
  intermittent and only appears under load, so it passes locally and breaks in
  production.
- **5432** is used by `drizzle-kit` for migrations, which need session state and
  long DDL transactions that the transaction pooler kills.

> **Note:** `.env.local` and `.env.test` currently point at the **same**
> database. The test suite creates and deletes its own fixtures (`@test.dev`
> emails, scoped by id) so it will not touch real data — but before this handles
> anything you care about, production should get its own project.

### Applying the schema to a fresh project

```bash
npm run db:migrate          # uses .env.test
DRIZZLE_ENV=prod npm run db:migrate   # uses .env.local
```

### Making yourself an admin

Sign up through the app first — this deliberately does not create the auth
user, because credentials belong to Supabase Auth:

```bash
npm run db:seed -- you@example.com
```

---

## 2. Supabase Auth — URL configuration

**Dashboard → Authentication → URL Configuration.**

1. **Site URL** — `http://localhost:3000` for now; your real domain in
   production.
2. **Redirect URLs** — add every origin the app runs on. Supabase rejects any
   `redirectTo` not on this list, and the failure looks like a generic
   "invalid request" rather than saying what is wrong:
   ```
   http://localhost:3000/**
   https://your-domain.com/**
   https://*-your-team.vercel.app/**     ← if you use Vercel previews
   ```

**Dashboard → Authentication → Sign In / Providers → Email.** Decide whether
"Confirm email" stays on. It is on by default, and the signup screen already
says *"An email for account verification has been sent!"* — if you turn it off,
change that copy, or people will sit waiting for an email that never arrives.

---

## 3. Google OAuth

The part people get wrong: **the redirect URI you give Google is Supabase's,
not your app's.** Your `/auth/callback` route is never entered into Google.

### Google Cloud Console

1. <https://console.cloud.google.com> → create or pick a project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name, support email, developer contact.
   - **Scopes** — add these three. `openid` is not offered in the picker and
     must be typed in manually:
     ```
     openid
     .../auth/userinfo.email
     .../auth/userinfo.profile
     ```
   - While the app is in **Testing**, only accounts listed under *Test users*
     can sign in. Add your own address, or **Publish** the app.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorised JavaScript origins:**
     ```
     http://localhost:3000
     https://your-domain.com
     ```
   - **Authorised redirect URIs** — Supabase's callback, exactly:
     ```
     https://pikexguxlyrgoriucpql.supabase.co/auth/v1/callback
     ```
4. Copy the **Client ID** and **Client secret**.

### Supabase Dashboard

**Authentication → Sign In / Providers → Google** → enable, paste the Client ID
and Client secret, save.

Nothing goes in `.env` for Google. The provider secret lives in Supabase, which
is why the app never sees it.

### Verify

1. `npm run dev`, go to `/login`, click **Continue with Google**.
2. You should land back on `/` signed in.
3. Confirm a `profiles` row was created with your name and avatar:
   ```sql
   select id, full_name, avatar_url, role from profiles order by created_at desc limit 5;
   ```
   `role` must be `member`. Google puts `full_name` and `avatar_url` in
   `raw_user_meta_data`, which the `handle_new_user` trigger reads.

### When it fails

| Symptom | Cause |
|---|---|
| `redirect_uri_mismatch` from Google | The redirect URI is not *exactly* `https://<ref>.supabase.co/auth/v1/callback` |
| Lands on `/auth/auth-code-error` | The code exchange failed — usually the app origin is missing from Supabase's **Redirect URLs** allow list |
| `Database error saving new user` | The `handle_new_user` trigger raised. Covered by `src/server/schema/trigger.test.ts` — run `npm test` |
| Signed in but no profile row | Same trigger. Check it exists: `select tgname from pg_trigger where tgname = 'on_auth_user_created';` |
| Access blocked: app not verified | The consent screen is in Testing and your account is not a listed test user |

---

## 4. Deploying to Vercel

1. Set **Node 20.9+** in project settings — builds on 18 fail.
2. Add all five environment variables. `DATABASE_URL` must be the **6543**
   pooler; a direct connection will exhaust connections under serverless.
3. Add the production domain to Supabase **Redirect URLs** and to Google's
   **Authorised JavaScript origins**.
4. Run migrations against production once: `DRIZZLE_ENV=prod npm run db:migrate`.

### Do not run the middleware→proxy codemod

`next dev` suggests `npx @next/codemod@canary middleware-to-proxy .`. On Next
16.3.1 it **silently disables authentication** — `proxy.ts` is never invoked,
tokens are never refreshed, and users are logged out at random with nothing in
the logs. Both file names print the same line in the build output, so a green
build proves nothing. See the comment block in `src/middleware.ts`, which
includes the manifest assertion to re-run when you next upgrade Next.
