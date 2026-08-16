import Image from "next/image";

/**
 * 404. Copy and illustration are carried over verbatim from the original build
 * (git a630ff7:app/not-found.tsx).
 *
 * The old page used daisyUI's `md:divider md:divider-horizontal`, which is gone
 * — it is a plain bordered rule here, still md-and-up only, exactly as before.
 * The illustration now drifts on the shared `.float-drift` loop and
 * "Page Not Found" carries the brand gradient instead of a flat `text-primary`.
 * Every animation used here is disabled under prefers-reduced-motion by the
 * rules in globals.css.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] w-full items-center justify-center bg-background px-6 py-20">
      <div className="flex w-full flex-col items-center md:flex-row md:justify-center md:gap-10">
        <Image
          src="/images/not-found.png"
          alt="Not Found"
          width={512}
          height={512}
          priority
          className="float-drift animation-fade-in h-52 w-52 self-center md:h-72 md:w-72"
          style={{
            ["--drift-duration" as string]: "7s",
            ["--drift-x" as string]: "0px",
            ["--drift-y" as string]: "-12px",
          }}
        />

        {/* Replaces `md:divider md:divider-horizontal`; md and up, as before. */}
        <div
          className="hidden md:block md:h-56 md:w-px md:self-center md:border-l md:border-border"
          aria-hidden
        />

        <div className="animation-swipe-from-bottom text-center md:text-left">
          <h1 className="font-heading text-8xl font-extrabold text-foreground sm:text-9xl">
            404
          </h1>
          <p>
            <span
              className="font-heading bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl"
              style={{ backgroundImage: "var(--primary-gradient)" }}
            >
              Page Not Found
            </span>
            <br />
            <span className="font-heading text-xl font-light text-muted-foreground sm:text-2xl">
              The page you are looking for does not exist!
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
