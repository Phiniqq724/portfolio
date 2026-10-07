"use client";

import Image from "next/image";
import { Fragment, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { Corners } from "@/components/ui/Corners";
import { gsap, useGSAP } from "@/lib/gsap";
import { about } from "@/content/site";

/*
  Dark section. From md: portrait on cols 1-5, sticky; title, statement and
  facts on cols 7-12. Below 768px: one column in the order title, portrait,
  statement, facts, nothing sticky. The fact rows keep their 8rem label column
  at every width; it fits a 390px viewport.

  The portrait always fits, tilt and crop marks included. What has to fit is
  its footprint: the photo plus the marks 10px outside it, turned -3deg.
  For a w x h box that is w*cos + h*sin wide and w*sin + h*cos tall, so the
  width is solved from both limits (see `fit` below): the footprint must be
  no wider than the column (phones: the content width between the gutters,
  so the section's x clip never cuts a mark) and no taller than the screen
  minus the nav and 2rem above and below. It pins 2rem under the nav, so the
  whole photo and its marks stay in view while it sticks.

  Toy: the statement's words start at opacity 0.4 and scrub to 1 one after
  another as the paragraph crosses the middle of the viewport. 0.4 keeps
  even the dimmed words at 3.5:1 on ink, above the 3:1 large-text minimum. The 0.4 is
  only ever set by GSAP, so without JS or under reduced motion the paragraph
  simply reads at full opacity.
*/

const WORDS = about.statement.split(" ");

/** Portrait width that keeps the tilted photo and its outside marks in bounds. */
const fit = (() => {
  const tilt = (3 * Math.PI) / 180;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const mark = 10; // Corners offset
  const tall = about.portrait.src.height / about.portrait.src.width;
  const pad = (2 * mark * (cos + sin)).toFixed(2);
  const perWidth = (cos + sin * tall).toFixed(4);
  const perHeight = (sin + cos * tall).toFixed(4);
  return `min(calc((100% - ${pad}px) / ${perWidth}), calc((100svh - var(--nav-h) - 4rem - ${pad}px) / ${perHeight}))`;
})();

export function About() {
  const scope = useRef<HTMLElement>(null);
  const statement = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-word]",
          { opacity: 0.4 },
          {
            opacity: 1,
            stagger: 0.08,
            ease: "none",
            scrollTrigger: {
              trigger: statement.current,
              start: "top 80%",
              end: "bottom 45%",
              scrub: true,
            },
          },
        );
      });
    },
    { scope },
  );

  return (
    <section id="about" ref={scope} data-tone="dark" className="overflow-x-clip py-section">
      <Container>
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-12 md:gap-y-16">
          <h2 className="font-display text-display uppercase md:col-span-6 md:col-start-7 md:row-start-1">
            {about.heading}
          </h2>

          <div className="md:col-span-5 md:col-start-1 md:row-span-2 md:row-start-1">
            <div className="md:sticky md:top-[calc(var(--nav-h)+2rem)]">
              <div
                className="relative mx-auto rotate-[-3deg]"
                style={{
                  aspectRatio: `${about.portrait.src.width} / ${about.portrait.src.height}`,
                  width: fit,
                }}
              >
                <Image
                  src={about.portrait.src}
                  alt={about.portrait.alt}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  placeholder="blur"
                  className="object-cover"
                />
                <Corners size={14} offset={10} />
              </div>
            </div>
          </div>

          <div className="md:col-span-6 md:col-start-7 md:row-start-2">
            <p ref={statement} className="font-display text-h2 font-medium">
              {WORDS.map((word, i) => (
                <Fragment key={i}>
                  <span data-word className="inline-block">
                    {word}
                  </span>{" "}
                </Fragment>
              ))}
            </p>

            <dl className="mt-16 md:mt-20">
              {about.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="grid grid-cols-[8rem_1fr] gap-x-6 border-t border-line py-4"
                >
                  <dt className="text-sm text-fg-2">{fact.label}</dt>
                  <dd className="text-body">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}
