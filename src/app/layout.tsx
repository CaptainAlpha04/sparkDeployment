import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Noto_Serif_TC } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-tc",
  subsets: ["latin"],
  weight: ["200", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPARK Chapter | The fastest growing community",
  description:
    "SPARK is Pakistan's premier innovation community — events, research, entrepreneurship, and the people building what comes next.",
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
      className={`dark ${bricolage.variable} ${inter.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
