import type { Metadata } from "next";
import Image from "next/image";
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
    "Where innovation thrives at the intersection of creativity, knowledge, and collaboration.",
};

/**
 * The eight elements. Copy is carried over verbatim from the original build
 * (git a630ff7:app/mission/page.tsx), including the curly apostrophes.
 *
 * Eight is not incidental — the SPARK glyph is an eight-pointed burst, so each
 * element maps to one of its points in the scroll sequence.
 */
const elements: MissionElement[] = [
  {
    name: "Research",
    description:
      "Delving into scientific research to discover groundbreaking solutions in technology and beyond.",
    image: "/images/atom.png",
    accent: "#3b82f6",
  },
  {
    name: "Entrepreneurship",
    description:
      "Fostering creativity and innovation through entrepreneurship, paving the way for future leaders and innovators.",
    image: "/images/rocket.png",
    accent: "#64748b",
  },
  {
    name: "Innovation",
    description:
      "Pioneering creative and transformative solutions that shape the future of science and technology.",
    image: "/images/fire.png",
    accent: "#f97316",
  },
  {
    name: "Leadership",
    description:
      "Cultivating leadership skills that inspire individuals and teams to reach their fullest potential.",
    image: "/images/chess.png",
    accent: "#ef4444",
  },
  {
    name: "Creativity",
    description:
      "Inspiring Creative thinking and artistic expression to drive revolutionary change.",
    image: "/images/creative.png",
    accent: "#a855f7",
  },
  {
    name: "Education",
    description:
      "Providing educational resources to empower the next generation of tech leaders and innovators.",
    image: "/images/book.png",
    accent: "#1e3a8a",
  },
  {
    name: "Technology",
    description:
      "Driving technological advancements that push the boundaries of what’s possible in today’s world.",
    image: "/images/cpu.png",
    accent: "#06b6d4",
  },
  {
    name: "Collaboration",
    description:
      "Encouraging teamwork and collaboration to solve problems and create innovative solutions together.",
    image: "/images/teamwork.png",
    accent: "#22c55e",
  },
];

const impact = [
  { text: "We aim to create a ", emph: "global impact" },
  {
    text: " by fostering a community of innovators, entrepreneurs, and leaders who are equipped to ",
    emph: "solve",
  },
  {
    text: " challenges that transcend borders. Through collaboration across industries and cultures, SPARK ",
    emph: "connects",
  },
  {
    text: " individuals worldwide, enabling the exchange of ideas, skills, and resources. By focusing on ",
    emph: "universal",
  },
  {
    text: " pillars like creativity, research, and technology, our initiatives are designed to address global issues such as education reform, ",
    emph: "sustainable",
  },
  {
    text: " innovation, and social entrepreneurship, ensuring that its solutions benefit not only local communities but also the global ",
    emph: "society",
  },
];

export default function MissionPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────
          Replaces the old mountain parallax, which relied on a missing eighth
          layer and eight oversized PNGs. */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black via-slate-950 to-[#102866]">
        <StarryCanvas numberOfStars={220} />

        {/* Aurora. Two slow, offset drifts read as depth without any images. */}
        <div
          className="float-drift absolute top-1/4 left-1/4 h-[46vmin] w-[46vmin] rounded-full opacity-40 blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, #b10eca 0%, rgba(177,14,202,0) 70%)",
            ["--drift-duration" as string]: "22s",
            ["--drift-x" as string]: "60px",
            ["--drift-y" as string]: "-40px",
          }}
          aria-hidden
        />
        <div
          className="float-drift absolute right-1/4 bottom-1/4 h-[38vmin] w-[38vmin] rounded-full opacity-35 blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, #f17211 0%, rgba(241,114,17,0) 70%)",
            ["--drift-duration" as string]: "18s",
            ["--drift-delay" as string]: "-6s",
            ["--drift-x" as string]: "-50px",
            ["--drift-y" as string]: "40px",
          }}
          aria-hidden
        />

        {/* 傳道部 — the original build's display glyph, kept as a watermark. */}
        <span
          className="font-tc animation-fade-in pointer-events-none absolute text-[26vw] leading-none text-slate-700/40 select-none"
          aria-hidden
        >
          傳道部
        </span>

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <SparkMark
            interactive
            gradient
            className="mb-8 size-16 drop-shadow-[0_0_30px_oklch(0.62_0.19_296_/_0.6)] md:size-20"
          />
          <p className="eyebrow animation-fade-in mb-4">Our mission</p>
          <h1 className="animation-swipe-from-bottom text-7xl font-extrabold md:text-8xl">
            Ideas are cheap.
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
              Building isn&apos;t.
            </span>
          </h1>
          <p
            className="animation-fade-in mt-6 max-w-xl text-lg text-muted-foreground"
            style={{ animationDelay: "260ms" }}
          >
            SPARK exists to close the distance between the two.
          </p>
        </div>

        <div
          className="animation-fade-in absolute bottom-10 flex flex-col items-center gap-2 text-xs text-muted-foreground"
          style={{ animationDelay: "700ms" }}
        >
          <span className="eyebrow">Scroll</span>
          <span className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* ── Why SPARK exists ─────────────────────────────────────────────── */}
      <section className="relative w-full bg-gradient-to-b from-[#102866] to-slate-950 px-6 py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="eyebrow mb-3">The premise</p>
            <h2 className="mb-8 text-5xl font-bold">Why SPARK exists</h2>
          </Reveal>

          <div className="flex flex-col gap-5 text-lg text-muted-foreground">
            <Reveal delay={60}>
              <p>
                Where we believe that innovation thrives at the intersection of
                creativity, knowledge, and collaboration. Our mission is to foster a
                vibrant community where students, professionals, and visionaries
                come together to push the boundaries of what&apos;s possible. By
                nurturing entrepreneurial spirit, promoting cutting-edge research,
                and cultivating artistic and technological ingenuity, we aim to
                inspire individuals to lead the charge in creating revolutionary
                solutions for the world&apos;s most pressing challenges.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p>
                We are committed to creating a platform that empowers future leaders
                to dream boldly and act decisively. Through mentorship,
                collaboration, and immersive learning experiences, SPARK equips its
                members with the tools, resources, and support needed to translate
                ideas into tangible impact. Our focus is on nurturing innovation in
                every field, ensuring that creative thinking is woven into the fabric
                of academia, technology, and leadership.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <p>
                At SPARK, we envision a future where the brightest minds are
                connected, and innovation knows no bounds. Together, we strive to
                ignite the potential in each member of our community, fostering a
                spirit of curiosity, resilience, and purpose that will light the way
                to a brighter, more inclusive future.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── The elements sequence ────────────────────────────────────────── */}
      <ElementsSequence elements={elements} />

      {/* ── Everything below carries the assembled mark as a watermark ───── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-background">
        {/* The spark the sequence just assembled, now sitting behind the
            content — the payoff for having watched it come together. */}
        <SparkMark
          className="pointer-events-none absolute top-1/2 left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 text-white/[0.025]"
          aria-hidden
        />

        <section className="relative w-full px-6 py-28">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <p className="eyebrow mb-3">Reach</p>
              <h2 className="mb-10 text-5xl font-bold">Global impact</h2>
            </Reveal>

            <Reveal delay={80}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {impact.map((part, i) => (
                  <span key={i}>
                    {part.text}
                    <strong className="bg-gradient-to-r from-orange-500 to-violet-500 bg-clip-text font-semibold text-transparent">
                      {part.emph}
                    </strong>
                  </span>
                ))}
                {" at large."}
              </p>
            </Reveal>

            <Reveal delay={160}>
              <div className="mt-16 flex justify-center">
                <Image
                  src="/designs/globe.png"
                  alt=""
                  width={520}
                  height={520}
                  aria-hidden
                  className="mask-image-gradient w-[min(70vw,26rem)] opacity-30 [animation:spin_160s_linear_infinite] motion-reduce:animate-none"
                />
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  );
}
