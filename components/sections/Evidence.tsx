"use client";

import Image from "next/image";
import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import { Corners } from "@/components/ui/Corners";
import { evidenceHeading, projects } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Project = (typeof projects)[number];

/**
 * Fixed card colors. DESIGN.md allows them here and nowhere else. Every pair
 * is on the verified AA list, so nothing inside a card uses the tone tokens.
 */
const TONE: Record<Project["tone"], string> = {
  cobalt: "bg-cobalt text-canvas",
  peach: "bg-peach text-ink",
  dark: "bg-ink text-canvas",
  accent: "bg-accent text-ink",
  plum: "bg-plum text-canvas",
  sand: "bg-sand text-ink",
};

/**
 * Evidence. GSAP scene, light tone. The title sits left and static, like
 * What I do and Experience. The section clips on the x axis only: overflow
 * hidden would make the section a scroll container and the sticky cards
 * would stop sticking to the viewport.
 */
export function Evidence() {
  return (
    <section id="evidence" data-tone="light" className="scroll-mt-nav overflow-x-clip py-section">
      <Container>
        <h2 className="font-display text-display uppercase">{evidenceHeading}</h2>
        <EvidenceStack projects={projects} />
      </Container>
    </section>
  );
}

/**
 * The toy: a sticky stack. At md+ every card is position sticky under the
 * nav, so the natural scroll does the pinning. For each card except the
 * last, a scrub tween driven by the NEXT card shrinks it to 0.94 and dims it
 * to 60% as that next card slides up over it. The dim is a canvas-colored
 * veil scrubbed to 0.4 rather than element opacity: same blend, but opaque,
 * so the titles of earlier cards never ghost through the receding one.
 * Below md there is no sticky and no tween: cards stack with a gap, image
 * above text. Under reduced motion the tween is skipped and only the native
 * sticky stacking remains.
 *
 * The wrapper is a flex column on purpose. A grid item's containing block is
 * its own grid area, which would trap each sticky card inside a row exactly
 * its own height.
 */
function EvidenceStack({ projects }: { projects: readonly Project[] }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".stack-card", scope.current ?? undefined);
        // Where a card stops is its own sticky offset. Read it from the CSS so
        // the tween end and the layout share one number.
        const stickyTop = cards.length ? parseFloat(getComputedStyle(cards[0]).top) || 0 : 0;

        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          const veil = card.querySelector<HTMLElement>("[data-veil]");
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: next,
              start: "top bottom",
              end: `top top+=${stickyTop}`,
              scrub: true,
            },
          });
          tl.to(card, { scale: 0.94, transformOrigin: "center top", ease: "none" }, 0);
          if (veil) tl.to(veil, { opacity: 0.4, ease: "none" }, 0);
        });
      });

      // Trigger positions depend on card heights, and those depend on Clash
      // Display being in. ScrollTrigger already refreshes itself on window
      // load; the font swap is the case it cannot see.
      ScrollTrigger.refresh();
      let live = true;
      document.fonts.ready.then(() => {
        if (live) ScrollTrigger.refresh();
      });
      return () => {
        live = false;
      };
    },
    { scope },
  );

  return (
    <div ref={scope} className="relative mt-16 flex flex-col gap-y-6 md:mt-24">
      {projects.map((project) => {
        const Card = project.href ? "a" : "article";
        const linkProps = project.href
          ? {
              href: project.href,
              target: "_blank",
              rel: "noreferrer",
              "aria-label": `${project.title}, opens in a new tab`,
            }
          : {};
        return (
          <Card
            key={project.index}
            {...linkProps}
            className={`stack-card group relative grid min-h-0 grid-cols-1 gap-6 p-8 md:sticky md:top-[var(--nav-h)] md:min-h-[78vh] md:grid-cols-12 md:grid-rows-[auto_1fr] md:p-12 ${TONE[project.tone]}`}
          >
            {/*
              Image. Square, like the source mockups, so nothing is cropped.
              First in flow below md; bottom-right in cols 8 to 12 at md+.
              Width is also capped by the viewport height (minus nav, padding,
              a two-line title, the meta lines and the row gap) so the whole
              card fits under the nav while stuck.
            */}
            <div className="relative aspect-square w-full rotate-[2deg] md:col-span-5 md:col-start-8 md:row-start-2 md:w-[min(100%,calc(100vh-15vw-20rem))] md:self-end md:justify-self-end">
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={project.image}
                  alt={`${project.title} preview`}
                  fill
                  sizes="(min-width: 768px) 36vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out-expo motion-safe:group-hover:scale-[1.03]"
                />
              </div>
              {/* Marks sit outside the photo, on the card color, so they show on every card. */}
              <Corners size={14} offset={8} />
            </div>

            {/*
              Title row. Title top-left, index top-right. Below md the index
              moves above the title and the title drops to text-h2, because the
              3rem floor of text-display is wider than a phone card.
            */}
            <div className="flex flex-col gap-4 md:col-span-12 md:row-start-1 md:flex-row md:items-start md:justify-between md:gap-6">
              <div className="min-w-0">
                <h3 className="font-display text-h2 uppercase text-balance md:text-display">{project.title}</h3>
                <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-body tabular-nums opacity-90 md:gap-x-3">
                  <span>{project.role}</span>
                  <span aria-hidden className="hidden h-[0.8em] w-px bg-current opacity-40 md:block" />
                  <span>{project.kind}</span>
                  <span aria-hidden className="hidden h-[0.8em] w-px bg-current opacity-40 md:block" />
                  <span>{project.partner}</span>
                  <span aria-hidden className="hidden h-[0.8em] w-px bg-current opacity-40 md:block" />
                  <span>{project.year}</span>
                </p>
              </div>
              <p className="order-first shrink-0 font-display text-h3 tabular-nums md:order-none">({project.index})</p>
            </div>

            <div className="flex max-w-[44ch] flex-col gap-4 md:col-span-6 md:col-start-1 md:row-start-2 md:self-end">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-90" aria-label="Stack">
                {project.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
              <p className="text-body">{project.summary}</p>
              {project.href && (
                <span className="text-sm font-medium">
                  <span className="link-line group-hover:link-line-hover">Visit project</span>
                </span>
              )}
            </div>

            {/* Dim veil, scrubbed by GSAP at md+. Out of the grid flow, above the content, inert. */}
            <span aria-hidden data-veil className="pointer-events-none absolute inset-0 bg-canvas opacity-0" />
          </Card>
        );
      })}
    </div>
  );
}
