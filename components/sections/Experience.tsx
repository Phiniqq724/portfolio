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
 * the middle of the screen. The year is an odometer of four single-digit
 * slots: only the digits that differ roll (2025 to 2026 moves the 6 alone,
 * 2029 to 2030 moves the last two), and the rest never re-render or tween.
 * Scrolling down rolls the old digit up and the new one in from below;
 * scrolling back reverses it. The year itself is pinned to the middle of the
 * screen, so the number always belongs to the role at the same height.
 *
 * The whole section is one GSAP tree (no Motion here). useGSAP is scoped to
 * the section ref, so the role blocks and digit slots are found with scoped
 * selector text rather than refs read at render.
 * The current role is the last entry (the list runs oldest first). While the
 * year belongs to it, the year turns lime: the one accent here marks what the
 * owner is doing now. It fades with the roll and back on the way up.
 * Mobile: title, then roles stacked with their period inline; the year is hidden
 * and no triggers are created below md, so the current role's period carries
 * the lime instead. Reduced motion: digits and color swap instantly.
 */
export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const first = experience[0];
  const current = experience.length - 1;

  useGSAP(
    (context) => {
      const select = context.selector as Select | undefined;
      if (!select) return;
      const slotEls = select("[data-slot]");
      const blocks = select("[data-year]");
      const [giant] = select("[data-giant]");
      if (slotEls.length === 0 || blocks.length === 0 || !giant) return;

      const mm = gsap.matchMedia();
      mm.add(
        { md: "(min-width: 768px)", animate: "(prefers-reduced-motion: no-preference)" },
        (mmContext) => {
          const md = mmContext.conditions?.md;
          const animate = mmContext.conditions?.animate;
          if (!md) return;

          // Each slot holds the digit on screen (`cur`) and a spare (`next`)
          // parked one cell below. A roll moves both, then writes the new
          // digit into `cur` and parks the spare again, so `cur` is always the
          // visible one when a slot is at rest. `digit` is the slot's target.
          const slots = slotEls.map((el) => {
            const cur = el.querySelector<HTMLElement>("[data-cur]")!;
            const next = el.querySelector<HTMLElement>("[data-next]")!;
            return { cur, next, digit: cur.textContent ?? "", roll: null as gsap.core.Timeline | null };
          });
          type Slot = (typeof slots)[number];

          // Clash Display has no tabular figures (a 1 is half as wide as a 0),
          // so the cell takes the incoming digit's width the moment a roll
          // starts: the outgoing digit leaves the flow while it rolls away.
          // Otherwise the digits to its right would jump after the roll ends.
          const settle = (slot: Slot) => {
            slot.cur.textContent = slot.digit;
            slot.cur.style.position = "";
          };
          // The spare is parked by an inline translateY(100%) from the server,
          // which GSAP would read as pixels; restate it in percent.
          if (animate) {
            gsap.set(slots.map((slot) => slot.cur), { y: 0, yPercent: 0 });
            gsap.set(slots.map((slot) => slot.next), { y: 0, yPercent: 100 });
          }

          // dir 1: scrolling down, the old digit leaves upward and the new one
          // rises from below. dir -1: the reverse.
          const show = (year: string, dir: number, instant = false) => {
            let order = 0;
            slots.forEach((slot, i) => {
              const digit = year[i] ?? "";
              if (digit === slot.digit) return;
              // A fast jump can land while this slot is still rolling. Finish
              // that roll first so the slot is at rest with one digit showing.
              slot.roll?.progress(1).kill();
              slot.digit = digit;
              if (instant || !animate) {
                settle(slot);
                return;
              }
              slot.next.textContent = digit;
              slot.cur.style.position = "absolute";
              const roll = gsap.timeline({
                delay: order++ * 0.04,
                onComplete: () => {
                  settle(slot);
                  gsap.set(slot.cur, { yPercent: 0 });
                  gsap.set(slot.next, { yPercent: 100 });
                  if (slot.roll === roll) slot.roll = null;
                },
              });
              roll
                .fromTo(slot.cur, { yPercent: 0 }, { yPercent: -100 * dir, duration: 0.45, ease: "expo.out" }, 0)
                .fromTo(slot.next, { yPercent: 100 * dir }, { yPercent: 0, duration: 0.45, ease: "expo.out" }, 0);
              slot.roll = roll;
            });
          };

          // Triggers run in creation order, so a fast jump that crosses several
          // blocks in one frame would let the wrong callback speak last. Each
          // callback therefore reads which block sits at the line right now.
          const line = 0.5;
          const pick = (dir = 1, instant = false) => {
            const y = window.innerHeight * line;
            let active = blocks[0];
            for (const block of blocks) {
              if (block.getBoundingClientRect().top <= y) active = block;
            }
            show(active.dataset.year ?? "", dir, instant);
            giant.dataset.now = active === blocks[blocks.length - 1] ? "true" : "false";
          };

          blocks.forEach((block) => {
            ScrollTrigger.create({
              trigger: block,
              start: `top ${line * 100}%`,
              end: `bottom ${line * 100}%`,
              onEnter: () => pick(1),
              onEnterBack: () => pick(-1),
            });
          });
          // A page that loads already scrolled into the list starts on the right year.
          pick(1, true);

          // Sections above this one (the accordion) change the document height
          // after load, which moves every trigger line. Re-measure once the
          // height has settled instead of on every animation frame.
          const refresh = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
          const observer = new ResizeObserver(() => {
            refresh.restart(true);
          });
          observer.observe(document.body);
          return () => {
            observer.disconnect();
            refresh.kill();
            // Rolls start in trigger callbacks, outside this context, so stop
            // them here and leave each slot showing its target digit.
            for (const slot of slots) {
              slot.roll?.kill();
              settle(slot);
            }
            giant.dataset.now = "false";
          };
        },
      );

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="experience" data-tone="dark" className="py-section">
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
              {/*
                nowrap: the four slots must never break onto two lines. Each
                slot is a one-cell grid clipped on y only, so a digit rolls
                in and out of its own cell. The spare starts parked below.
              */}
              <div
                aria-hidden="true"
                data-giant
                data-now="false"
                className="whitespace-nowrap font-display text-giant tabular-nums transition-colors duration-500 ease-out-expo data-[now=true]:text-accent"
              >
                {[...first.year].map((digit, i) => (
                  <span key={i} data-slot className="relative inline-grid overflow-y-clip">
                    <span data-cur className="[grid-area:1/1]">
                      {digit}
                    </span>
                    <span data-next className="[grid-area:1/1]" style={{ transform: "translateY(100%)" }}>
                      {digit}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* No closing rule after the last role: the footer's top line follows and closes the list. */}
          <ol className="md:col-span-7 md:col-start-6">
            {experience.map((item, i) => (
              <li
                key={`${item.year}-${item.company}`}
                data-year={item.year}
                className="border-t border-line py-10"
              >
                <h3 className="font-display text-h2">{item.role}</h3>
                <p className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 text-fg-2">
                  <a href={item.href} target="_blank" rel="noreferrer" className="link-line hover:link-line-hover">
                    {item.company}
                  </a>
                  {/* The current role's period is lime below md, where the giant year is hidden. */}
                  <span className={`tabular-nums ${i === current ? "max-md:text-accent" : ""}`}>{item.period}</span>
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
