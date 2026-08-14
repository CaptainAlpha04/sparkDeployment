import type { Metadata } from "next";
import Image from "next/image";

import { Reveal, Stagger } from "@/components/motion/reveal";
import { GeometricHero } from "@/components/site/geometric-hero";

export const metadata: Metadata = {
  title: "Alliances",
  description:
    "Collaborating with the brightest minds and innovative institutions to drive innovation and progress.",
};

/**
 * Copy is carried over verbatim from the original build
 * (git a630ff7:app/alliance/page.tsx). Intrinsic dimensions were added so
 * next/image can reserve space and avoid layout shift; nothing else changed.
 */
const universities = [
  {
    name: "NUST - National University of Sciences & Technology",
    description:
      "NUST students work closely with SPARK to engage in leadership programs and innovation projects, shaping the future of technology.",
    image: "/brandings/nust.png",
    width: 300,
    height: 269,
  },
  {
    name: "FAST - National University of Computer & Emerging Sciences",
    description:
      "At FAST, SPARK nurtures the entrepreneurial spirit and supports student-led initiatives that advance research in emerging technologies.",
    image: "/brandings/fast.png",
    width: 494,
    height: 304,
  },
  {
    name: "COMSATS Institute of Information Technology",
    description:
      "COMSATS is a hub of creativity. Through SPARK, students participate in research and entrepreneurship activities that drive technology forward.",
    image: "/brandings/comsats.png",
    width: 225,
    height: 224,
  },
  {
    name: "AIR University",
    description:
      "SPARK collaborates with AIR University to promote leadership, empowering students to create innovative solutions for global challenges.",
    image: "/brandings/air.png",
    width: 348,
    height: 287,
  },
  {
    name: "UCP - University of Central Punjab",
    description:
      "At UCP, SPARK helps students turn academic projects into real-world applications through mentorship and collaboration.",
    image: "/brandings/ucp.png",
    width: 225,
    height: 225,
  },
  {
    name: "GIKI - Ghulam Ishaq Khan Institute",
    description:
      "SPARK's partnership with GIKI encourages innovation and technological advancement through research-driven projects and initiatives.",
    image: "/brandings/giki.png",
    width: 512,
    height: 512,
  },
];

/**
 * Shared by both stacked logo layers so they occupy the exact same box and the
 * crossfade has no positional drift.
 */
const LOGO_LAYER =
  "absolute top-0 left-1/2 h-40 w-auto max-w-full -translate-x-1/2 object-contain";

export default function AlliancePage() {
  return (
    <main>
      <GeometricHero
        title="Alliances"
        subtitle="Collaborating with the brightest minds and innovative institutions to drive innovation and progress."
      />

      {/* Chapters */}
      <section className="flex flex-col flex-wrap items-center bg-background p-10">
        <Reveal>
          <h2 className="mt-10 text-center font-heading text-4xl font-bold text-foreground md:text-5xl">
            Our Chapters
          </h2>
        </Reveal>

        <Reveal delay={90}>
          <p className="py-4 mb-16 text-center font-light text-muted-foreground">
            Our chapters work across leading universities to cultivate{" "}
            <br className="hidden md:inline" /> innovation, leadership, and
            entrepreneurship, empowering students to turn ideas into impactful
            solutions.
          </p>
        </Reveal>

        <Stagger
          step={80}
          className="grid w-full max-w-[74rem] grid-cols-1 place-content-center gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {universities.map((alliance) => (
            <article
              key={alliance.image}
              className="group flex h-full w-full flex-col items-center gap-3 rounded-lg bg-card p-6 text-center shadow-md
                transition-[background-color,box-shadow,transform] duration-500 ease-out
                hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_50px_-20px_oklch(0.62_0.19_296_/_0.55)]
                motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {/*
                Two stacked copies of the same mark. These logos are dark ink on
                transparent, so on the dark card they read as a white silhouette
                and resolve to full colour as the card inverts — a crossfade
                rather than a hard swap. The incoming layer runs slightly longer
                than the outgoing one so the two overlap in the middle.
              */}
              <div className="relative mb-4 h-40 w-full">
                <Image
                  src={alliance.image}
                  alt={`${alliance.name} logo`}
                  width={alliance.width}
                  height={alliance.height}
                  className={`${LOGO_LAYER} opacity-90 brightness-0 invert transition-opacity duration-500 ease-out group-hover:opacity-0 motion-reduce:transition-none`}
                />
                <Image
                  src={alliance.image}
                  alt=""
                  aria-hidden
                  width={alliance.width}
                  height={alliance.height}
                  className={`${LOGO_LAYER} opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100 motion-reduce:transition-none`}
                />
              </div>

              <h3 className="mb-4 font-heading text-xl font-bold text-foreground transition-colors duration-300 ease-out group-hover:text-gray-900 motion-reduce:transition-none">
                {alliance.name}
              </h3>

              <p className="text-sm text-muted-foreground transition-colors duration-300 ease-out group-hover:text-gray-700 motion-reduce:transition-none">
                {alliance.description}
              </p>
            </article>
          ))}
        </Stagger>
      </section>

      {/* Mentors */}
      <section className="flex flex-col flex-wrap items-center bg-background p-10">
        <Reveal>
          <h2 className="mt-10 text-center font-heading text-4xl font-bold text-foreground md:text-5xl">
            Our Mentors
          </h2>
        </Reveal>

        <Reveal delay={90}>
          <p className="py-4 mb-16 text-center font-light text-muted-foreground">
            Our mentors, comprising distinguished professors and industry
            leaders,
            <br className="hidden md:inline" /> work closely with us to provide
            personalized guidance and nurture the growth of students into future
            trailblazers.
          </p>
        </Reveal>
      </section>
    </main>
  );
}
