import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Session refresh on every request.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ DO NOT RUN `npx @next/codemod@canary middleware-to-proxy .` ON THIS      │
 * │ VERSION. `next dev` prints that suggestion, and following it silently    │
 * │ breaks authentication.                                                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Next 16 is documented as renaming `middleware.ts` → `proxy.ts` with a
 * `proxy` export, but the rename is NOT active in 16.3.1. Measured on clean
 * builds, both ways:
 *
 *   src/proxy.ts      + export proxy       → sortedMiddleware: []    ✗
 *   src/middleware.ts + export middleware  → sortedMiddleware: ["/"] ✓
 *
 * The trap is that BOTH print `ƒ Proxy (Middleware)` in the build output and
 * neither errors — so a green build proves nothing. With proxy.ts the file is
 * simply never invoked: access tokens are never refreshed, and users get
 * logged out at random with no error anywhere to explain it.
 *
 * When upgrading Next, re-run the check rather than trusting the build:
 *
 *   rm -rf .next && npm run build
 *   node -e "const m=require('./.next/server/middleware-manifest.json'); \
 *     if(!m.sortedMiddleware.length) throw new Error('NOT REGISTERED')"
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|otf|woff2?)$).*)",
  ],
};
