import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Award, CalendarDays, LayoutDashboard, UserRound } from "lucide-react";
import { getCurrentProfile } from "@/server/auth";
import {
  WorkspaceNav,
  type WorkspaceNavItem,
} from "@/components/workspace/workspace-nav";

const NAV: WorkspaceNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "My events", icon: CalendarDays, shortLabel: "Events" },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/dashboard");

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 to-background pt-16 lg:pt-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-10 lg:flex-row lg:gap-8 lg:py-10">
        <WorkspaceNav title="You" items={NAV} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
