import { GeometricHero } from "@/components/site/geometric-hero";
import { Reveal } from "@/components/motion/reveal";

export const metadata = {
  title: "Upcoming Events | SPARK",
  description: "Workshops, competitions, and gatherings from the SPARK community.",
};

/**
 * INTERIM. The real events page — listing, registration with capacity and
 * waitlist, custom questions, and the Spark Membership form — arrives with
 * Plan 1c. This placeholder exists so the primary nav has no dead link.
 */
export default function EventsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <GeometricHero
        title="Upcoming Events"
        subtitle="Workshops, competitions, and the gatherings where SPARK actually happens."
      />

      <Reveal
        as="section"
        delay={150}
        className="flex flex-1 items-center justify-center p-10"
      >
        <p className="text-center text-lg font-light tracking-wide text-muted-foreground motion-safe:animate-pulse">
          Event registration is being rebuilt — back shortly.
        </p>
      </Reveal>
    </div>
  );
}
