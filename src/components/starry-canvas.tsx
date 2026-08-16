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

type Shooter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
  maxLife: number;
};

type Props = {
  numberOfStars?: number;
  starSize?: number;
  className?: string;
  /** Occasional streak from the upper left down to the lower right. */
  shootingStars?: boolean;
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
  shootingStars = false,
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

    /* Shooting stars.
       One at a time, spawned from the top-left quadrant and travelling down
       and to the right. Kept deliberately infrequent: the point is that you
       catch one occasionally, not that the sky is busy. */
    let shooter: Shooter | null = null;
    let nextShooterAt = 900 + Math.random() * 1200;

    const spawnShooter = (w: number, h: number): Shooter => {
      // Start above and left of the viewport so it enters already moving.
      const speed = 1.15 + Math.random() * 0.7;
      const angle = Math.PI / 5 + Math.random() * (Math.PI / 14); // ~36–49°
      return {
        x: -0.1 * w + Math.random() * 0.5 * w,
        y: -0.15 * h + Math.random() * 0.25 * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 200 + Math.random() * 170,
        life: 0,
        maxLife: 1400 + Math.random() * 500,
      };
    };

    const drawShooter = (dt: number, t: number, w: number, h: number) => {
      if (!shooter) {
        if (t >= nextShooterAt) {
          shooter = spawnShooter(w, h);
          // Several seconds before the next one.
          nextShooterAt = t + 1600 + Math.random() * 2600;
        }
        return;
      }

      shooter.life += dt;
      shooter.x += shooter.vx * dt * 0.5;
      shooter.y += shooter.vy * dt * 0.5;

      const progress = shooter.life / shooter.maxLife;
      if (progress >= 1 || shooter.x > w * 1.2 || shooter.y > h * 1.2) {
        shooter = null;
        return;
      }

      // Fade in fast, out slow, so it never pops on or off.
      const alpha = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;

      const mag = Math.hypot(shooter.vx, shooter.vy) || 1;
      const tailX = shooter.x - (shooter.vx / mag) * shooter.len;
      const tailY = shooter.y - (shooter.vy / mag) * shooter.len;

      const gradient = ctx.createLinearGradient(
        shooter.x,
        shooter.y,
        tailX,
        tailY,
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(0.3, `rgba(214, 200, 255, ${alpha * 0.6})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.beginPath();
      ctx.moveTo(shooter.x, shooter.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.stroke();

      // Bright head.
      ctx.beginPath();
      ctx.arc(shooter.x, shooter.y, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    };

    let lastT = 0;

    const draw = (t: number) => {
      const { w, h } = cssSize();
      ctx.clearRect(0, 0, w, h);

      const dt = lastT === 0 ? 16 : Math.min(48, t - lastT);
      lastT = t;

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

      if (shootingStars && !reduced) drawShooter(dt, t, w, h);
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
  }, [numberOfStars, starSize, shootingStars]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
