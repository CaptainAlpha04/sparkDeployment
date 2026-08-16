import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile, isEditorRole } from "@/server/auth";

/**
 * The content workspace, for editors and admins.
 *
 * Two deliberate separations here.
 *
 * It is a separate route tree from /admin because the admin layout is the only
 * gate two of its action files have, so widening it to admit editors would
 * have quietly handed them event and stats write access. This gate is a second
 * line of defence anyway: every studio action calls requireEditor() itself.
 *
 * It sits outside the (site) group so no header or footer renders over it. A
 * writing tool competing with the site's own navigation is a writing tool
 * nobody can concentrate in, and the site header is fixed, which is what was
 * pushing the document down the page.
 */
export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/studio");
  if (!isEditorRole(profile.role)) redirect("/");

  return <div className="min-h-screen bg-[#0a0b12]">{children}</div>;
}
