"use client";

import { useRef } from "react";
import { Container } from "@/components/ui/Container";
import { experience, experienceHeading } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Select = <E extends Element = HTMLElement>(text: string) => E[];

/**
 * Dark tone. The layout is CSS: the title across the top, then a 12-col grid
 * with the giant year sticky in cols 1-4 and the roles in cols 6-12. The toy
 * is one ScrollTrigger per role block that swaps the year as the block crosses
 * the middle of the screen; only the digit group that changed flips with a
 * short tween. The year itself is pinned to the middle of the screen, so the
 * number always belongs to the role at the same height.
 *
 * The whole section is one GSAP tree (no Motion here). useGSAP is scoped to
 * the section ref, so the role blocks and digit groups are found with scoped
 * selector text rather than refs read at render.
 * Mobile: title, then roles stacked with their period inline; the year is hidden
 * and no triggers are created below md.
 */
export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const first = experience[0];
  const last = experience.length - 1;

  useGSAP(
    (context) => {
      const select = context.selector as Select | undefined;
      if (!select) return;
      const [head] = select('[data-digits="head"]');
      const [tail] = select('[data-digits="tail"]');
      const blocks = select("[data-year]");
      if (!head || !tail || blocks.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add(
        { md: "(min-width: 768px)", animate: "(prefers-reduced-motion: no-preference)" },
        (mmContext) => {
          const md = mmContext.conditions?.md;
          const animate = mmContext.conditions?.animate;
          if (!md) return;

          let shown = `${head.textContent}${tail.textContent}`;

          const flip = (el: HTMLElement, text: string, instant: boolean) => {
            el.textContent = text;
            if (instant || !animate) return;
            gsap.fromTo(
              el,
              { yPercent: 30, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: 0.4, ease: "expo.out", overwrite: true },
            );
          };

          const show = (year: string, instant = false) => {
            if (year === shown) return;
            const nextHead = year.slice(0, 2);
            const nextTail = year.slice(2);
            if (nextHead !== shown.slice(0, 2)) flip(head, nextHead, instant);
            if (nextTail !== shown.slice(2)) flip(tail, nextTail, instant);
            shown = year;
          };

          // Triggers run in creation order, so a fast jump that crosses several
          // blocks in one frame would let the wrong callback speak last. Each
          // callback therefore reads which block sits at the line right now.
          const line = 0.5;
          const pick = (instant = false) => {
            const y = window.innerHeight * line;
            let active = blocks[0];
            for (const block of blocks) {
              if (block.getBoundingClientRect().top <= y) active = block;
            }
            show(active.dataset.year ?? "", instant);
          };

          blocks.forEach((block) => {
            ScrollTrigger.create({
              trigger: block,
              start: `top ${line * 100}%`,
              end: `bottom ${line * 100}%`,
              onEnter: () => pick(),
              onEnterBack: () => pick(),
            });
          });
          // A page that loads already scrolled into the list starts on the right year.
          pick(true);

          // Sections above this one (the accordion) change the document height
          // after load, which moves every trigger line. Re-measure once the
          // height has settled instead of on every animation frame.
          const refresh = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
          const observer = new ResizeObserver(() => {
            refresh.restart(true);
          });
          observer.observe(document.body);
          return () => observer.disconnect();
        },
      );

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="experience" data-tone="dark" className="scroll-mt-nav py-section">
      <Container>
        <h2 className="font-display text-display uppercase">{experienceHeading}</h2>

        {/* < md: one column, the year column is hidden. md+: year in 1-4 (sticky), roles in 6-12. */}
        <div className="mt-16 grid grid-cols-1 gap-x-6 md:mt-24 md:grid-cols-12">
          <div className="hidden md:col-span-4 md:block">
            {/*
              Pinned to the vertical center of the screen: 50vh minus half the
              year's own height (line-height 0.86em), so its middle sits on the
              same line the roles are measured against.
            */}
            <div className="md:sticky md:top-[calc(50vh-0.43em)] md:text-giant">
              {/* nowrap: the two digit groups must never break onto two lines. */}
              <div aria-hidden="true" className="whitespace-nowrap font-display text-giant tabular-nums">
                <span data-digits="head" className="inline-block">
                  {first.year.slice(0, 2)}
                </span>
                <span data-digits="tail" className="inline-block">
                  {first.year.slice(2)}
                </span>
              </div>
            </div>
          </div>

          <ol className="md:col-span-7 md:col-start-6">
            {experience.map((item, i) => (
              <li
                key={`${item.year}-${item.company}`}
                data-year={item.year}
                className={`border-t border-line py-10 ${i === last ? "border-b" : ""}`}
              >
                <h3 className="font-display text-h2">{item.role}</h3>
                <p className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 text-fg-2">
                  <a href={item.href} target="_blank" rel="noreferrer" className="link-line hover:link-line-hover">
                    {item.company}
                  </a>
                  <span className="tabular-nums">{item.period}</span>
                </p>
                <p className="mt-4 max-w-[40ch]">{item.summary}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
