"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Drives Lenis from the GSAP ticker so ScrollTrigger and Lenis share one
 * clock. Lives as a child of ReactLenis and uses `useLenis`, which re-renders
 * once the instance exists. A parent-level ref would read `undefined` on the
 * first effect pass and the page would never scroll under wheel input.
 */
function LenisTicker() {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    const onScroll = () => ScrollTrigger.update();
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", onScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
    };
  }, [lenis]);
  return null;
}

/**
 * Motion root plus Lenis smooth scroll. Under reduced motion Lenis is skipped
 * and Motion drops transforms; GSAP scenes handle their own fallback with
 * gsap.matchMedia.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const content = <MotionConfig reducedMotion="user">{children}</MotionConfig>;

  if (reduce) return content;

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        lerp: 0.09,
        duration: 1.2,
        smoothWheel: true,
        anchors: true,
      }}
    >
      <LenisTicker />
      {content}
    </ReactLenis>
  );
}
