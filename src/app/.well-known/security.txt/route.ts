import { siteUrl } from "@/lib/site-url";

/**
 * RFC 9116 security.txt.
 *
 * The problem it solves is narrow and real: someone finds a flaw in the
 * certificate verification flow or the member data, spends ten minutes failing
 * to find anywhere to report it, and either gives up or posts it publicly.
 * This is the address that stops that.
 *
 * Expires is mandatory in the RFC and is deliberately computed rather than
 * hardcoded — a stale expiry date reads as an abandoned contact, which is
 * worse than no file. Recomputed on each request, so it can never go stale.
 */
export const dynamic = "force-dynamic";

/** The RFC recommends under a year. Six months, refreshed on every request. */
function expiry(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  // Whole seconds: the RFC wants an ISO 8601 timestamp, not millisecond noise.
  date.setMilliseconds(0);
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export async function GET() {
  const body = [
    "# Reporting a security issue in the SPARK Chapter website.",
    "#",
    "# We are a student-run organisation, not a company with a security team,",
    "# so please allow a few days for a reply. Report privately first rather",
    "# than publicly; we would much rather fix it than find out from a tweet.",
    "",
    "Contact: mailto:security@sparkchapter.com",
    `Expires: ${expiry()}`,
    "Preferred-Languages: en, ur",
    `Canonical: ${siteUrl()}/.well-known/security.txt`,
    "",
    "# Especially interested in: anything touching member data, the admin or",
    "# studio areas, or the certificate verification flow, since a forged",
    "# certificate would undermine every real one we have issued.",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
