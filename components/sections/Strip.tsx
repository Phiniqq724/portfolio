"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { strip } from "@/content/site";

/*
  The seam between the light hero and the dark About. Top half canvas, bottom
  half ink, and one sentence riding a shallow arc through the seam. The text is
  filled canvas and the SVG blends with `difference`, so the same glyphs read
  ink on the canvas half and canvas on the ink half. The blend sits on the
  <svg> element rather than on <text> so it composites against the HTML halves
  in every browser.

  Toy: ScrollTrigger scrubs the textPath startOffset over the strip's own
  scroll distance, so the sentence slides along the arc as you scroll. Under
  reduced motion, or without JS, it rests at its middle offset.
*/

const REST_OFFSET = "-15%";
const SENTENCE = Array.from({ length: 3 }, () => strip.text).join("  ");

/*
  Arc geometry in a 1440 x 500 box; the seam is y=250. The baseline starts at
  y=165 off the left edge, bottoms out at y=328 in the middle and climbs back,
  so the caps (about 0.7em of the 110 unit font size) sit fully on canvas near
  the edges and fully on ink through the middle. On a 1440 wide viewport the
  glyphs cross the seam near x=264 and x=1176.

  preserveAspectRatio is xMinYMid slice: at desktop aspect ratios the box fits
  the strip's width exactly, so the alignment is moot; on tablet and phone the
  slice shows the left end of the arc, where the sentence dives from canvas
  into ink, so the seam crossing stays visible at every width.
*/
const ARC = "M -200 165 Q 720 492 1640 165";

export function Strip() {
  const wrap = useRef<HTMLDivElement>(null);
  const textPath = useRef<SVGTextPathElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!textPath.current) return;
        gsap.fromTo(
          textPath.current,
          { attr: { startOffset: "0%" } },
          {
            attr: { startOffset: "-33%" },
            ease: "none",
            scrollTrigger: {
              trigger: wrap.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
      });
    },
    { scope: wrap },
  );

  return (
    <>
      <div ref={wrap} aria-hidden className="relative isolate h-[40vh] overflow-hidden md:h-[55vh]">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-canvas" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-ink" />
        <svg
          className="absolute inset-0 h-full w-full mix-blend-difference"
          viewBox="0 0 1440 500"
          preserveAspectRatio="xMinYMid slice"
          focusable="false"
        >
          <defs>
            <path id="strip-arc" d={ARC} fill="none" />
          </defs>
          <text
            fontSize="110"
            fontWeight="600"
            letterSpacing="-0.015em"
            wordSpacing="0.1em"
            xmlSpace="preserve"
            style={{ fontFamily: "var(--font-display)", fill: "var(--canvas)", whiteSpace: "pre" }}
          >
            <textPath ref={textPath} href="#strip-arc" startOffset={REST_OFFSET}>
              {SENTENCE}
            </textPath>
          </text>
        </svg>
      </div>
      <p className="sr-only">{strip.text}</p>
    </>
  );
}
