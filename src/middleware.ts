import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Session refresh on every request.
 *
 * NOTE ON NAMING: Next 16 is documented as renaming `middleware.ts` to
 * `proxy.ts` with a `proxy` export. That rename is NOT active in 16.3.1 —
 * a root or src-level `proxy.ts` is silently ignored (it produces no build
 * error and an empty middleware-manifest), while `middleware.ts` is read and
 * validated. Verified by build output, not assumed.
 *
 * When upgrading to a Next version where the rename lands, run
 * `npx @next/codemod@canary middleware-to-proxy .` and confirm the
 * middleware-manifest is non-empty afterwards.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|otf|woff2?)$).*)",
  ],
};
