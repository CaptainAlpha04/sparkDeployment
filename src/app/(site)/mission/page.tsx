import type { Metadata } from "next";
import Link from "next/link";
import StarryCanvas from "@/components/starry-canvas";
import { Reveal } from "@/components/motion/reveal";
import { SparkMark } from "@/components/brand/spark-mark";
import {
  ElementsSequence,
  type MissionElement,
} from "@/components/mission/elements-sequence";

export const metadata: Metadata = {
  title: "Our Mission | SPARK",
  description:
    "Information has never been cheaper. Permission to not know it has never been more expensive. SPARK exists to make questions free to ask.",
};

/**
 * The eight elements.
 *
 * Eight is not incidental — the SPARK glyph is an eight-pointed burst, so each
 * element maps to one of its points in the scroll sequence.
 */
const elements: MissionElement[] = [
  {
    name: "Research",
    description:
      "Following a question past the point where the syllabus stops, and being willing to arrive somewhere unplanned.",
    image: "/images/atom.png",
    accent: "#3b82f6",
  },
  {
    name: "Entrepreneurship",
    description:
      "Building the thing rather than describing it. Shipping is its own kind of argument.",
    image: "/images/rocket.png",
    accent: "#94a3b8",
  },
  {
    name: "Innovation",
    description:
      "New answers come from people permitted to give wrong ones first. That permission is the whole prerequisite.",
    image: "/images/fire.png",
    accent: "#f97316",
  },
  {
    name: "Leadership",
    description:
      "Holding a room where nobody is scored — including holding your nerve when it looks like it is not working.",
    image: "/images/chess.png",
    accent: "#ef4444",
  },
  {
    name: "Creativity",
    description:
      "Thinking in public before the thought is finished, which is the only time it can still be changed.",
    image: "/images/creative.png",
    accent: "#a855f7",
  },
  {
    name: "Education",
    description:
      "Expertise offered on request, never delivered as a verdict. The asymmetry is in knowledge, not in standing.",
    image: "/images/book.png",
    accent: "#6366f1",
  },
  {
    name: "Technology",
    description:
      "Real tools, real difficulty, no grade attached — so that struggling reads as method, not as capacity.",
    image: "/images/cpu.png",
    accent: "#06b6d4",
  },
  {
    name: "Collaboration",
    description:
      "Rooms where being wrong out loud costs nothing, because the rules belong to everyone in them.",
    image: "/images/teamwork.png",
    accent: "#22c55e",
  },
];

export default function MissionPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────
          Deliberately restrained: one mark, one line, one claim. The visual
          weight is in the type and the space around it. */}
      <section className="relative flex min-h-[92vh] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black via-slate-950 to-slate-950 px-6">
        <StarryCanvas numberOfStars={130} />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <SparkMark
            interactive
            gradient
            className="mx-auto mb-10 size-14 drop-shadow-[0_0_24px_oklch(0.62_0.19_296_/_0.45)]"
          />

          <p className="eyebrow animation-fade-in mb-6">Our mission</p>

          <h1 className="animation-swipe-from-bottom text-6xl font-extrabold md:text-7xl">
            Somewhere between five and fifteen,
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
              we stop asking.
            </span>
          </h1>

          <p
            className="animation-fade-in mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground"
            style={{ animationDelay: "260ms" }}
          >
            Information has never been cheaper. Permission to not know it has never
            been more expensive. SPARK exists to make questions free to ask again.
          </p>
        </div>

        <div
          className="animation-fade-in absolute bottom-10 flex flex-col items-center gap-2"
          style={{ animationDelay: "700ms" }}
        >
          <span className="eyebrow">Scroll</span>
          <span className="h-12 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── The premise ──────────────────────────────────────────────────── */}
      <section className="w-full border-t border-white/5 bg-slate-950 px-6 py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow mb-4">The premise</p>
            <h2 className="max-w-2xl text-5xl font-bold">
              Curiosity isn&apos;t lost. It&apos;s priced out.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-x-16 gap-y-8 md:grid-cols-2">
            <Reveal delay={60}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                A five-year-old asking why the sky is blue risks nothing. A
                sixteen-year-old asking the same question in a graded room risks
                being read — by the class and by the institution — as someone who
                should already know.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Where every contribution can be assessed, silence is the rational
                strategy. Nothing was extinguished. A price was introduced, and
                students did the arithmetic.
              </p>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <blockquote className="mt-16 border-l-2 border-primary/60 pl-8">
              <p className="text-2xl leading-snug font-medium text-foreground md:text-3xl">
                The burden of education was never difficulty. It&apos;s the verdict
                attached to it.
              </p>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ── The position ─────────────────────────────────────────────────── */}
      <section className="w-full border-t border-white/5 bg-slate-950 px-6 py-32">
        <div className="mx-auto grid max-w-5xl gap-16 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Reveal>
            <div className="md:sticky md:top-28">
              <p className="eyebrow mb-4">Where we sit</p>
              <h2 className="text-5xl font-bold">
                We are not
                <br />a school.
              </h2>
            </div>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal delay={60}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Schools are obliged to certify. Certification requires measurement,
                measurement requires standardisation, and standardisation requires
                that everyone move through the same material at the same rate,
                judged against the same line. That machinery is not a fault. It is
                the price of a credential society can trust.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                But it has a side effect that is hard to separate out and easy to
                stop noticing: it quietly teaches that not-knowing is a verdict on
                your capacity. That lesson is never on any syllabus, and it outlasts
                most of what is.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <p className="text-lg leading-relaxed text-foreground">
                So we do not compete with school. We work in the space schooling
                structurally cannot occupy — rooms with real expertise available on
                request and nobody holding the power to decide whether you are
                capable. Organised freedom of thought, with norms that belong to
                everyone in the room and a verdict that belongs to no one.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── The elements sequence ────────────────────────────────────────── */}
      <ElementsSequence elements={elements} />

      {/* ── What we are finding ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-t border-white/5 bg-gradient-to-b from-slate-950 to-background">
        {/* The mark the sequence just assembled, held behind the closing
            argument at the edge of visibility. */}
        <SparkMark
          className="pointer-events-none absolute top-1/2 left-1/2 h-[110vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2 text-white/[0.022]"
          aria-hidden
        />

        <section className="relative w-full px-6 py-32">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <p className="eyebrow mb-4">What we are finding</p>
              <h2 className="mb-12 text-5xl font-bold">
                Remove the price. Wait longer than feels reasonable.
              </h2>
            </Reveal>

            <div className="flex flex-col gap-6">
              <Reveal delay={60}>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Take the verdict out of a room and it does not fill with questions
                  the next day. It empties first. A room with no judgement is
                  unreadable to anyone who has never been in one, and people leave
                  while they work out what it is.
                </p>
              </Reveal>
              <Reveal delay={120}>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Then they come back — and they choose the hard material,
                  voluntarily, with nothing riding on it. When they hit something
                  they cannot follow, they blame the method or the preparation
                  rather than themselves, and they say they intend to keep going.
                  That shift is the entire point. Everything else we run is in
                  service of it.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <p className="text-lg leading-relaxed text-foreground">
                  Permission is granted in a sentence. Belief takes considerably
                  longer. Most of the work is holding the room open in between.
                </p>
              </Reveal>
            </div>

            <Reveal delay={260}>
              <div className="mt-16 flex flex-wrap gap-4">
                <Link href="/events" className="btn-stylized">
                  Come to something
                </Link>
                <Link
                  href="/alliance"
                  className="rounded-3xl px-6 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Bring it to your campus →
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  );
}
