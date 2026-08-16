import Link from "next/link";
import { SparkMark } from "@/components/brand/spark-mark";

const PAGES = [
  { href: "/case-studies", label: "Case studies" },
  { href: "/legal", label: "Legal" },
  { href: "/sponsorship", label: "Sponsorships" },
  { href: "/products", label: "Products" },
  { href: "/research", label: "Research" },
  { href: "/jobs", label: "Opportunities" },
  { href: "/verify", label: "Verify a certificate" },
];

const SOCIALS = [
  {
    href: "https://www.facebook.com/profile.php?id=61564825415487&mibextid=ZbWKwL",
    label: "Facebook",
    hover: "hover:text-blue-400",
    path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.77-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z",
  },
  {
    href: "https://www.instagram.com/sparkchapter?igsh=dzZzMG01NjAxbmNi",
    label: "Instagram",
    hover: "hover:text-pink-400",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.03a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z",
  },
  {
    href: "https://chat.whatsapp.com/FYSriy557mw7FTKxWGprfS",
    label: "WhatsApp",
    hover: "hover:text-emerald-400",
    path: "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35ZM12.05 22a9.9 9.9 0 0 1-5.04-1.38l-3.52.92.94-3.43A9.93 9.93 0 1 1 12.05 22Z",
  },
  {
    href: "https://www.linkedin.com/company/sparkchapter/",
    label: "LinkedIn",
    hover: "hover:text-sky-400",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.4 21.5h5.16V9.75H2.4V21.5Zm7.42 0h5.16v-6.19c0-1.63.31-3.2 2.32-3.2 1.99 0 2.02 1.85 2.02 3.3v6.09h5.16v-7.12c0-4.46-.96-7.4-6.18-7.4-2.5 0-4.19 1.38-4.88 2.68h-.07V9.75H9.82V21.5Z",
  },
];

/**
 * Footer.
 *
 * Deliberately centred and sparse. An earlier attempt reorganised this into a
 * four-column link directory, which is the standard corporate shape and read
 * as one: the warmth here comes from the mark, the space around it, and only
 * saying a couple of things.
 *
 * Continues the page gradient rather than sitting on it as a separate slab,
 * opening on the same black the last section closes on.
 */
export function Footer() {
  return (
    <footer
      className="relative w-full overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #000000, #07080f)" }}
    >
      <div className="relative flex flex-col items-center gap-9 px-6 pt-20 pb-12 text-center">
        {/* The mark, with a glow behind it so it reads as a light source
            rather than a logo parked at the bottom of the page. */}
        <div className="relative">
          <div
            className="absolute inset-0 -z-10 scale-[2.2] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.62 0.19 296 / 0.28), transparent 70%)",
            }}
            aria-hidden
          />
          <SparkMark className="size-20 text-white/90 transition-transform duration-[1200ms] hover:rotate-180" />
        </div>

        <div className="space-y-2">
          <p className="font-display text-xl font-bold">SPARK Chapter Pakistan</p>
          <p className="mx-auto max-w-sm leading-relaxed text-muted-foreground">
            Providing an innovative platform for students since forever.
          </p>
        </div>

        <nav className="flex max-w-2xl flex-row flex-wrap place-content-center gap-x-1 gap-y-1">
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {page.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-4">
          <span className="eyebrow">Socials</span>
          <div className="flex gap-7">
            {SOCIALS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className={`text-muted-foreground transition-all duration-300 hover:-translate-y-1 ${social.hover}`}
              >
                <svg viewBox="0 0 24 24" className="size-6 fill-current">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground/50">
          Copyright © {new Date().getFullYear()}. Built by people still learning
          it themselves.
        </p>
      </div>
    </footer>
  );
}
