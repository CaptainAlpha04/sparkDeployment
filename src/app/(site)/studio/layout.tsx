import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, PenLine, Plus } from "lucide-react";
import { getCurrentProfile, isEditorRole } from "@/server/auth";
import { SparkMark } from "@/components/brand/spark-mark";

/**
 * The content workspace, for editors and admins.
 *
 * Deliberately a separate route tree from /admin rather than a section inside
 * it. The admin layout is the only gate two of its action files have, so
 * widening it to admit editors would have quietly handed them event and stats
 * write access. Keeping the trees apart means the admin gate never has to be
 * loosened, and an editor lands somewhere built for them rather than in a
 * dashboard mostly full of things they cannot touch.
 *
 * This gate is a second line of defence, not the only one: every studio action
 * calls requireEditor() for itself.
 */
export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/studio");
  if (!isEditorRole(profile.role)) redirect("/");

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 to-background pt-20">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SparkMark className="size-5 text-primary" />
            <span className="eyebrow">Studio</span>
          </div>

          <nav className="flex items-center gap-1">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <FileText className="size-4" />
              All writing
            </Link>
            <Link
              href="/studio/new?kind=article"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <PenLine className="size-4" />
              New post
            </Link>
            <Link
              href="/studio/new?kind=case_study"
              className="inline-flex items-center gap-2 rounded-xl bg-primary/15 px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/25"
            >
              <Plus className="size-4" />
              New case study
            </Link>
          </nav>
        </div>

        {children}
      </div>
    </div>
  );
}
