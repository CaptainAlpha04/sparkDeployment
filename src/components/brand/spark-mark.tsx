"use client";

import { useEffect, useRef } from "react";

/**
 * The SPARK glyph — an eight-point burst.
 *
 * This is the organisation's own mark, lifted from the old footer where it sat
 * at 96px as decoration. It is the single strongest asset the brand owns and
 * a literal rendering of the name, so it carries the identity here instead.
 *
 * `interactive` makes the rays lean toward the pointer and the core pulse,
 * which is the page's one deliberate flourish. Everything else stays quiet.
 */
export const SPARK_PATH =
  "M39.59,41.44,21.44,31.32,14.4,17,27,24.51l1.48.88ZM16,44.28l-1.68.37L0,47.76l14.92,5.65,20.17-5Zm57.32,0-1.68.37L57.32,47.76l14.92,5.65,20.17-5ZM68.62,64.82,67.12,64,54.35,56.78l7.39,14.14,18.39,9.67ZM50.06,76.32,46.28,60.37,41.54,77.76q2,9.87,4,19.74Q47.79,86.91,50.06,76.32Zm1.08-60.38L47.35,0,42.62,17.39q2,9.87,4,19.74Q48.87,26.54,51.14,15.94ZM13.07,79.42l18.39-9.67,7.39-14.14L26.08,62.8l-1.51.85ZM53.29,42,71.44,31.85l7-14.32L65.88,25.05l-1.48.88Z";

type Props = {
  className?: string;
  interactive?: boolean;
  /** Gradient fill rather than currentColor. */
  gradient?: boolean;
};

export function SparkMark({
  className = "size-24",
  interactive = false,
  gradient = false,
}: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onPointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalised offset, clamped so the mark never wanders far.
      targetX = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
      targetY = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
    };

    const tick = () => {
      // Ease toward the pointer so movement feels weighted, not twitchy.
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      el.style.transform = `translate3d(${currentX * 14}px, ${currentY * 14}px, 0) rotate(${currentX * 8}deg)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(raf);
    };
  }, [interactive]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 92.41 97.5"
      className={className}
      role="img"
      aria-label="SPARK"
      style={{ willChange: interactive ? "transform" : undefined }}
    >
      {gradient && (
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f17211" />
            <stop offset="100%" stopColor="#b10eca" />
          </linearGradient>
        </defs>
      )}
      <path
        d={SPARK_PATH}
        fill={gradient ? "url(#spark-grad)" : "currentColor"}
      />
    </svg>
  );
}

/**
 * A small spark used as a structural marker — section dividers and list
 * bullets. Replaces the generic lightning-bolt SVG the old build used, which
 * belonged to no particular brand.
 */
export function SparkBullet({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 92.41 97.5" className={className} aria-hidden>
      <path d={SPARK_PATH} fill="currentColor" />
    </svg>
  );
}
