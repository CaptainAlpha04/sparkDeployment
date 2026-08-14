"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  /** Delay before this element animates in, ms. */
  delay?: number;
  /** Fraction of the element that must be visible before it triggers. */
  amount?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-triggered entrance.
 *
 * The original site had zero scroll-linked motion — everything fired on mount,
 * so content below the fold had already finished animating by the time you
 * reached it. This reuses the original `swipe-from-bottom` easing curve so the
 * new motion reads as the same design language.
 *
 * Animates once and then stops observing. Honours prefers-reduced-motion via
 * the `.reveal` rules in globals.css.
 */
export function Reveal({
  children,
  delay = 0,
  amount = 0.2,
  as: Tag = "div",
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: amount },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [amount]);

  return (
    <Tag
      ref={ref}
      data-visible={visible}
      className={`reveal ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

type StaggerProps = {
  children: ReactNode;
  /** Gap between each child's entrance, ms. */
  step?: number;
  /** Delay before the first child, ms. */
  initialDelay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Reveals each child in sequence. Every repeated grid on the old site
 * (sponsors, stats, community cards, elements, chapters, events) either
 * animated all at once or not at all.
 */
export function Stagger({
  children,
  step = 80,
  initialDelay = 0,
  as: Tag = "div",
  className = "",
}: StaggerProps) {
  return (
    <Tag className={className}>
      {Children.map(children, (child, i) =>
        isValidElement(child) ? (
          <Reveal delay={initialDelay + i * step}>{child}</Reveal>
        ) : (
          child
        ),
      )}
    </Tag>
  );
}
