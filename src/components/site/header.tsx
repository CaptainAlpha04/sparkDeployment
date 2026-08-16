"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SparkMark } from "@/components/brand/spark-mark";
import { signOut } from "@/app/(auth)/actions";

export type HeaderUser = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  /** Editors reach the studio; admins are editors too. */
  isEditor: boolean;
};

/*
 * Blog and case studies are separate top-level entries rather than a "Writing"
 * dropdown. A dropdown would hide two real destinations behind a JavaScript
 * interaction, on a site whose whole point is being reachable by crawlers and
 * agents, and it would break the sliding indicator's flat href model.
 *
 * "Home" is gone to make room without pushing the bar to seven items, which
 * overflows at exactly the 1024px breakpoint where this nav first appears. The
 * logo links home, which is where everyone already clicks.
 */
const NAV = [
  { href: "/mission", label: "Mission" },
  { href: "/alliance", label: "Alliance" },
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Blog" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/highlights", label: "Highlights" },
];

export function Header({ user }: { user: HeaderUser | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(
    null,
  );

  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());

  // Memoised because moveIndicator closes over the result; rebuilding this
  // array on every render defeats that callback's own memoization.
  const links = useMemo(
    () => (user?.isAdmin ? [...NAV, { href: "/admin", label: "Admin" }] : NAV),
    [user?.isAdmin],
  );

  /**
   * Which nav entry the current page belongs to.
   *
   * Matched by prefix, not equality: reading /blog/some-post is still being in
   * the Blog section, and exact matching left both the highlight and the
   * sliding indicator blank on every post, event and tag page. Longest match
   * wins so /case-studies never loses to a shorter prefix.
   */
  const activeHref = useMemo(
    () =>
      links
        .map((link) => link.href)
        .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
        .sort((a, b) => b.length - a.length)[0] ?? null,
    [links, pathname],
  );
  const initials = (user?.fullName ?? user?.email ?? "?").slice(0, 1).toUpperCase();

  /** Position the sliding indicator under a given href, or the active route. */
  const moveIndicator = useCallback(
    (href: string | null) => {
      // Null when the current page is not in the nav at all — /dashboard, a
      // certificate, the 404. The indicator simply hides rather than parking
      // itself under an unrelated item.
      const target = href ?? activeHref;
      const el = target ? itemRefs.current.get(target) : undefined;
      const nav = navRef.current;

      if (!el || !nav) {
        setIndicator(null);
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setIndicator({ left: rect.left - navRect.left, width: rect.width });
    },
    [activeHref],
  );

  // Scroll state: blur/border past the fold, plus a reading-progress bar.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    // Deferred rather than called synchronously in the effect body, which
    // would trigger a cascading render.
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Park the indicator under the active route whenever it changes.
  useEffect(() => {
    const raf = requestAnimationFrame(() => moveIndicator(null));
    window.addEventListener("resize", () => moveIndicator(null));
    return () => cancelAnimationFrame(raf);
  }, [moveIndicator]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-background/70 backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {/* Reading progress. Doubles as the brand gradient making an appearance
          on every page without another decorative element. */}
      <div
        className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5">
        {/* Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <SparkMark className="size-6 text-white transition-transform duration-700 group-hover:rotate-90" />
          <span className="font-display text-lg font-extrabold tracking-tight">
            SPARK
          </span>
        </Link>

        {/* Desktop nav with a sliding indicator */}
        <nav
          ref={navRef}
          onPointerLeave={() => moveIndicator(null)}
          className="relative hidden items-center gap-1 lg:flex"
        >
          {indicator && (
            <span
              className="pointer-events-none absolute inset-y-1 rounded-full bg-white/8 transition-all duration-300 ease-out"
              style={{ left: indicator.left, width: indicator.width }}
              aria-hidden
            />
          )}

          {links.map((link) => {
            const active = activeHref === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  if (el) itemRefs.current.set(link.href, el);
                  else itemRefs.current.delete(link.href);
                }}
                onPointerEnter={() => moveIndicator(link.href)}
                onFocus={() => moveIndicator(link.href)}
                aria-current={active ? "page" : undefined}
                className={`relative z-10 rounded-full px-4 py-2 text-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  active
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <span
                    className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-orange-500 to-violet-500"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right slot */}
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="rounded-full transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Avatar className="size-9 ring-1 ring-white/15">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuLabel>
                  <span className="block font-semibold">
                    {user.fullName ?? "Member"}
                  </span>
                  {user.email && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/certificates">Certificates</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                {user.isEditor && (
                  <DropdownMenuItem asChild>
                    <Link href="/studio">Studio</Link>
                  </DropdownMenuItem>
                )}
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut} className="w-full">
                    <button type="submit" className="w-full text-left">
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-all duration-300 hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:block"
            >
              Join now
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            aria-expanded={isOpen}
            className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:hidden"
          >
            <Menu className="size-6" />
          </button>
        </div>
      </div>

      {/* Mobile drawer.
          The old build used -translate-x-full on a right-anchored panel, so it
          parked off-screen left and slid in from the wrong side. */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-2xl transition-all duration-300 ease-out lg:hidden ${
          isOpen
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "pointer-events-none translate-x-6 opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <SparkMark className="size-6 text-white" />
            <span className="font-display text-lg font-extrabold">SPARK</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="size-6" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col justify-center gap-1 px-8">
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`border-b border-white/5 py-4 text-3xl font-bold transition-all duration-300 ${
                activeHref === link.href ? "text-primary" : "text-foreground"
              }`}
              style={{
                transitionDelay: isOpen ? `${100 + i * 45}ms` : "0ms",
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "translateY(0)" : "translateY(14px)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-8 pb-12">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="mb-2 flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{user.fullName ?? "Member"}</span>
              </div>
              <Button asChild variant="outline">
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/profile" onClick={() => setIsOpen(false)}>
                  Profile
                </Link>
              </Button>
              <form action={signOut}>
                <Button type="submit" variant="ghost" className="w-full">
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block rounded-full bg-foreground px-6 py-3.5 text-center font-semibold text-background"
            >
              Join now
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
