import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { GeometricHero } from "@/components/site/geometric-hero";

export const metadata: Metadata = {
  title: "Event Highlights | SPARK",
  description: "Showcasing the best moments from our events!",
};

/**
 * Placeholder page. The old build shipped six of these — identical shells with
 * only the strings swapped, each one an `h-screen` section that clipped the
 * footer out of the document. `min-h-screen` lets the page grow instead, and
 * the lone body line now breathes rather than sitting there as dead text.
 */
export default function HighlightsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <GeometricHero
        title="Event Highlights"
        subtitle="Showcasing the best moments from our events!"
        variant="sharp"
      />

      <Reveal
        as="section"
        delay={150}
        className="flex flex-1 items-center justify-center p-10"
      >
        <p className="text-center text-lg font-light tracking-wide text-muted-foreground motion-safe:animate-pulse">
          No Highlights Available!
        </p>
      </Reveal>
    </div>
  );
}
