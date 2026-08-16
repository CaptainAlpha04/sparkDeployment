/**
 * The site's public origin.
 *
 * This matters more than it looks: it is baked into the QR code printed on
 * every certificate. Get it wrong and the codes on already-issued
 * certificates point somewhere that does not resolve, and there is no way to
 * correct paper that has already been handed out.
 *
 * Set NEXT_PUBLIC_SITE_URL in production. The localhost fallback exists so dev
 * works without configuration, never as something to ship.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  // Vercel provides this automatically on preview deployments.
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

/** Public verification URL for a certificate code. */
export function verifyUrl(code: string): string {
  return `${siteUrl()}/verify/${code}`;
}
