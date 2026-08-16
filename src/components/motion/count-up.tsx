"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** e.g. "500+" — the numeric part animates, the suffix is appended. */
  value: string;
  durationMs?: number;
  className?: string;
};

/** Splits "500+" into { target: 500, suffix: "+" }. */
function parse(value: string): { target: number; suffix: string } {
  const match = value.match(/^([\d.,]+)(.*)$/);
  if (!match) return { target: 0, suffix: value };
  return {
    target: Number(match[1].replace(/,/g, "")) || 0,
    suffix: match[2] ?? "",
  };
}

/**
 * Counts up when scrolled into view.
 *
 * The old build shipped this component (app/components/Count.jsx) styled
 * exactly like the "Our Impact" figures, but never imported it anywhere — the
 * numbers were static strings. This wires it up, and handles the suffix the
 * original couldn't (it took a bare number, while the stats are "500+").
 */
export function CountUp({ value, durationMs = 1600, className = "" }: Props) {
  const { target, suffix } = parse(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let start: number | null = null;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Deferred to the next frame rather than set synchronously in the effect
      // body, which would trigger a cascading render.
      raf = requestAnimationFrame(() => {
        setDisplay(target);
        setDone(true);
      });
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const tick = (t: number) => {
          if (start === null) start = t;
          const progress = Math.min((t - start) / durationMs, 1);
          // easeOutExpo — fast start, long settle, so the number lands softly.
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setDisplay(Math.round(target * eased));
          if (progress < 1) raf = requestAnimationFrame(tick);
          else setDone(true);
        };

        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        // The gradient drifts as the number climbs, then settles.
        backgroundSize: "200% 100%",
        backgroundPosition: done ? "0% 50%" : "100% 50%",
        transition: "background-position 1600ms ease-out",
      }}
    >
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
