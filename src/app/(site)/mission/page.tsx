"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { Reveal } from "@/components/motion/reveal";

/* ---------------------------------------------------------------------------
 * Mission page — ported from the original SPARK build (git a630ff7).
 *
 * Structure, section order and copy are unchanged. What changed is the motion:
 *
 *  - The hero parallax no longer runs `setState` on every scroll event (the old
 *    version re-rendered the whole page tree ~60x/second). Scroll offsets are
 *    now written straight to the layer elements inside a single rAF, and the
 *    whole effect bails out under `prefers-reduced-motion`.
 *  - `/designs/layer-8.png` does not exist in public/ — the old markup rendered
 *    it as a broken image. That layer is omitted.
 *  - Mountain layers also pick up a mild horizontal pointer parallax, scaled by
 *    the same depth factor so distant ridges barely move.
 * ------------------------------------------------------------------------ */

type Layer = {
  src: string;
  width: number;
  height: number;
  /** Vertical scroll parallax factor. Identical to the original build. */
  factor: number;
};

// Back to front. Factors are verbatim from the old file.
const layers: Layer[] = [
  { src: "/designs/layer-7.png", width: 3001, height: 822, factor: 0.08 },
  { src: "/designs/layer-6.png", width: 3001, height: 763, factor: 0.1 },
  { src: "/designs/layer-5.png", width: 1979, height: 646, factor: 0.16 },
  { src: "/designs/layer-4.png", width: 1525, height: 491, factor: 0.18 },
  { src: "/designs/layer-3.png", width: 2972, height: 478, factor: 0.24 },
  { src: "/designs/layer-2.png", width: 2699, height: 520, factor: 0.32 },
  { src: "/designs/layer-1.png", width: 3001, height: 835, factor: 0.34 },
];

/** How far, in px, the front-most layer slides with the pointer. */
const POINTER_TRAVEL = 70;
/** Text parallax factor, verbatim from the old file. */
const TEXT_FACTOR = 0.3;

const elements = [
  {
    name: "Research",
    description:
      "Delving into scientific research to discover groundbreaking solutions in technology and beyond.",
    image: "/images/atom.png",
    color: "hover:bg-blue-500",
    glow: "#3b82f6",
  },
  {
    name: "Entrepreneurship",
    description:
      "Fostering creativity and innovation through entrepreneurship, paving the way for future leaders and innovators.",
    image: "/images/rocket.png",
    color: "hover:bg-black",
    // A black glow over a black card is invisible; the nearest legible
    // neighbour on the same ramp keeps the icon readable on hover.
    glow: "#64748b",
  },
  {
    name: "Innovation",
    description:
      "Pioneering creative and transformative solutions that shape the future of science and technology.",
    image: "/images/fire.png",
    color: "hover:bg-orange-500",
    glow: "#f97316",
  },
  {
    name: "Leadership",
    description:
      "Cultivating leadership skills that inspire individuals and teams to reach their fullest potential.",
    image: "/images/chess.png",
    color: "hover:bg-red-500",
    glow: "#ef4444",
  },
  {
    name: "Creativity",
    description:
      "Inspiring Creative thinking and artistic expression to drive revolutionary change.",
    image: "/images/creative.png",
    color: "hover:bg-purple-500",
    glow: "#a855f7",
  },
  {
    name: "Education",
    description:
      "Providing educational resources to empower the next generation of tech leaders and innovators.",
    image: "/images/book.png",
    color: "hover:bg-blue-950",
    glow: "#1e3a8a",
  },
  {
    name: "Technology",
    description:
      "Driving technological advancements that push the boundaries of what’s possible in today’s world.",
    image: "/images/cpu.png",
    color: "hover:bg-cyan-500",
    glow: "#06b6d4",
  },
  {
    name: "Collaboration",
    description:
      "Encouraging teamwork and collaboration to solve problems and create innovative solutions together.",
    image: "/images/teamwork.png",
    color: "hover:bg-green-500",
    glow: "#22c55e",
  },
];

/**
 * Page-local styles. This page is the only consumer, and the brief scopes the
 * change to a single file, so they ride along with it rather than growing
 * globals.css. Every rule has a `prefers-reduced-motion` off-switch.
 */
const pageStyles = `
/* The empty #102866 band is the colour bridge between the hero and the mission
   statement. It stays empty — but breathes instead of sitting dead. */
@keyframes mission-motto-breathe {
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50%      { opacity: 0.6;  transform: scale(1.18); }
}
.mission-motto-breathe {
  background: radial-gradient(60% 80% at 50% 50%, #1e46a8 0%, rgba(16, 40, 102, 0) 70%);
  animation: mission-motto-breathe 18s ease-in-out infinite;
}

@keyframes mission-globe-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.mission-globe-spin {
  animation: mission-globe-spin 140s linear infinite;
}

/* The gradient is always clipped to the glyphs; the text colour on top starts
   opaque and cross-fades to transparent, which reveals it. Sequencing comes
   from --emph-delay. */
.mission-emph {
  background-image: var(--primary-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: inherit;
  transition: color 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transition-delay: var(--emph-delay, 0ms);
}
.mission-emph[data-lit="true"] {
  color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .mission-motto-breathe,
  .mission-globe-spin {
    animation: none;
  }
  .mission-emph {
    transition: none;
    color: transparent;
  }
}
`;

/** Fires once when the element first crosses the viewport. */
function useInView<T extends Element>(amount = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: amount },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [amount]);

  return [ref, inView] as const;
}

function Emphasis({
  children,
  index,
  lit,
}: {
  children: ReactNode;
  index: number;
  lit: boolean;
}) {
  return (
    <strong
      className="mission-emph text-xl"
      data-lit={lit}
      style={{ ["--emph-delay" as string]: `${index * 180}ms` } as CSSProperties}
    >
      {children}
    </strong>
  );
}

export default function MissionPage() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const glyphRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [impactRef, impactInView] = useInView<HTMLElement>(0.2);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    // The old clamp was `Math.min(scrollY * f, maxScroll - sectionTop)`, and
    // `maxScroll - sectionTop` reduces to the section's own height.
    let sectionHeight = section.offsetHeight;
    let frame = 0;
    // Pointer position as -1…1, plus the value currently painted, so the
    // horizontal drift eases toward the cursor instead of snapping.
    let pointerTarget = 0;
    let pointer = 0;

    function schedule() {
      if (frame === 0) frame = requestAnimationFrame(paint);
    }

    function paint() {
      frame = 0;

      const scrollY = window.scrollY;
      pointer += (pointerTarget - pointer) * 0.08;

      const offset = (factor: number) =>
        Math.min(scrollY * factor, sectionHeight);

      const textY = offset(TEXT_FACTOR);
      if (glyphRef.current) {
        glyphRef.current.style.transform = `translate3d(0, ${textY}px, 0)`;
      }
      if (titleRef.current) {
        titleRef.current.style.transform = `translate3d(0, ${textY}px, 0)`;
      }

      for (let i = 0; i < layers.length; i += 1) {
        const el = layerRefs.current[i];
        if (!el) continue;
        const { factor } = layers[i];
        // Depth reuses the scroll factor: the 0.08 ridge drifts ~6px, the 0.34
        // foreground ~24px.
        const x = pointer * factor * POINTER_TRAVEL;
        el.style.transform = `translate3d(${x}px, ${offset(factor)}px, 0)`;
      }

      // Keep animating until the eased pointer has settled.
      if (Math.abs(pointerTarget - pointer) > 0.0005) schedule();
    }

    const onScroll = () => schedule();
    const onResize = () => {
      sectionHeight = section.offsetHeight;
      schedule();
    };
    const onPointerMove = (event: PointerEvent) => {
      pointerTarget = (event.clientX / window.innerWidth) * 2 - 1;
      schedule();
    };

    paint();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <>
      <style>{pageStyles}</style>

      {/* Hero Section */}
      <section
        ref={sectionRef}
        id="parallax-section"
        className="relative flex flex-col items-center justify-center w-screen h-screen bg-gradient-to-b from-black via-slate-950 to-blue-950"
      >
        {/* Text: Trad Chinese and Our Mission */}
        <div ref={glyphRef} className="absolute will-change-transform">
          <h1 className="text-8xl md:text-9xl font-tc text-slate-700 opacity-80 p-4 animation-fade-in">
            {"傳道部"}
          </h1>
        </div>
        <div ref={titleRef} className="absolute will-change-transform">
          <h1 className="text-4xl md:text-4xl font-extrabold drop-shadow-lg p-4 animation-swipe-from-bottom">
            OUR MISSION
          </h1>
        </div>

        {/* Parallax effect on the mountains */}
        <div className="w-screen absolute bottom-10 md:bottom-32">
          {layers.map((layer, index) => (
            <div
              key={layer.src}
              ref={(el) => {
                layerRefs.current[index] = el;
              }}
              className="absolute animation-fade-in will-change-transform"
            >
              <Image
                src={layer.src}
                alt=""
                width={layer.width}
                height={layer.height}
                priority
              />
            </div>
          ))}
        </div>
      </section>

      {/* Mottos */}
      <section className="relative flex flex-col items-center justify-center w-screen h-fit p-24 py-60 md:py-64 bg-[#102866] overflow-hidden">
        <div
          aria-hidden
          className="mission-motto-breathe pointer-events-none absolute inset-0"
        />
      </section>

      {/* Mission Statement */}
      <section className="relative flex flex-col justify-center w-screen h-fit pb-20 bg-gradient-to-b from-[#102866] to-slate-950 px-4">
        <Reveal>
          <h1 className="text-6xl font-bold opacity-60 mb-10 mt-10 text-center md:text-center">
            Welcome to SPARK
          </h1>
        </Reveal>
        <div className="text-lg px-2 lg:px-64 text-wrap flex flex-col gap-4">
          <Reveal>
            <p>
              Where we believe that innovation thrives at the intersection of
              creativity, knowledge, and collaboration. Our mission is to foster
              a vibrant community where students, professionals, and visionaries
              come together to push the boundaries of {`what's`} possible. By
              nurturing entrepreneurial spirit, promoting cutting-edge research,
              and cultivating artistic and technological ingenuity, we aim to
              inspire individuals to lead the charge in creating revolutionary
              solutions for the {`world's`} most pressing challenges.
            </p>
          </Reveal>
          <Reveal delay={90}>
            <p>
              We are committed to creating a platform that empowers future
              leaders to dream boldly and act decisively. Through mentorship,
              collaboration, and immersive learning experiences, SPARK equips
              its members with the tools, resources, and support needed to
              translate ideas into tangible impact. Our focus is on nurturing
              innovation in every field, ensuring that creative thinking is
              woven into the fabric of academia, technology, and leadership.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <p>
              At SPARK, we envision a future where the brightest minds are
              connected, and innovation knows no bounds. Together, we strive to
              ignite the potential in each member of our community, fostering a
              spirit of curiosity, resilience, and purpose that will light the
              way to a brighter, more inclusive future.
            </p>
          </Reveal>
        </div>
      </section>

      {/* SPARK elements */}
      <section className="relative w-screen h-fit py-20 px-10 flex flex-col bg-slate-950">
        <Reveal>
          <h2 className="text-6xl font-bold text-center text-foreground">
            Our Elements
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="text-md text-center font-light mb-20">
            Discover the core pillars that drive {`SPARK's`} mission and vision.
          </p>
        </Reveal>

        <div className="flex flex-row flex-wrap gap-4 place-content-center">
          {elements.map((element, index) => (
            <Reveal
              key={element.name}
              delay={index * 80}
              amount={0.15}
              className="w-full max-w-96"
            >
              <div
                className={`group relative flex text-center flex-col p-6 items-center w-full h-full gap-6 bg-background ${element.color} transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 rounded-xl overflow-hidden`}
              >
                <div className="relative flex items-center justify-center">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
                    style={{
                      background: `radial-gradient(circle, ${element.glow} 0%, transparent 70%)`,
                    }}
                  />
                  <Image
                    src={element.image}
                    alt=""
                    width={128}
                    height={128}
                    className="relative h-20 w-20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:h-32 group-hover:w-32 group-hover:opacity-50"
                  />
                </div>
                <h3 className="text-3xl font-bold text-center text-white">
                  {element.name}
                </h3>
                <p className="text-sm text-white">{element.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        ref={impactRef}
        className="relative w-screen h-fit py-20 px-10 mb-20 flex flex-col bg-gradient-to-b from-slate-950 to-background"
      >
        <Reveal>
          <h2 className="text-6xl font-bold text-center text-foreground">
            Global Impact
          </h2>
        </Reveal>
        <p className="text-md mt-16 font-light drop-shadow-lg md:px-32 text-justify">
          We aim to create a <Emphasis index={0} lit={impactInView}>global impact</Emphasis> by fostering a community of innovators, entrepreneurs, and leaders who are equipped to <Emphasis index={1} lit={impactInView}>solve</Emphasis> challenges that transcend borders. Through collaboration across industries and cultures, SPARK <Emphasis index={2} lit={impactInView}>connects</Emphasis> individuals worldwide, enabling the exchange of ideas, skills, and resources. By focusing on <Emphasis index={3} lit={impactInView}>universal</Emphasis> pillars like creativity, research, and technology, Our initiatives are designed to address global issues such as education reform, <Emphasis index={4} lit={impactInView}>sustainable</Emphasis> innovation, and social entrepreneurship, ensuring that its solutions benefit not only local communities but also the global <Emphasis index={5} lit={impactInView}>society</Emphasis> at large.
        </p>
        <Image
          src="/designs/globe.png"
          alt=""
          width={4000}
          height={4000}
          className="mission-globe-spin absolute self-center opacity-30 mask-image-gradient min-w-96 w-96"
        />
      </section>
    </>
  );
}
