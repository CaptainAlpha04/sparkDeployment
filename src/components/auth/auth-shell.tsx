import Link from "next/link";
import type { ReactNode } from "react";
import StarryCanvas from "@/components/starry-canvas";
import { SparkMark } from "@/components/brand/spark-mark";

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
  /** Shown under the form. */
  footer: ReactNode;
  /**
   * The quotation carried on the visual panel.
   *
   * Real, attributable quotations rather than house copy. An invented line in
   * quotation marks reads as marketing; a sourced one does not, and these two
   * happen to state the organisation's argument better than we could.
   */
  aside: { quote: string; source: string; work: string };
};

/**
 * Split shell for sign in and sign up.
 *
 * The form sits on one side and the cosmic panel on the other, so the pages
 * keep the shape they always had. What changed is that the panel is now the
 * site's own gradient and starfield rather than a photographic background,
 * which is what made these screens look like they belonged to a different
 * product.
 *
 * These routes sit outside the (site) group deliberately, so no header or
 * footer renders over them.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  aside,
}: Props) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Form */}
      <div
        className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[46%] lg:px-16"
        style={{ background: "linear-gradient(to bottom, #0a0b16, #06070f)" }}
      >
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="group mb-12 inline-flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <SparkMark className="size-6 text-white transition-transform duration-700 group-hover:rotate-90" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              SPARK
            </span>
          </Link>

          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="mt-3 text-muted-foreground">{subtitle}</p>

          <div className="mt-9">{children}</div>

          <div className="mt-8 text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>

      {/* Visual panel. Hidden on small screens, where it would just push the
          form below the fold. */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-[54%] lg:flex-col lg:justify-end"
        style={{
          background:
            "linear-gradient(to bottom, #000000 0%, #06070f 45%, #150e2a 100%)",
        }}
      >
        <StarryCanvas numberOfStars={160} shootingStars />

        <SparkMark
          className="pointer-events-none absolute top-1/2 left-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 text-white/[0.03]"
          aria-hidden
        />

        <div
          className="float-drift absolute top-1/3 left-1/4 h-64 w-64 rounded-full opacity-30 blur-[80px]"
          style={{
            background:
              "radial-gradient(circle, #b10eca 0%, rgba(177,14,202,0) 70%)",
            ["--drift-duration" as string]: "20s",
            ["--drift-x" as string]: "40px",
            ["--drift-y" as string]: "-30px",
          }}
          aria-hidden
        />

        <blockquote className="relative z-10 max-w-xl p-14">
          <span
            className="mb-2 block font-quote text-8xl leading-none text-primary/30 select-none"
            aria-hidden
          >
            &ldquo;
          </span>
          {/* Instrument Serif, not the UI sans. A sixteenth century line set in
              the same face as the form labels beside it reads as product copy
              rather than as something someone said. */}
          <p className="font-quote text-3xl leading-[1.25] text-balance text-white/90 xl:text-4xl">
            {aside.quote}
          </p>
          <footer className="mt-6 flex flex-wrap items-baseline gap-x-2">
            <cite className="font-display text-base font-semibold not-italic">
              {aside.source}
            </cite>
            <span className="eyebrow">{aside.work}</span>
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
