import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Serif,
  Inter,
  Noto_Serif_TC,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/json-ld";
import {
  ORG_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// Bricolage Grotesque carries display: variable width and optical sizing give
// headlines real personality without a second decorative face. Inter handles
// body — it is unshowy and holds up at the small sizes the new scale relies on.
// Noto Serif TC remains the 傳道部 display face on the mission hero.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Carries quotations. A sixteenth century line set in the UI sans reads like
// product copy; a high contrast serif lets it sound like a quotation.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-tc",
  subsets: ["latin"],
  weight: ["200", "400", "700", "900"],
  display: "swap",
});

/**
 * Site-wide defaults. Every page inherits these and overrides what it needs.
 *
 * metadataBase is the load-bearing line: without it Next cannot turn a
 * relative image path into the absolute URL that Open Graph requires, so
 * social cards silently fall back to no image at all. It is also what makes
 * `alternates.canonical` resolvable from a relative path on every other page.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    // Pages set a bare title and get the brand appended, so no page has to
    // remember to do it and none of them do it differently.
    template: `%s | ${SITE_NAME}`,
  },
  description: ORG_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "SPARK Chapter",
    "student innovation Pakistan",
    "NUST",
    "Islamabad",
    "student community",
    "hackathons Pakistan",
    "research",
  ],
  authors: [{ name: SITE_NAME, url: siteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_PK",
    url: siteUrl(),
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: ORG_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Uncapped on purpose: the defaults let Google show a short snippet and
      // a thumbnail, which is most of what a result is.
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  // Silences the "this site may not be mobile friendly" heuristics and gets
  // the address bar tinted to match the page rather than flashing white.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#06070f",
  colorScheme: "dark",
};

/**
 * Root layout carries fonts, tokens, and analytics only.
 *
 * Site chrome lives in (site)/layout.tsx instead, so the auth screens can be
 * full-bleed without a header floating over them. Layouts nest, so chrome in
 * the root layout could not be removed further down the tree.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Dark-first: the cosmic palette is the default. See globals.css.
      className={`dark ${bricolage.variable} ${inter.variable} ${instrumentSerif.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
        {/* Identity, stated once for the whole site. Every page's own JSON-LD
            references these by @id rather than restating them, which is what
            lets a consumer tie an article to its publisher. */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        {children}
        {/* Mounted once here so toast() works anywhere. Without it, calls
            silently no-op — which is worse than an error, because the code
            looks like it is giving feedback and is not. */}
        <Toaster position="bottom-right" />
        <Analytics />
      </body>
    </html>
  );
}
