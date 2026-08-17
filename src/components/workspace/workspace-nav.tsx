"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SparkMark } from "@/components/brand/spark-mark";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  /*
   * An already-rendered element, e.g. `<Users />`, NOT the component itself.
   *
   * This distinction took down /admin and /dashboard in production. The layouts
   * that supply these are Server Components and this is a Client Component, so
   * a prop holding a component reference is a function crossing that boundary,
   * which React refuses: "Functions cannot be passed directly to Client
   * Components". lucide-react does not mark its icons "use client", so they
   * are plain functions and get no exemption.
   *
   * Elements are fine — they serialize the same way `children` does.
   *
   * Nothing caught this before deploy: both routes are dynamic, so they are
   * never rendered during `next build`, and the error only happens for a
   * signed-in admin, which no build step is.
   */
  icon: ReactNode;
  /** Shorter label for the mobile strip, where horizontal room is the constraint. */
  shortLabel?: string;
};

/** Sizing lives here so every caller's icons match without repeating classes. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 [&_svg]:size-4" aria-hidden>
      {children}
    </span>
  );
}

type Props = {
  /** The eyebrow above the desktop sidebar, e.g. "Admin". */
  title: string;
  items: WorkspaceNavItem[];
};

/**
 * Navigation for the admin and dashboard workspaces.
 *
 * One component for both, because they had the same layout and the same two
 * problems. On a phone the sidebar became a full-width stack of five items
 * that pushed the actual page most of a screen down, and `sticky` on that
 * stack did nothing useful; and neither workspace marked the current page at
 * all, so there was no way to tell where you were.
 *
 * So: a horizontally scrolling strip of pills below the header on small
 * screens, and the vertical sidebar from lg upward. The strip is a scroller
 * rather than a wrap, so its height never depends on how many sections exist.
 */
export function WorkspaceNav({ title, items }: Props) {
  const pathname = usePathname();

  /*
   * Longest match wins. A prefix test alone would light up "/dashboard" on
   * every page in the workspace, since every one of them starts with it.
   */
  const activeHref =
    items
      .map((item) => item.href)
      .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b.length - a.length)[0] ?? null;

  return (
    <>
      {/* Mobile: a scrolling strip pinned under the site header ---------- */}
      <nav
        aria-label={title}
        className="sticky top-16 z-30 -mx-6 border-b border-border bg-background/85 px-6 py-2.5 backdrop-blur-xl lg:hidden"
      >
        {/*
          Negative margin plus matching padding lets the row bleed to the
          screen edges, so the last pill does not look clipped mid-word when
          the list overflows. scrollbar-none keeps a desktop-style scrollbar
          off a touch surface.
        */}
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                <Icon>{item.icon}</Icon>
                {item.shortLabel ?? item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: the sidebar ------------------------------------------- */}
      <aside className="hidden lg:block lg:w-56 lg:shrink-0">
        <div className="sticky top-28 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 px-2">
            <SparkMark className="size-5 text-primary" />
            <span className="eyebrow">{title}</span>
          </div>
          <nav aria-label={title} className="flex flex-col gap-1">
            {items.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <Icon>{item.icon}</Icon>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
