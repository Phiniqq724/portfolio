"use client";

import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import { Corners } from "@/components/ui/Corners";
import { certificates, certificatesHeading } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";

/*
  Certificates. Dark tone, a ledger: the coda of the Evidence story, small
  and quiet between the last full-screen card and the Experience heading.
  One `meta` label with a count, then one hairline row per certificate, each
  row a single link to its verification page.

  Layout, md+: the 12-col grid. Year in cols 1-2, title in 3-8, issuer in
  9-11, arrow at the right edge of 12. Below 768px: the title takes its own
  line, year and issuer sit under it as a small line, and the arrow stays at
  the right, centered on both lines.

  Hover and focus are a hint, never a block of lime: the title and the arrow
  turn lime (lime text is AA on ink only, and this section is always dark),
  the arrow steps up and right, the year brightens to the main text color, and
  crop marks fade in around the arrow on hover (focus already draws the
  outline, so the marks would only crowd it). Transforms, opacity, and color
  only.

  Toy, motion on, any width: as the list enters, the hairlines draw in from
  the left and each row's text rises a little, staggered, once. The server
  renders everything in its final state, so without JS, and under reduced
  motion (no tween is created), the list is simply there. No pinning, no
  scrub.
*/

/** The arrow, two strokes: a diagonal and the corner it points to. */
function Arrow() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3.5 12.5 12.5 3.5M5 3.5h7.5V11" />
    </svg>
  );
}

export function Certificates() {
  const sectionRef = useRef<HTMLElement>(null);
  const count = String(certificates.length).padStart(2, "0");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const list = sectionRef.current?.querySelector("ul");
        if (!list) return;
        const tl = gsap.timeline({
          scrollTrigger: { trigger: list, start: "top 85%", once: true },
          defaults: { duration: 0.9, ease: "expo.out" },
        });
        tl.from("[data-rule]", { scaleX: 0, stagger: 0.07 }, 0).from(
          "[data-cells]",
          { yPercent: 40, opacity: 0, stagger: 0.07 },
          0.12,
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="certificates"
      data-tone="dark"
      aria-labelledby="certificates-heading"
      className="pt-24 md:pt-32"
    >
      <Container>
        <div className="flex items-baseline gap-3">
          <h2 id="certificates-heading" className="meta">
            {certificatesHeading}
          </h2>
          {/* The list already announces its length; the count is for the eye. */}
          <span aria-hidden className="index">
            ({count})
          </span>
        </div>

        <ul className="mt-8 md:mt-10">
          {certificates.map((cert) => (
            <li key={cert.href} className="relative">
              {/*
                Hairlines are spans rather than borders so the entrance can
                draw them in. Only top rules: the ledger has no closing line,
                because the Experience heading and its first role rule follow
                right after, and a closing rule here stacked a third line into
                one short stretch of the screen.
              */}
              <span data-rule aria-hidden className="absolute inset-x-0 top-0 h-px origin-left bg-line" />
              <a
                href={cert.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${cert.title}, ${cert.issuer}, ${cert.year}. Opens the verification page in a new tab`}
                className="group block py-4 md:py-5"
              >
                {/*
                  < md: three columns, title across the first two on line one,
                  year and issuer on line two, arrow in the third spanning both.
                  md+: one line on the 12-col grid.
                */}
                <span
                  data-cells
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 md:grid-cols-12 md:gap-x-6"
                >
                  <span className="col-start-1 row-start-2 text-sm tabular-nums text-fg-2 transition-[color,translate] duration-500 ease-out-expo group-hover:text-fg group-focus-visible:text-fg md:col-span-2 md:row-start-1 md:text-body md:group-hover:translate-x-1 md:group-focus-visible:translate-x-1">
                    {cert.year}
                  </span>
                  <span className="col-span-2 col-start-1 row-start-1 font-display text-h3 text-balance transition-colors duration-500 ease-out-expo group-hover:text-accent group-focus-visible:text-accent md:col-span-6 md:col-start-3">
                    {cert.title}
                  </span>
                  <span className="col-start-2 row-start-2 min-w-0 text-sm text-fg-2 md:col-span-3 md:col-start-9 md:row-start-1 md:text-body">
                    {cert.issuer}
                  </span>
                  <span className="relative col-start-3 row-span-2 row-start-1 flex h-10 w-10 items-center justify-center self-center transition-[color,translate] duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-accent group-focus-visible:translate-x-1 group-focus-visible:-translate-y-1 group-focus-visible:text-accent md:col-span-1 md:col-start-12 md:row-span-1 md:justify-self-end">
                    <Arrow />
                    <Corners
                      size={6}
                      className="text-fg opacity-0 transition-opacity duration-500 ease-out-expo group-hover:opacity-100"
                    />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
