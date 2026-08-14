import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { GeometricHero } from "@/components/site/geometric-hero";

// "Affliations" is the original site's spelling, on the heading, the subtitle,
// and the nav link that points here. Kept verbatim — correcting it here alone
// would desync this page from the rest of the build.
export const metadata: Metadata = {
  title: "Sponsorships and Affliations | SPARK",
  description: "Information about our sponsors and affliations.",
};

/**
 * Placeholder page. Same shell as the other five — see highlights/page.tsx.
 */
export default function SponsorshipPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <GeometricHero
        title="Sponsorships and Affliations"
        subtitle="Information about our sponsors and affliations."
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
