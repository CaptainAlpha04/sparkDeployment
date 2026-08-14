"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  twinkleSpeed: number;
  /** Per-star phase offset. The old build shared one global Date.now() clock,
   *  so every star twinkled in lockstep. */
  phase: number;
  depth: number;
};

type Props = {
  numberOfStars?: number;
  starSize?: number;
  className?: string;
};

/**
 * The SPARK starfield.
 *
 * Rebuilt from a630ff7:app/components/StarryCanvas.jsx. Same visual, four
 * defects fixed:
 *   1. The old loop never cancelled its rAF on unmount, leaking a running
 *      animation on every navigation.
 *   2. No devicePixelRatio scaling, so stars were blurry on retina displays.
 *   3. Resize regenerated the entire field, making the sky jump.
 *   4. All stars shared one Date.now() phase, so they pulsed in unison.
 *
 * Also pauses when off-screen and honours prefers-reduced-motion.
 */
export default function StarryCanvas({
  numberOfStars = 200,
  starSize = 2,
  className = "absolute inset-0 z-0 h-full w-full",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const makeStar = (w: number, h: number): Star => {
      // Three depth bands drive size and drift speed, giving parallax.
      const depth = 0.4 + Math.random() * 0.6;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * starSize * depth,
        dx: (Math.random() - 0.5) * 0.2 * depth,
        dy: (Math.random() - 0.5) * 0.2 * depth,
        twinkleSpeed: 0.0006 + Math.random() * 0.0016,
        phase: Math.random() * Math.PI * 2,
        depth,
      };
    };

    const cssSize = () => ({
      w: canvas.clientWidth || window.innerWidth,
      h: canvas.clientHeight || window.innerHeight,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { w, h } = cssSize();
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (starsRef.current.length === 0) {
        starsRef.current = Array.from({ length: numberOfStars }, () =>
          makeStar(w, h),
        );
      } else {
        // Keep existing stars, just pull strays back inside the new bounds.
        for (const s of starsRef.current) {
          if (s.x > w) s.x = Math.random() * w;
          if (s.y > h) s.y = Math.random() * h;
        }
      }
    };

    const draw = (t: number) => {
      const { w, h } = cssSize();
      ctx.clearRect(0, 0, w, h);

      for (const s of starsRef.current) {
        if (!reduced) {
          s.x += s.dx;
          s.y += s.dy;
          if (s.x < 0) s.x = w;
          if (s.x > w) s.x = 0;
          if (s.y < 0) s.y = h;
          if (s.y > h) s.y = 0;
        }

        const opacity = reduced
          ? 0.7
          : (Math.sin(s.phase + s.twinkleSpeed * t) + 1) / 2;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      if (visibleRef.current) draw(t);
      rafRef.current = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);

    // Stop burning frames when the hero scrolls away.
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    if (reduced) {
      draw(0);
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("resize", resize);
      io.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [numberOfStars, starSize]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
