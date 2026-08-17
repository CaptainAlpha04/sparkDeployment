import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  Award,
  CalendarDays,
  ChartNoAxesColumn,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { getCurrentProfile, isAdminRole } from "@/server/auth";
import {
  WorkspaceNav,
  type WorkspaceNavItem,
} from "@/components/workspace/workspace-nav";

// Icons are ELEMENTS, not components. This file is a Server Component and
// WorkspaceNav is a Client Component, so a bare component reference is a
// function crossing that boundary and React refuses it at render time.
const NAV: WorkspaceNavItem[] = [
  { href: "/admin", label: "Overview", icon: <LayoutDashboard /> },
  { href: "/admin/events", label: "Events", icon: <CalendarDays /> },
  { href: "/admin/members", label: "Members", icon: <Users /> },
  { href: "/admin/certificates", label: "Certificates", icon: <Award /> },
  {
    href: "/admin/stats",
    label: "Homepage figures",
    // The full label is too wide for a pill on a phone.
    shortLabel: "Figures",
    icon: <ChartNoAxesColumn />,
  },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Server-side gate. The middleware already redirects signed-out users, but
  // role is checked here — the old app's admin page had no guard of its own
  // and relied entirely on a middleware fetch that could fail open.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/admin");
  if (!isAdminRole(profile.role)) redirect("/");

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 to-background pt-16 lg:pt-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pb-10 lg:flex-row lg:gap-8 lg:py-10">
        <WorkspaceNav title="Admin" items={NAV} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
