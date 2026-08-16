import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes reachable without a session. Everything else redirects to /login.
 * Kept as an allowlist rather than a blocklist so a new protected route is
 * private by default.
 */
const PUBLIC_PREFIXES = [
  "/mission",
  "/alliance",
  "/highlights",
  "/events",
  "/legal",
  "/sponsorship",
  "/products",
  "/research",
  "/jobs",
  "/login",
  "/signup",
  "/auth",
];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // One client per request. Never hoist to module scope.
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
          // Cache-Control/Expires/Pragma. These MUST reach the response — they
          // stop a CDN caching an authenticated page and serving one user's
          // session to another.
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value),
            );
          }
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
