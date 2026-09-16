"use client";

import { useLenis } from "lenis/react";
import { useRef, type FocusEvent } from "react";
import { Container } from "@/components/ui/Container";
import { certificates, certificatesHeading } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";

/*
  Certificates. The second seam: light Evidence above turns into dark
  Experience below. Like the Strip, the section has no tone and paints two
  fixed halves, canvas on top and ink underneath. Unlike the Strip, nothing
  rides an arc: five lime tickets sit in one straight row across the seam, so
  every ticket stays readable and clickable to its verification page.

  Layout: a three-row grid, `1fr auto 1fr`. The section height is content
  driven, so both flexible rows resolve to the tallest content among them (the
  heading), which keeps the ticket row centered on the section, which is where
  the seam is.

  Toy, md+ with motion on: the row's `x` is scrubbed to scroll. It enters
  from the right and ends with the last ticket fully visible. The travel runs
  from the moment the whole row is on screen at the bottom until it is about
  to slide under the fixed nav at the top, so every position of the row, and so every ticket, can
  be read with the row fully in view. It never moves on its own. No pinning.

  Below md, and under reduced motion at any width: no GSAP. The row is a
  native horizontal scroller with snap points and the gutter as scroll
  padding.
*/

/** How far right of its resting place the row starts, as a share of the viewport width. */
const ENTER = 0.08;

/** Height of the fixed nav, read from the --nav-h token so layout and motion agree. */
const navHeight = () => {
  const probe = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"));
  return (probe || 4.5) * parseFloat(getComputedStyle(document.documentElement).fontSize);
};

export function Certificates() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const lenis = useLenis();

  /*
    Row geometry, read on demand so the tween, a refresh, and the focus
    handler all agree. The row is full bleed and starts at the viewport's left
    edge, so offsets inside it are viewport positions before the transform.
    The last ticket stops with the same inset on the right as the row's left
    padding, so the two ends of the travel mirror each other.
  */
  const travel = () => {
    const row = rowRef.current;
    const last = row?.lastElementChild as HTMLElement | null;
    if (!row || !last) return { from: 0, to: 0 };
    const viewport = document.documentElement.clientWidth;
    const inset = parseFloat(getComputedStyle(row).paddingLeft) || 0;
    const overflow = last.offsetLeft + last.offsetWidth + inset - viewport;
    if (overflow <= 0) return { from: 0, to: 0 };
    return { from: window.innerWidth * ENTER, to: -overflow };
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        tweenRef.current = gsap.fromTo(
          rowRef.current,
          { x: () => travel().from },
          {
            x: () => travel().to,
            ease: "none",
            scrollTrigger: {
              trigger: rowRef.current,
              start: "bottom bottom",
              // Stop before the row reaches the fixed nav, which never hides.
              end: () => `top top+=${navHeight() + 24}`,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );
        return () => {
          tweenRef.current = null;
        };
      });
    },
    { scope: sectionRef },
  );

  /*
    A keyboard user can focus a ticket that the scrub has carried off screen.
    Scroll the page to the point where that ticket's center meets the
    viewport's center, instead of letting focus land somewhere invisible.
    Every point of the travel keeps the row fully in view vertically, so the
    clamped progress is always a readable position.
  */
  const onTicketFocus = (event: FocusEvent<HTMLAnchorElement>) => {
    const st = tweenRef.current?.scrollTrigger;
    if (!st) return;
    const { from, to } = travel();
    if (from === to) return;
    const ticket = event.currentTarget;
    const viewport = document.documentElement.clientWidth;
    const span = st.end - st.start;
    if (span <= 0) return;

    // By the time focus fires, the browser has already scrolled the ticket
    // into view vertically, but the scrub (and the trigger's cached scroll
    // value) are still catching up, so the ticket's rect shows a stale x.
    // Judge visibility from the x the scrub is heading to at the live scroll
    // position instead. A one-off read on focus, not a scroll listener.
    const now = gsap.utils.clamp(0, 1, (window.scrollY - st.start) / span);
    const left = ticket.offsetLeft + from + now * (to - from);
    const rect = ticket.getBoundingClientRect();
    const inView =
      left >= 0 && left + ticket.offsetWidth <= viewport && rect.top >= navHeight() && rect.bottom <= window.innerHeight;
    if (inView) return;

    const center = ticket.offsetLeft + ticket.offsetWidth / 2;
    const progress = gsap.utils.clamp(0, 1, (viewport / 2 - center - from) / (to - from));
    const y = st.start + progress * span;

    if (lenis) lenis.scrollTo(y, { duration: 0.6 });
    else window.scrollTo({ top: y });
  };

  return (
    <section
      ref={sectionRef}
      id="certificates"
      aria-labelledby="certificates-heading"
      className="relative isolate scroll-mt-nav overflow-x-clip py-24 md:py-32"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-canvas" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-ink" />

      <div className="grid grid-cols-1 grid-rows-[1fr_auto_1fr] gap-y-10 md:gap-y-14">
        <Container className="self-start">
          <h2 id="certificates-heading" className="meta">
            {certificatesHeading}
          </h2>
        </Container>

        {/*
          The row. Its side padding lines the first ticket up with the
          Container's content edge at every width (the 1400px cap included),
          and the snap scroller uses the same inset as its scroll padding.
          The grid column is minmax(0, 1fr) so the row, which is wider than
          the screen, never widens the grid track (and with it the 50% above).
          py-2 keeps the focus ring inside the scroller's clip below md; it is
          symmetric, so the row stays centered on the seam.
        */}
        <div
          ref={rowRef}
          className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto py-2 [--inset:max(var(--spacing-gutter),calc(50%-700px+var(--spacing-gutter)))] px-(--inset) scroll-px-(--inset) [scrollbar-width:none] md:gap-6 md:motion-safe:snap-none md:motion-safe:overflow-visible md:motion-safe:will-change-transform [&::-webkit-scrollbar]:hidden"
        >
          {certificates.map((cert) => (
            <a
              key={cert.href}
              href={cert.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${cert.title}, ${cert.issuer} ${cert.year}, verify certificate (opens in a new tab)`}
              onFocus={onTicketFocus}
              className="group relative flex w-[min(80vw,26rem)] shrink-0 snap-start flex-col bg-accent p-6 text-ink transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98] md:p-8"
            >
              <span className="flex items-start justify-between gap-4 text-sm">
                <span>{cert.issuer}</span>
                <span className="tabular-nums">{cert.year}</span>
              </span>
              <span className="mt-8 font-display text-h3 text-balance md:mt-12">{cert.title}</span>
              <span className="mt-auto pt-10 text-sm font-medium md:pt-14">
                <span className="link-line group-hover:link-line-hover">Verify</span>
              </span>
              {/*
                Hover and focus: crop marks fade in just outside the ticket,
                like the nav's "Let's Talk" button. Their color follows the
                background under them, like the nav's blend: the ticket always
                straddles the seam, so the top marks sit on canvas (ink marks)
                and the bottom marks sit on ink (canvas marks). A real blend
                mode cannot do this here, because the scrubbed row is
                transformed and blends only with its own contents.
              */}
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <span className="absolute left-0 top-0 h-3 w-3 border-l border-t border-ink" />
                <span className="absolute right-0 top-0 h-3 w-3 border-r border-t border-ink" />
                <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-canvas" />
                <span className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-canvas" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
