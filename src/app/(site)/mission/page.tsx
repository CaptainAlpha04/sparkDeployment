import type { Metadata } from "next";
import Link from "next/link";
import StarryCanvas from "@/components/starry-canvas";
import { Reveal, Stagger } from "@/components/motion/reveal";
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

const elements: MissionElement[] = [
  {
    name: "Research",
    description:
      "Dig into things properly. Go past what the course covers and follow whatever you actually find interesting.",
    image: "/images/atom.png",
    accent: "#3b82f6",
  },
  {
    name: "Entrepreneurship",
    description:
      "Turn an idea into something real, and find out what breaks once you start building it for other people.",
    image: "/images/rocket.png",
    accent: "#94a3b8",
  },
  {
    name: "Innovation",
    description:
      "Try things that might not work. Most of them will not, and the ones that do are worth all the rest.",
    image: "/images/fire.png",
    accent: "#f97316",
  },
  {
    name: "Leadership",
    description:
      "Run a team, hold a room, and make the call when nobody is going to hand you the right answer.",
    image: "/images/chess.png",
    accent: "#ef4444",
  },
  {
    name: "Creativity",
    description:
      "Room to think differently and share the half finished version, before anyone expects it to be polished.",
    image: "/images/creative.png",
    accent: "#a855f7",
  },
  {
    name: "Education",
    description:
      "Learn from people who know more than you, without being talked down to or quietly tested on it.",
    image: "/images/book.png",
    accent: "#6366f1",
  },
  {
    name: "Technology",
    description:
      "Get hands on with real tools. Python, machine learning, web, hardware, and whatever you want to build next.",
    image: "/images/cpu.png",
    accent: "#06b6d4",
  },
  {
    name: "Collaboration",
    description:
      "Meet people who are into the same things you are, work on it together, and keep the network long after the session ends.",
    image: "/images/teamwork.png",
    accent: "#22c55e",
  },
];

const stages = [
  {
    step: "01",
    title: "It feels strange at first",
    body: "Most people have never been in a class where nobody is marking them. It takes a few sessions to believe it is real, and some drop off while they figure that out.",
  },
  {
    step: "02",
    title: "Then they come back",
    body: "And they start picking the harder stuff on their own. No grades, no attendance, nobody checking. They do it because it is genuinely interesting.",
  },
  {
    step: "03",
    title: "And they stop giving up",
    body: "When something is too hard, they try a different approach instead of deciding they are not smart enough for it. That change is the whole point of what we do.",
  },
];

export default function MissionPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[92vh] w-full flex-col items-center justify-center overflow-hidden px-6"
        style={{
          background:
            "linear-gradient(to bottom, #000000 0%, #05060f 55%, #0a0b16 100%)",
        }}
      >
        <StarryCanvas numberOfStars={150} shootingStars />

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
        </div>

        <div
          className="animation-fade-in absolute bottom-10 flex flex-col items-center gap-2"
          style={{ animationDelay: "700ms" }}
        >
          <span className="eyebrow">Keep going</span>
          <span className="h-12 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── The premise ──────────────────────────────────────────────────── */}
      <section
        className="w-full px-6 py-32"
        style={{ background: "linear-gradient(to bottom, #0a0b16, #10132e)" }}
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="eyebrow mb-6">The premise</p>
            <h2 className="text-5xl leading-tight font-bold md:text-6xl">
              Curiosity is not lost. It gets priced out.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-x-14 gap-y-8 md:grid-cols-2">
            <Reveal delay={60}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                A five year old asking why the sky is blue risks nothing. A sixteen
                year old asking the same question in a graded room risks being read,
                by the class and by the institution, as someone who should already
                know.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Where everything you say can be assessed, saying nothing is the
                rational move. Nothing was ever extinguished. A price was
                introduced, and students did the arithmetic.
              </p>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <blockquote className="mt-16 border-l-2 border-primary/60 pl-8">
              <p className="text-2xl leading-snug font-medium md:text-3xl">
                The burden of education was never difficulty. It is the verdict
                attached to it.
              </p>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ── Where we sit ─────────────────────────────────────────────────── */}
      <section
        className="w-full px-6 py-32"
        style={{ background: "linear-gradient(to bottom, #10132e, #0b1a22)" }}
      >
        <div className="mx-auto grid max-w-5xl gap-14 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Reveal>
            <div className="md:sticky md:top-32">
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
                Schools have to certify. Certification needs measurement,
                measurement needs standardisation, and standardisation needs
                everyone moved through the same material at the same rate against
                the same line. That machinery is not a fault. It is the price of a
                credential anyone can trust.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                It also has a side effect that is difficult to separate out and easy
                to stop noticing. It quietly teaches that not knowing something is a
                verdict on you. That lesson appears on no syllabus and outlasts most
                of what does.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <p className="text-lg leading-relaxed text-foreground">
                So we do not compete with school. We work in the space schooling
                cannot occupy, which is a room with real expertise in it and nobody
                holding the power to decide whether you are capable.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Elements ─────────────────────────────────────────────────────── */}
      <ElementsSequence elements={elements} />

      {/* ── What happens ─────────────────────────────────────────────────── */}
      <section
        className="w-full px-6 py-32"
        style={{ background: "linear-gradient(to bottom, #0a0b16, #150e2a)" }}
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="eyebrow mb-4">What actually happens</p>
            <h2 className="max-w-2xl text-5xl font-bold">
              Remove the price. Then wait longer than feels reasonable.
            </h2>
          </Reveal>

          <Stagger step={90} className="mt-16 grid gap-10 md:grid-cols-3">
            {stages.map((stage) => (
              <div key={stage.step} className="border-t border-white/10 pt-6">
                <span className="font-mono text-xs text-muted-foreground">
                  {stage.step}
                </span>
                <h3 className="mt-3 mb-3 text-2xl font-semibold">{stage.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{stage.body}</p>
              </div>
            ))}
          </Stagger>

          <Reveal delay={200}>
            <p className="mt-16 max-w-2xl text-lg leading-relaxed text-foreground">
              Telling people they are free to ask anything takes one sentence.
              Believing it takes a lot longer. Our job is keeping the room open
              until they do.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section
        className="relative w-full overflow-hidden px-6 py-32"
        style={{ background: "linear-gradient(to bottom, #150e2a, #000000)" }}
      >
        <SparkMark
          className="pointer-events-none absolute top-1/2 left-1/2 h-[100vmin] w-[100vmin] -translate-x-1/2 -translate-y-1/2 text-white/[0.022]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-5xl font-bold">
              Curiosity is the only requirement.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              No fees, no entry test, nothing you need to know first. Turn up to one
              session and see what you think.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/events" className="btn-stylized">
                See what is on
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
    </>
  );
}
