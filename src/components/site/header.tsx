"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { signOut } from "@/app/(auth)/actions";

export type HeaderUser = {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/mission", label: "Our Mission" },
  { href: "/alliance", label: "Alliance" },
  { href: "/events", label: "Events" },
  { href: "/highlights", label: "Highlights" },
];

export function Header({ user }: { user: HeaderUser | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // The old header sat at full backdrop-blur-3xl over the hero from the first
  // frame. Now the blur and border build as you scroll past the fold.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    // Deferred rather than called synchronously in the effect body, which
    // would trigger a cascading render.
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const links = user?.isAdmin ? [...NAV, { href: "/admin", label: "Admin" }] : NAV;
  const initials = (user?.fullName ?? user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <header
      className={`fixed top-0 z-40 flex w-full flex-row justify-between p-2 px-5 text-gray-100 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-background/60 backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent backdrop-blur-sm"
      }`}
    >
      <Link href="/" className="flex flex-row items-center gap-2 p-1">
        <Image
          src="/images/spark web.png"
          alt="SPARK"
          width={150}
          height={40}
          className="h-9 w-auto object-contain"
          priority
        />
      </Link>

      {/* Desktop nav */}
      <nav className="hidden flex-row items-center gap-12 lg:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? "nav-selected" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Desktop right slot */}
      <div className="hidden items-center lg:flex">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full ring-offset-background transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Avatar className="size-10">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuLabel className="font-bold">
                {user.fullName ?? "Member"}
                <span className="block text-xs font-light text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut}>
                  <button type="submit" className="w-full text-left">
                    Logout
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login" className="btn-stylized">
            Join Now
          </Link>
        )}
      </div>

      {/* Hamburger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="text-gray-100 lg:hidden"
      >
        <Menu className="size-8" />
      </button>

      {/* Mobile drawer. The old one used -translate-x-full on a right-anchored
          panel, so it parked off-screen left instead of right. */}
      <div
        className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
          className="absolute top-4 right-5 text-gray-100"
        >
          <X className="size-7" />
        </button>

        <div className="m-10 mt-20">
          {user ? (
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold">{user.fullName ?? "Member"}</span>
                <span className="text-xs font-light text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-stylized">
              Join Now
            </Link>
          )}

          <nav className="mt-10 flex flex-col gap-4">
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`nav-link w-fit text-lg transition-all duration-300 ${
                  pathname === link.href ? "nav-selected" : ""
                }`}
                style={{
                  transitionDelay: isOpen ? `${80 + i * 50}ms` : "0ms",
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? "translateX(0)" : "translateX(20px)",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {user && (
            <div className="mt-10 flex flex-col gap-4">
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form action={signOut}>
                <Button type="submit" variant="outline" className="w-full">
                  Logout
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
