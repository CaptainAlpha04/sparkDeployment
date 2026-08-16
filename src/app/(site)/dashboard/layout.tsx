import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, CalendarDays, LayoutDashboard, UserRound } from "lucide-react";
import { getCurrentProfile } from "@/server/auth";
import { SparkMark } from "@/components/brand/spark-mark";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "My events", icon: CalendarDays },
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
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 to-background pt-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <aside className="lg:w-52 lg:shrink-0">
          <div className="sticky top-28 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2 px-2">
              <SparkMark className="size-5 text-primary" />
              <span className="eyebrow">You</span>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
