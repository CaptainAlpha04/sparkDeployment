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
  // Certificate verification is public by design. It exists so an employer or
  // university can confirm a certificate is genuine, and they will not have an
  // account. Requiring a login here would defeat the entire feature.
  //
  // Note this is only the verification result, which shows what is already
  // printed on the certificate. The holder's downloadable copy lives at
  // /certificates/<code> and stays behind auth.
  "/verify",
  // Published writing, and the machine-readable variants of it. A crawler has
  // no session, so anything left off this list is served a redirect to /login
  // instead of the page — which is indistinguishable, from the outside, from
  // the content not existing.
  "/blog",
  "/case-studies",
];

/**
 * Single-file public routes.
 *
 * Kept apart from the prefix list because these are exact paths, and matching
 * them by prefix would also open "/robots.txt-ish" style near misses.
 */
const PUBLIC_FILES = new Set([
  "/robots.txt",
  "/sitemap.xml",
  // The site map written for language models, and the full text behind it.
  // Both are useless if they need a login.
  "/llms.txt",
  "/llms-full.txt",
  "/manifest.webmanifest",
  // Where a security researcher looks for somewhere to report a flaw. Putting
  // it behind auth would defeat the only reason the file exists.
  "/.well-known/security.txt",
]);

/**
 * Generated social card images.
 *
 * Matched by prefix, not exact path: Next appends a content hash to these
 * routes (`/opengraph-image-fx5gi7`), so the URL cannot be written out here.
 * Everything under the name is our own generated imagery, and the scraper
 * fetching it is Slack or WhatsApp unfurling a link, with no session.
 */
function isGeneratedImage(pathname: string) {
  return (
    pathname.startsWith("/opengraph-image") ||
    pathname.endsWith("/opengraph-image") ||
    /\/opengraph-image-[a-z0-9]+$/i.test(pathname)
  );
}

export function isPublic(pathname: string) {
  if (pathname === "/") return true;
  if (PUBLIC_FILES.has(pathname)) return true;
  if (isGeneratedImage(pathname)) return true;
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
