"use client";

import { useEffect, useRef } from "react";
import { Certificates } from "@/components/sections/Certificates";
import { Caret } from "@/components/ui/Caret";
import { Container } from "@/components/ui/Container";
import { certificatesHeading, experience, experienceHeading } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { SELECT_EASE } from "@/lib/typing";

type Select = <E extends Element = HTMLElement>(text: string) => E[];
type Face = "year" | "word";

/*
  The swap runs about twice the hero's pace (lib/typing.ts): the year
  changes while the reader is scrolling, so the whole select-and-type takes
  under a second (260 + 80 + 60 + 8 x 45 + 150 = 910ms for VERIFIED).
*/
const SELECT_MS = 260;
const SELECTED_MS = 80;
const GAP_MS = 60;
const TYPE_MS = 45;
const CARET_LINGER_MS = 150;

/** VERIFIED's width in em before it is measured (Clash Display, semibold, -0.03em). */
const WORD_EM_FALLBACK = 4.32;

/**
 * Dark tone. The layout is CSS: the title across the top, then a 12-col grid
 * with the giant year sticky in cols 1-4 and the roles in cols 6-12, then
 * the certificates ledger across the full width. The year column reaches
 * one year-height past the last role (an empty slot row), so the year comes
 * to rest right above the ledger and becomes its header there; it never
 * follows the ledger down. The toy is one ScrollTrigger per role, which
 * updates the year as the role crosses the middle of the screen, and one on
 * the slot, for the moment the year seats in it:
 * - Roles: the year is an odometer of four single-digit slots. Only the
 *   digits that differ roll (2025 to 2026 moves the 6 alone, 2029 to 2030
 *   moves the last two), and the rest never re-render or tween. Scrolling
 *   down rolls the old digit up and the new one in from below; scrolling
 *   back reverses it. The year is pinned to the middle of the screen, so the
 *   number always belongs to the role at the same height.
 * - The slot: once the year has seated above the ledger, it is selected
 *   (the hero's lime bar, ink text on it) and VERIFIED is typed over it,
 *   sized to fill the column exactly. Scrolling back up far enough that
 *   the year rides again selects VERIFIED and types the year back. Swaps
 *   never overlap: one asked for mid-swap runs when the current one ends.
 * The current role is the last entry (the list runs oldest first). While the
 * year belongs to it, the year and that role's title turn lime: the one
 * accent here marks what the owner is doing now.
 *
 * The whole section is one GSAP tree (no Motion here; the ledger's entrance
 * is GSAP too). useGSAP is scoped to the section ref, so blocks, slots and
 * letters are found with scoped selector text rather than refs read at
 * render.
 * Mobile: title, roles with their period inline, then the ledger under its
 * own VERIFIED heading; the year is hidden, nothing is pinned, and no
 * triggers are created below md, so the current role's period carries the
 * lime instead. Reduced motion: digits, faces and colors swap instantly.
 */
export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const first = experience[0];
  const current = experience.length - 1;

  // VERIFIED fills the year column exactly: its font size is the column
  // width (100cqw) over the word's own width in em, measured once the font
  // is in. The ratio does not depend on the size, so it is measured once.
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      const word = sectionRef.current?.querySelector<HTMLElement>("[data-cert-word]");
      if (!live || !word) return;
      const probe = document.createElement("span");
      probe.className = "font-display font-semibold uppercase tracking-[-0.03em]";
      Object.assign(probe.style, { position: "absolute", visibility: "hidden", whiteSpace: "nowrap", fontSize: "100px" });
      probe.textContent = certificatesHeading;
      document.body.appendChild(probe);
      const em = probe.getBoundingClientRect().width / 100;
      probe.remove();
      if (em > 0) word.style.setProperty("--word-em", em.toFixed(4));
    });
    return () => {
      live = false;
    };
  }, []);

  useGSAP(
    (context) => {
      const select = context.selector as Select | undefined;
      if (!select) return;
      const slotEls = select("[data-slot]");
      const roles = select("[data-year]");
      const [verified] = select("[data-verified]");
      const [giant] = select("[data-giant]");
      const [word] = select("[data-cert-word]");
      const [title] = select("[data-role-title]");
      const [bar] = select("[data-select]");
      const [yearCaret] = select("[data-giant] [data-caret]");
      const [wordCaret] = select("[data-cert-word] [data-caret]");
      const letters = select("[data-cert-letter]");
      if (slotEls.length === 0 || roles.length === 0 || !verified || !giant || !word || !title || !bar) return;
      const [seat] = select("[data-seat]");
      if (!yearCaret || !wordCaret || !seat) return;
      const lastRole = roles[roles.length - 1];

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
            return { el, cur, next, digit: cur.textContent ?? "", roll: null as gsap.core.Timeline | null };
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
          const roll = (year: string, dir: number, instant = false) => {
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
              const tl = gsap.timeline({
                delay: order++ * 0.04,
                onComplete: () => {
                  settle(slot);
                  gsap.set(slot.cur, { yPercent: 0 });
                  gsap.set(slot.next, { yPercent: 100 });
                  if (slot.roll === tl) slot.roll = null;
                },
              });
              tl.fromTo(slot.cur, { yPercent: 0 }, { yPercent: -100 * dir, duration: 0.45, ease: "expo.out" }, 0).fromTo(
                slot.next,
                { yPercent: 100 * dir },
                { yPercent: 0, duration: 0.45, ease: "expo.out" },
                0,
              );
              slot.roll = tl;
            });
          };

          /*
            Faces. `face` is what shows (or is being typed in), `target` what
            the scroll position asks for, `year` the year of the role at the
            line. Letters and digit slots toggle `display`, like the hero's
            headline, so typing never lays out more than one line.
          */
          let face: Face = "year";
          let target: Face = "year";
          let year = first.year;
          let now = false;
          let busy = false;
          let selecting = false;
          let timer = 0;
          let selection: Animation | null = null;
          const wait = (ms: number, fn: () => void) => {
            timer = window.setTimeout(fn, ms);
          };

          const parts = (f: Face) => (f === "year" ? slots.map((slot) => slot.el) : letters);
          const caretOf = (f: Face) => (f === "year" ? yearCaret : wordCaret);
          const display = (els: HTMLElement[], on: boolean) => {
            for (const el of els) el.style.display = on ? "" : "none";
          };
          // Lime only while the current role is at the line: its title, and
          // its year while the year shows. Selected text is ink on the lime bar.
          const tint = () => {
            title.dataset.now = String(now);
            giant.dataset.tint = selecting && face === "year" ? "selected" : now ? "now" : "plain";
            word.dataset.tint = selecting && face === "word" ? "selected" : "plain";
          };
          const setFace = (f: Face) => {
            if (f === "year") roll(year, 1, true);
            display(parts("year"), f === "year");
            display(parts("word"), f === "word");
            face = f;
            tint();
          };

          const type = (els: HTMLElement[], done: () => void, i = 0) => {
            if (i >= els.length) {
              done();
              return;
            }
            els[i].style.display = "";
            wait(TYPE_MS, () => type(els, done, i + 1));
          };

          const swap = () => {
            if (busy || face === target) return;
            if (!animate) {
              setFace(target);
              return;
            }
            busy = true;
            const from = face;
            const to = target;
            const els = parts(from);
            const box = bar.parentElement!.getBoundingClientRect();
            const a = els[0].getBoundingClientRect();
            const b = els[els.length - 1].getBoundingClientRect();
            Object.assign(bar.style, {
              left: `${a.left - box.left}px`,
              top: `${a.top - box.top}px`,
              width: `${b.right - a.left}px`,
              height: `${a.height}px`,
            });
            bar.hidden = false;
            selecting = true;
            tint();
            selection = bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
              duration: SELECT_MS,
              easing: SELECT_EASE,
              fill: "forwards",
            });
            selection.onfinish = () => {
              wait(SELECTED_MS, () => {
                display(els, false);
                bar.hidden = true;
                selecting = false;
                // The year comes back as the role at the line has it, set
                // while nothing of it shows.
                if (to === "year") roll(year, 1, true);
                face = to;
                tint();
                const caret = caretOf(to);
                caret.hidden = false;
                wait(GAP_MS, () =>
                  type(parts(to), () => {
                    wait(CARET_LINGER_MS, () => {
                      caret.hidden = true;
                      busy = false;
                      // The line may have moved to another role meanwhile.
                      if (face === "year") roll(year, 1);
                      swap();
                    });
                  }),
                );
              });
            };
          };

          // Triggers run in creation order, so a fast jump that crosses several
          // blocks in one frame would let the wrong callback speak last. Each
          // callback therefore reads which block sits at the line right now.
          // Roles count from the middle line. VERIFIED shows exactly while
          // the year is seated: its sticky box has stopped in the slot (the
          // slot's top has reached the box), so a little scroll back up,
          // which lets the year ride again, brings the year back.
          const line = 0.5;
          const seated = () => verified.getBoundingClientRect().top <= seat.getBoundingClientRect().top + 1;
          const pick = (dir = 1, instant = false) => {
            const y = window.innerHeight * line;
            let active = roles[0];
            for (const role of roles) {
              if (role.getBoundingClientRect().top <= y) active = role;
            }
            const sits = seated();
            now = !sits && active === lastRole;
            target = sits ? "word" : "year";
            if (!sits) {
              year = active.dataset.year ?? year;
              // While VERIFIED shows (or is on its way), the year waits
              // hidden and is set when it is typed back in.
              if (face === "year" && !busy) roll(year, dir, instant);
            }
            if (instant) setFace(target);
            else {
              tint();
              swap();
            }
          };

          roles.forEach((role) => {
            ScrollTrigger.create({
              trigger: role,
              start: `top ${line * 100}%`,
              end: `bottom ${line * 100}%`,
              onEnter: () => pick(1),
              onEnterBack: () => pick(-1),
            });
          });
          // The slot's top meets the sticky top of the year (50% of the
          // screen minus half the year's height) the moment the year seats.
          ScrollTrigger.create({
            trigger: verified,
            start: () => `top ${window.innerHeight * line - giant.offsetHeight / 2}px`,
            onToggle: (self) => pick(self.direction),
          });
          // A page that loads already scrolled into the list starts on the right face.
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
            window.clearTimeout(timer);
            selection?.cancel();
            bar.hidden = true;
            yearCaret.hidden = true;
            wordCaret.hidden = true;
            // Rolls start in trigger callbacks, outside this context, so stop
            // them here and leave each slot showing its target digit.
            for (const slot of slots) {
              slot.roll?.kill();
              settle(slot);
            }
            busy = false;
            selecting = false;
            now = false;
            setFace("year");
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

        {/* < md: one column, the year column is hidden. md+: year in 1-4 (sticky), roles and ledger in 6-12. */}
        <div className="mt-16 grid grid-cols-1 gap-x-6 md:mt-24 md:grid-cols-12">
          <div className="hidden md:col-span-4 md:row-span-2 md:block">
            {/*
              Pinned to the vertical center of the screen: 50vh minus half the
              year's own height (line-height 0.86em), so its middle sits on the
              same line the blocks are measured against. The inner box is a
              size container, so VERIFIED can size itself to the column.
            */}
            <div data-seat className="md:sticky md:top-[calc(50vh-0.43em)] md:text-giant">
              <div aria-hidden className="relative @container">
                {/* Selection bar, behind the text, placed by the scene. */}
                <span data-select hidden className="pointer-events-none absolute left-0 top-0 origin-left bg-accent" />
                {/*
                  nowrap: the four slots must never break onto two lines. Each
                  slot is a one-cell grid clipped on y only, so a digit rolls
                  in and out of its own cell. The spare starts parked below.
                  One line tall even with every slot hidden, so VERIFIED,
                  centered on this box, stays on the year's line.
                */}
                <div
                  data-giant
                  data-tint="plain"
                  className="relative min-h-[0.86em] whitespace-nowrap font-display text-giant tabular-nums transition-colors duration-500 ease-out-expo data-[tint=now]:text-accent data-[tint=selected]:text-ink"
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
                  <Caret />
                </div>
                {/* VERIFIED, centered on the year's middle line, every letter hidden until typed. */}
                <div
                  data-cert-word
                  data-tint="plain"
                  className="absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap font-display font-semibold uppercase leading-[0.86] tracking-[-0.03em] transition-colors duration-500 ease-out-expo data-[tint=selected]:text-ink"
                  style={{ fontSize: `calc(100cqw / var(--word-em, ${WORD_EM_FALLBACK}))` }}
                >
                  {[...certificatesHeading].map((letter, i) => (
                    <span key={i} data-cert-letter className="relative inline-block" style={{ display: "none" }}>
                      {letter}
                    </span>
                  ))}
                  <Caret />
                </div>
              </div>
            </div>
          </div>

          {/* From md the last role closes the list with a rule; below md the ledger heading follows instead. */}
          <ol className="md:col-span-7 md:col-start-6 md:row-start-1">
              {experience.map((item, i) => (
                <li
                  key={`${item.year}-${item.company}`}
                  data-year={item.year}
                  className={`border-t border-line py-10 ${i === current ? "md:border-b" : ""}`}
                >
                  <h3
                    data-role-title={i === current ? "" : undefined}
                    data-now="false"
                    className="font-display text-h2 transition-colors duration-500 ease-out-expo data-[now=true]:text-accent"
                  >
                    {item.role}
                  </h3>
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

          {/*
            md+: the slot the year comes to rest in, one year-height tall
            (the year column spans this row too, so its sticky year stops
            here). While the year is seated in it, the year reads VERIFIED.
          */}
          <div
            aria-hidden
            data-verified
            className="hidden md:col-span-7 md:col-start-6 md:row-start-2 md:mt-24 md:block md:h-[0.86em] md:text-giant"
          />
        </div>

        <Certificates />
      </Container>
    </section>
  );
}
