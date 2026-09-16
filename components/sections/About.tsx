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

  Toy: the statement's words start at opacity 0.4 and scrub to 1 one after
  another as the paragraph crosses the middle of the viewport. 0.4 keeps
  even the dimmed words at 3.5:1 on ink, above the 3:1 large-text minimum. The 0.4 is
  only ever set by GSAP, so without JS or under reduced motion the paragraph
  simply reads at full opacity.
*/

const WORDS = about.statement.split(" ");

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
    <section id="about" ref={scope} data-tone="dark" className="scroll-mt-nav overflow-x-clip py-section">
      <Container>
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-12 md:gap-y-16">
          <h2 className="font-display text-display uppercase md:col-span-6 md:col-start-7 md:row-start-1">
            {about.heading}
          </h2>

          <div className="md:col-span-5 md:col-start-1 md:row-span-2 md:row-start-1">
            <div className="md:sticky md:top-32">
              <div
                className="relative rotate-[-3deg]"
                style={{ aspectRatio: `${about.portrait.src.width} / ${about.portrait.src.height}` }}
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
