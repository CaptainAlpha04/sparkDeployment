"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SPARK_PATH } from "@/components/brand/spark-mark";

export type MissionElement = {
  name: string;
  description: string;
  image: string;
  accent: string;
};

type Props = { elements: MissionElement[] };

/** Geometric centre of the glyph in its own viewBox. */
const CX = 46.2;
const CY = 48.75;

/**
 * A wedge covering one eighth of the mark, used to clip the glyph so a single
 * ray can be lit independently.
 *
 * Clipping the whole glyph is deliberate rather than splitting its path data:
 * the path mixes absolute and relative movetos, so slicing it into subpaths
 * silently corrupts the relative ones.
 */
function wedge(index: number, count: number): string {
  const step = (Math.PI * 2) / count;
  const start = index * step - Math.PI / 2 - step / 2;
  const r = 140;
  const points = [`${CX},${CY}`];
  for (let i = 0; i <= 8; i += 1) {
    const a = start + (step * i) / 8;
    points.push(`${CX + Math.cos(a) * r},${CY + Math.sin(a) * r}`);
  }
  return points.join(" ");
}

/**
 * Our elements.
 *
 * The mark holds still on the left while the list scrolls past on the right,
 * and the ray belonging to whichever element you are reading lights in that
 * element's colour. Eight elements, eight points, one at a time.
 *
 * This replaces an earlier version that floated the elements around a circle
 * and converged them. It looked like noise: the rays overlapped into a blob,
 * the cards collided with the heading, and nothing was readable.
 */
export function ElementsSequence({ elements }: Props) {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Whichever tracked item is nearest the middle of the viewport wins,
        // so the mark never flickers between two partially visible entries.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) return;
        const index = itemRefs.current.indexOf(visible[0].target as HTMLLIElement);
        if (index >= 0) setActive(index);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.5, 1] },
    );

    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="w-full px-6 py-32"
      style={{ background: "linear-gradient(to bottom, #0b1a22, #0a0b16)" }}
      aria-label="Our elements"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 max-w-2xl">
          <p className="eyebrow mb-4">Our elements</p>
          <h2 className="text-5xl font-bold">Eight forces, one spark.</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Eight things we work on, and a mark with eight points. That was not a
            coincidence when we chose it.
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Sticky mark */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <svg
                viewBox="0 0 92.41 97.5"
                className="mx-auto w-full max-w-sm"
                aria-hidden
              >
                <defs>
                  {elements.map((element, i) => (
                    <clipPath
                      key={element.name}
                      id={`ray-clip-${i}`}
                      clipPathUnits="userSpaceOnUse"
                    >
                      <polygon points={wedge(i, elements.length)} />
                    </clipPath>
                  ))}
                </defs>

                {/* Resting state: the whole mark, barely there. */}
                <path d={SPARK_PATH} fill="currentColor" className="text-white/8" />

                {/* One lit ray at a time. */}
                {elements.map((element, i) => (
                  <g key={element.name} clipPath={`url(#ray-clip-${i})`}>
                    <path
                      d={SPARK_PATH}
                      fill={element.accent}
                      style={{
                        opacity: active === i ? 1 : 0,
                        transition: "opacity 500ms ease",
                      }}
                    />
                  </g>
                ))}
              </svg>

              <div className="mt-10 text-center">
                <p
                  key={elements[active].name}
                  className="animation-fade-in font-display text-2xl font-bold"
                  style={{ color: elements[active].accent }}
                >
                  {elements[active].name}
                </p>
                <p className="mt-1 font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
                  {String(active + 1).padStart(2, "0")} of{" "}
                  {String(elements.length).padStart(2, "0")}
                </p>
              </div>
            </div>
          </div>

          {/* The list */}
          <ul className="space-y-px">
            {elements.map((element, i) => (
              <li
                key={element.name}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="group border-t border-white/8 py-10 transition-opacity duration-500 first:border-t-0 lg:py-12"
                style={{ opacity: active === i ? 1 : 0.45 }}
              >
                <div className="flex items-start gap-5">
                  <span
                    className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-500"
                    style={{
                      borderColor:
                        active === i ? `${element.accent}66` : "rgba(255,255,255,0.08)",
                      backgroundColor:
                        active === i ? `${element.accent}14` : "transparent",
                    }}
                  >
                    <Image
                      src={element.image}
                      alt=""
                      width={28}
                      height={28}
                      className="size-6 object-contain"
                    />
                  </span>

                  <div>
                    <h3
                      className="text-2xl font-semibold transition-colors duration-500"
                      style={{
                        color: active === i ? element.accent : "var(--foreground)",
                      }}
                    >
                      {element.name}
                    </h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">
                      {element.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
