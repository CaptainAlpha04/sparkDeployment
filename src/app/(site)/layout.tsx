import type { ReactNode } from "react";
import { Header, type HeaderUser } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getCurrentProfile, isAdminRole } from "@/server/auth";

/**
 * Site chrome — everything except the auth screens, which are deliberately
 * full-bleed and live outside this group.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
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
    <>
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
