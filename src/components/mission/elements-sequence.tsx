"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { SPARK_PATH } from "@/components/brand/spark-mark";

export type MissionElement = {
  name: string;
  description: string;
  image: string;
  /** Accent used for the element's glow and its ray as it converges. */
  accent: string;
};

type Props = { elements: MissionElement[] };

/** Fraction of the scroll spent introducing elements; the rest is the merge. */
const INTRO_SHARE = 0.72;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * The mission page's centrepiece.
 *
 * Eight elements arrive one at a time as you scroll, arranged around a circle,
 * then converge and resolve into the SPARK mark. The mapping is not arbitrary:
 * there are exactly eight elements and the glyph is an eight-pointed burst, so
 * each element travels into a point of the mark it becomes.
 *
 * All per-frame work writes transforms and opacity directly to DOM nodes via
 * refs inside one rAF. Driving this through React state would re-render eight
 * cards plus an SVG on every scroll event.
 */
export function ElementsSequence({ elements }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rayRefs = useRef<Array<SVGPathElement | null>>([]);
  const markRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const stage = stageRef.current;
    if (!scroller || !stage) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Static, fully-assembled state: every card visible, mark shown.
      cardRefs.current.forEach((el) => {
        if (el) el.style.opacity = "1";
      });
      if (markRef.current) markRef.current.style.opacity = "0.35";
      return;
    }

    let frame = 0;
    let lastIndex = -1;

    const paint = () => {
      frame = 0;

      const rect = scroller.getBoundingClientRect();
      const distance = scroller.offsetHeight - window.innerHeight;
      const progress = clamp01(distance > 0 ? -rect.top / distance : 0);

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }

      const count = elements.length;
      const intro = clamp01(progress / INTRO_SHARE);
      const merge = clamp01((progress - INTRO_SHARE) / (1 - INTRO_SHARE));
      const eased = easeInOutCubic(merge);

      // Which element is "current" during the intro phase.
      const active = Math.min(count - 1, Math.floor(intro * count));

      for (let i = 0; i < count; i += 1) {
        const el = cardRefs.current[i];
        if (!el) continue;

        // 0 → not yet arrived, 1 → fully arrived.
        const arrival = clamp01(intro * count - i);
        const appear = easeOutCubic(arrival);

        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        // Radius collapses to zero as the merge completes.
        const radius = (1 - eased) * 38;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        // Arrive from slightly further out than the resting radius.
        const entry = (1 - appear) * 14;
        const ex = Math.cos(angle) * entry;
        const ey = Math.sin(angle) * entry;

        const scale = (0.82 + 0.18 * appear) * (1 - eased * 0.55);

        el.style.transform = `translate3d(calc(-50% + ${x + ex}vmin), calc(-50% + ${y + ey}vmin), 0) scale(${scale})`;
        el.style.opacity = String(appear * (1 - eased));
      }

      // Rays draw themselves in as their element lands, then hold.
      for (let i = 0; i < count; i += 1) {
        const ray = rayRefs.current[i];
        if (!ray) continue;
        const arrival = clamp01(intro * count - i);
        ray.style.opacity = String((arrival * 0.28 + eased * 0.35) * 0.9);
        ray.style.transform = `scale(${0.7 + 0.3 * easeOutCubic(arrival) + eased * 0.0})`;
      }

      if (markRef.current) {
        // The mark resolves in the back half of the merge.
        const markIn = easeOutCubic(clamp01((merge - 0.25) / 0.75));
        markRef.current.style.opacity = String(markIn);
        markRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${0.55 + 0.45 * markIn}) rotate(${(1 - markIn) * -35}deg)`;
      }

      if (captionRef.current && active !== lastIndex) {
        lastIndex = active;
        captionRef.current.dataset.index = String(active);
      }
      if (captionRef.current) {
        captionRef.current.style.opacity = String(1 - eased);
      }
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [elements]);

  return (
    <section
      ref={scrollerRef}
      // Scroll room: roughly one viewport per element, plus the merge.
      style={{ height: `${elements.length * 62 + 120}vh` }}
      className="relative w-full bg-slate-950"
      aria-label="Our elements"
    >
      <div
        ref={stageRef}
        className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden"
      >
        {/* Heading sits above the stage and stays put. */}
        <div className="pointer-events-none absolute top-24 left-1/2 z-20 w-full -translate-x-1/2 px-6 text-center">
          <p className="eyebrow mb-2">Our elements</p>
          <h2 className="text-4xl font-bold md:text-5xl">Eight forces, one spark</h2>
        </div>

        {/* Converging rays — one per element, laid out as the glyph's points. */}
        <svg
          viewBox="0 0 92.41 97.5"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2"
          aria-hidden
        >
          {elements.map((element, i) => (
            <path
              key={element.name}
              ref={(el) => {
                rayRefs.current[i] = el;
              }}
              d={SPARK_PATH}
              fill={element.accent}
              opacity={0}
              style={{
                transformOrigin: "46.2px 48.75px",
                transition: "opacity 200ms linear",
                // Each ray is the whole glyph rotated onto its own point, so
                // the assembled shape is exactly the SPARK mark.
                rotate: `${(i / elements.length) * 360}deg`,
                mixBlendMode: "screen",
              }}
            />
          ))}
        </svg>

        {/* The resolved mark. */}
        <div
          ref={markRef}
          className="pointer-events-none absolute top-1/2 left-1/2 h-[46vmin] w-[46vmin] opacity-0"
          aria-hidden
        >
          <svg viewBox="0 0 92.41 97.5" className="h-full w-full">
            <defs>
              <linearGradient id="mission-spark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f17211" />
                <stop offset="100%" stopColor="#b10eca" />
              </linearGradient>
            </defs>
            <path d={SPARK_PATH} fill="url(#mission-spark)" />
          </svg>
        </div>

        {/* Element cards, positioned around the circle by the paint loop. */}
        {elements.map((element, i) => (
          <div
            key={element.name}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute top-1/2 left-1/2 w-40 opacity-0 md:w-48"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full blur-xl"
                  style={{ background: element.accent, opacity: 0.18 }}
                  aria-hidden
                />
                <Image
                  src={element.image}
                  alt=""
                  width={64}
                  height={64}
                  className="relative size-12 object-contain md:size-16"
                />
              </div>
              <span className="text-sm font-semibold md:text-base">
                {element.name}
              </span>
            </div>
          </div>
        ))}

        {/* Caption for whichever element is current.
            Captions cross-fade via CSS keyed on the container's data-index, so
            the paint loop can swap them by setting one attribute rather than
            triggering a React render every frame. Selectors are scoped to
            .mission-captions so they cannot leak onto anything else. */}
        <div
          ref={captionRef}
          data-index="0"
          className="mission-captions pointer-events-none absolute bottom-24 left-1/2 grid w-full max-w-md -translate-x-1/2 px-6 text-center"
        >
          {elements.map((element, i) => (
            <p
              key={element.name}
              data-caption={i}
              className="text-sm text-muted-foreground [grid-area:1/1]"
            >
              {element.description}
            </p>
          ))}
        </div>

        {/* Progress rail. */}
        <div className="absolute right-6 bottom-10 left-6 h-px bg-white/10">
          <div
            ref={progressRef}
            className="h-full origin-left bg-gradient-to-r from-orange-500 to-violet-500"
            style={{ transform: "scaleX(0)" }}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
