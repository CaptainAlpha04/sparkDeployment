import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Noto_Serif_TC } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header, type HeaderUser } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getCurrentProfile, isAdminRole } from "@/server/auth";

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
});

export const metadata: Metadata = {
  title: "SPARK Chapter | The fastest growing community",
  description:
    "SPARK is Pakistan's premier innovation community — events, research, entrepreneurship, and the people building what comes next.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await getCurrentProfile();

  const user: HeaderUser | null = profile
    ? {
        fullName: profile.fullName,
        email: null,
        avatarUrl: profile.avatarUrl,
        isAdmin: isAdminRole(profile.role),
      }
    : null;

  return (
    <html
      lang="en"
      // Dark-first: the cosmic palette is the default. See globals.css.
      className={`dark ${bricolage.variable} ${inter.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
