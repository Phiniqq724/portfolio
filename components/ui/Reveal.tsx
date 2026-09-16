"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE, delay: i * 0.07 },
  }),
};

type Props = {
  children: ReactNode;
  className?: string;
  /** Stagger index inside a group. */
  index?: number;
  /** Animate on mount instead of on scroll (hero only). */
  onMount?: boolean;
  as?: "div" | "p" | "li" | "h1" | "h2" | "h3" | "span";
};

/**
 * Single reveal primitive for the whole page. Fade + 20px rise, once.
 * Motion dial is 4: no parallax, no loops, no scroll hijack beyond Lenis.
 *
 * Reduced motion is handled by `MotionConfig reducedMotion="user"` in
 * SmoothScroll: the y transform is dropped and only the opacity fades. The
 * element type never changes between server and client, so hydration cannot
 * leave the server-rendered `opacity: 0` behind.
 */
export function Reveal({ children, className, index = 0, onMount = false, as = "div" }: Props) {
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      custom={index}
      variants={revealVariants}
      initial="hidden"
      {...(onMount
        ? { animate: "visible" }
        : { whileInView: "visible", viewport: { once: true, amount: 0.25, margin: "0px 0px -10% 0px" } })}
    >
      {children}
    </Tag>
  );
}
