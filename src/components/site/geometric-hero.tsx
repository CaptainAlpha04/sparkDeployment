import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** `blurred` is the softer variant the old settings/admin pages used. */
  variant?: "sharp" | "blurred";
  className?: string;
};

/**
 * The shared page hero.
 *
 * Used verbatim on seven pages in the old build (alliance, highlights, legal,
 * jobs, products, research, sponsorship), with a blurred variant on settings
 * and admin. Every one of its eight decorative shapes was completely static;
 * they now drift independently at staggered durations and phases, and the
 * bottom divider's gradient pans. One component, seven pages.
 */
export function GeometricHero({
  title,
  subtitle,
  variant = "sharp",
  className = "",
}: Props) {
  const blurred = variant === "blurred";

  return (
    <section
      className={`relative flex w-full flex-col items-center overflow-hidden p-10 pt-32 ${
        blurred ? "" : "bg-gradient-to-r from-purple-950 to-blue-950"
      } ${className}`}
    >
      <h1 className="animation-swipe-from-bottom z-10 mb-3 text-center text-4xl font-bold text-white md:text-7xl">
        {title}
      </h1>

      {subtitle && (
        <p className="animation-fade-in z-10 mb-10 text-center text-base font-light text-white/80">
          {subtitle}
        </p>
      )}

      {/* Circles */}
      <div
        className={`float-drift absolute top-24 left-32 z-0 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 ${
          blurred ? "opacity-20 blur-xl" : "opacity-30"
        }`}
        style={{
          ["--drift-duration" as string]: "14s",
          ["--drift-x" as string]: "18px",
          ["--drift-y" as string]: "-22px",
        }}
        aria-hidden
      />
      <div
        className={`float-drift absolute right-10 bottom-20 z-0 h-16 w-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-700 ${
          blurred ? "opacity-30 blur-lg" : "opacity-40"
        }`}
        style={{
          ["--drift-duration" as string]: "10s",
          ["--drift-delay" as string]: "-3s",
          ["--drift-x" as string]: "-14px",
          ["--drift-y" as string]: "16px",
        }}
        aria-hidden
      />
      <div
        className={`float-drift absolute top-32 right-32 z-0 h-20 w-20 rounded-full bg-gradient-to-bl from-pink-400 to-purple-600 ${
          blurred ? "opacity-25 blur-xl" : "opacity-40"
        }`}
        style={{
          ["--drift-duration" as string]: "16s",
          ["--drift-delay" as string]: "-6s",
          ["--drift-x" as string]: "12px",
          ["--drift-y" as string]: "20px",
        }}
        aria-hidden
      />

      {/* The sharp variant keeps the square, hairlines, corner, and divider. */}
      {!blurred && (
        <>
          <div
            className="float-drift absolute bottom-10 left-36 z-0 h-12 w-12 rotate-45 bg-gradient-to-bl from-pink-500 to-blue-600 opacity-40"
            style={{
              ["--drift-duration" as string]: "12s",
              ["--drift-delay" as string]: "-2s",
              ["--drift-x" as string]: "-16px",
              ["--drift-y" as string]: "-12px",
            }}
            aria-hidden
          />

          <div
            className="float-drift absolute top-44 left-10 z-0 h-1 w-24 bg-gradient-to-r from-blue-500 to-transparent opacity-50"
            style={{
              ["--drift-duration" as string]: "9s",
              ["--drift-x" as string]: "22px",
              ["--drift-y" as string]: "0px",
            }}
            aria-hidden
          />
          <div
            className="float-drift absolute right-24 bottom-24 z-0 h-1 w-16 bg-gradient-to-r from-purple-500 to-transparent opacity-50"
            style={{
              ["--drift-duration" as string]: "11s",
              ["--drift-delay" as string]: "-4s",
              ["--drift-x" as string]: "-18px",
              ["--drift-y" as string]: "0px",
            }}
            aria-hidden
          />

          <div
            className="float-drift absolute bottom-36 left-56 z-0 h-10 w-10 rotate-45 border-t-4 border-l-4 border-pink-400 opacity-40"
            style={{
              ["--drift-duration" as string]: "15s",
              ["--drift-delay" as string]: "-5s",
              ["--drift-x" as string]: "10px",
              ["--drift-y" as string]: "14px",
            }}
            aria-hidden
          />

          <div
            className="gradient-pan absolute bottom-0 left-0 z-0 h-1 w-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"
            aria-hidden
          />
        </>
      )}
    </section>
  );
}
