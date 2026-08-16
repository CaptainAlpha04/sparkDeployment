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
 * request's cookies, and with Fluid compute the module is reused across
 * requests.
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
        setAll(cookiesToSet) {
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
