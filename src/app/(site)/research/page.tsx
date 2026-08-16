import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { GeometricHero } from "@/components/site/geometric-hero";

export const metadata: Metadata = {
  title: "Research and Labs | SPARK",
  description: "Our latest research and experimental analysis.",
};

/**
 * Placeholder page. Same shell as the other five — see highlights/page.tsx.
 */
export default function ResearchPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <GeometricHero
        title="Research and Labs"
        subtitle="Our latest research and experimental analysis."
        variant="sharp"
      />

      <Reveal
        as="section"
        delay={150}
        className="flex flex-1 items-center justify-center p-10"
      >
        <p className="text-center text-lg font-light tracking-wide text-muted-foreground motion-safe:animate-pulse">
          Page Under Construction!
        </p>
      </Reveal>
    </div>
  );
}
