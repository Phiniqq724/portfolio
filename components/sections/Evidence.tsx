"use client";

import Image from "next/image";
import { useLenis } from "lenis/react";
import { useRef, type CSSProperties, type FocusEvent } from "react";
import { Container } from "@/components/ui/Container";
import { Corners } from "@/components/ui/Corners";
import { evidenceHeading, projects } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Project = (typeof projects)[number];

/**
 * Black and white cards (`scheme` in content/site.ts, alternating), so lime is
 * the only color in the section. The surface and the text color are split:
 * the surface belongs to the inner layer that tips back, the text color to
 * the card itself, so the focus ring (currentColor) always contrasts with the
 * card it sits on. Canvas cards carry a hairline edge, because they would
 * otherwise vanish into the canvas section as they fall. Cards are not
 * data-tone, so each also names its "Visit project" hover hint (lime text on
 * ink, a lime band behind ink text on canvas) and the color the nav takes
 * over it (`nav`, see NavProbe).
 */
const SCHEME: Record<Project["scheme"], { bg: string; fg: string; nav: "ink" | "canvas"; edge: boolean }> = {
  dark: { bg: "bg-ink", fg: "text-canvas hint-dark", nav: "canvas", edge: false },
  light: { bg: "bg-canvas", fg: "text-ink hint-light", nav: "ink", edge: true },
};

/**
 * How a covered card falls back. Every card rolls its own fall on each page
 * load, so the stack never repeats a pattern: it drops to the left or the
 * right, pivots near that top corner, swings toward that side (rotationY and
 * a sideways drift) and turns a few degrees the same way. Scrubbed from
 * flat, ease none. The section clips x, so a drift never adds a scrollbar.
 * Pure coin flips can land five lefts in a row, which reads as a rule
 * again, so a side never repeats more than twice: `previous` is the sides
 * rolled so far.
 */
function rollFall(previous: number[]) {
  const [a, b] = previous.slice(-2);
  const side = a !== undefined && a === b ? -a : Math.random() < 0.5 ? -1 : 1;
  previous.push(side);
  const r = gsap.utils.random;
  return {
    origin: `${side < 0 ? r(10, 30) : r(70, 90)}% 5.5rem`,
    to: {
      rotationX: r(20, 34),
      rotationY: side * r(6, 16),
      rotation: side * r(2, 8),
      xPercent: side * r(3, 9),
      scale: r(0.74, 0.84),
    },
  };
}
/** Ink veil at the end of the fall, so the card reads as sinking into shadow. */
const VEIL = 0.5;
/**
 * How long a landed card holds flat and still, in screens of scroll, before
 * the next one starts to rise. Each card after the first takes one screen to
 * rise, so card i lands (i * STEP) screens into the stack.
 */
const HOLD = 0.25;
const STEP = 1 + HOLD;

/**
 * Evidence. GSAP scene, light tone. The title sits left and static in the
 * Container, like What I do and Experience. The cards below it leave the
 * Container and run edge to edge. The section clips on the x axis only:
 * overflow hidden would make the section a scroll container and the sticky
 * stage would stop sticking to the viewport.
 */
export function Evidence() {
  return (
    <section id="evidence" data-tone="light" className="overflow-x-clip pt-section">
      <Container>
        <h2 className="font-display text-display uppercase">{evidenceHeading}</h2>
      </Container>
      <EvidenceStack projects={projects} />
    </section>
  );
}

/**
 * The toy: cards that fall behind. At md+ the stack is one sticky stage, one
 * full screen (100vw by 100svh), inside a wrapper tall enough to scroll the
 * whole sequence: the stage plus HOLD screens per card plus one screen per
 * rise. All cards sit absolutely on the stage, later cards above earlier ones
 * by DOM order. The fixed nav overlays the top of every card, so the content's
 * top padding starts below --nav-h.
 *
 * One timeline, scrubbed over the wrapper's scroll, plays the sequence in
 * screens: card 0 holds; card 1 rises (yPercent 100 to 0) while card 0's
 * inner layer falls back to a random side (see rollFall) under a 3600px
 * perspective, with an ink veil to 0.5 inside the layer; the moment card 1
 * covers it, card 0 goes to opacity 0; card 1 holds; and so on. The last
 * card does not tip; it holds, then the wrapper ends and the stage scrolls
 * away into Experience. So at most two cards are ever drawn, the one
 * arriving and the one falling behind it, and scrolling back reverses it all.
 * Hidden cards keep visibility, so Tab still reaches every card (see
 * onCardFocus). The veil is opaque color faded with opacity, never element
 * opacity on a card that is still on screen, so nothing ghosts through. Each
 * card flattens its own 3D. The stage clips (overflow clip, which cannot be
 * scrolled by focus), so cards waiting below it never show or take pointers.
 * Before hydration, cards after the first wait below the stage in CSS, so a
 * reload mid-stack never flashes the last card.
 *
 * The wrapper height is CSS, not a GSAP pin, so the document is its final
 * height from the first paint and the scene below (Experience) never
 * waits on a pin spacer.
 *
 * Below md: no stage, no 3D. Cards stack edge to edge with no gap, image
 * above text. Under reduced motion at md+ there is no stage either: the
 * cards are plain full-screen blocks that scroll by in order, flat, with no
 * hold and no veil, so they can never pile up.
 */
function EvidenceStack({ projects }: { projects: readonly Project[] }) {
  const scope = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const wrap = scope.current;
        if (!wrap) return;
        const cards = gsap.utils.toArray<HTMLElement>(".stack-card", wrap);
        // Positions are in screens: the timeline spans the wrapper's scroll,
        // which is exactly (cards * HOLD + cards - 1) screens long.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        const sides: number[] = [];
        cards.forEach((card, i) => {
          if (i === 0) return;
          const landed = i * STEP;
          const rise = landed - 1;
          // y: 0 drops the CSS pre-hydration offset GSAP parses on first touch.
          tl.fromTo(card, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 1 }, rise);

          const prev = cards[i - 1];
          const layer = prev.querySelector<HTMLElement>("[data-fall]");
          const veil = prev.querySelector<HTMLElement>("[data-veil]");
          if (layer) {
            const fall = rollFall(sides);
            gsap.set(layer, { transformOrigin: fall.origin });
            tl.to(layer, { ...fall.to, duration: 1 }, rise);
          }
          if (veil) tl.to(veil, { opacity: VEIL, duration: 1 }, rise);
          // Fully covered: gone, so tipped cards never pile up behind.
          tl.set(prev, { opacity: 0 }, landed);
        });
        // The last card's hold.
        tl.set({}, {}, (cards.length - 1) * STEP + HOLD);

        // Full screen and flat: the card's title wears the lime highlighter.
        // A card is flat from its landing through its hold; the last one
        // stays flat until the stage scrolls away. Plain triggers on the
        // wrapper's own scroll (not the scrubbed timeline), so the mark
        // sweeps on its own CSS clock instead of creeping with the scroll.
        const screen = () => stage.current?.offsetHeight ?? window.innerHeight;
        const last = cards.length - 1;
        cards.forEach((card, i) => {
          ScrollTrigger.create({
            trigger: wrap,
            start: () => `top+=${i * STEP * screen()} top`,
            end: () => (i === last ? "bottom top" : `top+=${(i * STEP + HOLD) * screen()} top`),
            invalidateOnRefresh: true,
            onToggle: (self) => {
              card.dataset.active = String(self.isActive);
            },
          });
        });
        return () => cards.forEach((card) => (card.dataset.active = "false"));
      });

      // No stage (below md, or reduced motion): cards are plain blocks, and
      // the one crossing the middle of the screen wears the highlighter.
      mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".stack-card", scope.current ?? undefined);
        cards.forEach((card) => {
          ScrollTrigger.create({
            trigger: card,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              card.dataset.active = String(self.isActive);
            },
          });
        });
        return () => cards.forEach((card) => (card.dataset.active = "false"));
      });

      // Trigger positions depend on the stack's offset, which depends on
      // Clash Display being in. ScrollTrigger already refreshes itself on
      // window load; the font swap is the case it cannot see.
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

  /*
    Shift+Tab can focus a card that is hidden on the stage (covered, or
    waiting below it), where the browser cannot bring it into view. At md+,
    scroll to the focused card's own place in the sequence instead: a
    quarter screen into its hold, so the card and its focus ring are on
    screen and flat. Under reduced motion the place is simply its block.
  */
  const onCardFocus = (i: number) => (event: FocusEvent<HTMLElement>) => {
    const wrap = scope.current;
    if (!wrap || !window.matchMedia("(min-width: 768px)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    const screen = stage.current?.offsetHeight ?? window.innerHeight;
    const y = reduced
      ? top + i * event.currentTarget.offsetHeight
      : top + (i * STEP + HOLD / 2) * screen;
    if (Math.abs(window.scrollY - y) < 2) return;
    if (lenis) lenis.scrollTo(y, reduced ? { immediate: true } : { duration: 0.6 });
    else window.scrollTo({ top: y });
  };


  return (
    <div
      ref={scope}
      className="relative mt-16 md:mt-24 md:motion-safe:h-[var(--stack-h)]"
      // The stage (one screen) plus a hold per card plus a rise per card after the first.
      style={{ "--stack-h": `calc(${projects.length * STEP} * 100svh)` } as CSSProperties}
    >
      {projects.map((project, i) => (
        <NavProbe
          key={project.index}
          slot={i}
          nav={SCHEME[project.scheme].nav}
          last={i === projects.length - 1}
        />
      ))}
      <div
        ref={stage}
        className="flex flex-col md:motion-safe:sticky md:motion-safe:top-0 md:motion-safe:block md:motion-safe:h-svh md:motion-safe:overflow-clip"
      >
        {projects.map((project, i) => {
          const Card = project.href ? "a" : "article";
          const linkProps = project.href
            ? {
                href: project.href,
                target: "_blank",
                rel: "noreferrer",
                "aria-label": `${project.title}, opens in a new tab`,
              }
            : {};
          const scheme = SCHEME[project.scheme];
          return (
            <Card
              key={project.index}
              {...linkProps}
              onFocus={project.href ? onCardFocus(i) : undefined}
              data-active="false"
              className={`stack-card group relative block focus-visible:outline-current focus-visible:-outline-offset-8 md:h-svh md:motion-safe:absolute md:motion-safe:inset-0 md:motion-safe:[perspective:3600px] ${i > 0 ? "md:motion-safe:[transform:translateY(100%)]" : ""} ${scheme.fg}`}
            >
              {/* Nav probe where the card is a plain block: below md, and under reduced motion. See NavProbe. */}
              <span
                aria-hidden
                data-nav={scheme.nav}
                className="pointer-events-none invisible absolute inset-0 md:motion-safe:hidden"
              />

              {/* The layer that falls back. It carries the card color, so the section canvas shows around it once it tips. */}
              <div data-fall className={`relative h-full md:origin-[50%_5.5rem] ${scheme.bg}`}>
                {scheme.edge && (
                  <span aria-hidden className="pointer-events-none absolute inset-0 border border-[var(--line-on-light)]" />
                )}
                <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-6 px-gutter py-12 md:gap-8 md:pt-[calc(var(--nav-h)+1.5rem)] md:pb-10">
                  {/*
                    Title row. Title top-left, index top-right. Below md the
                    index moves above the title and the title drops to
                    text-h2, because the 3rem floor of text-display is wider
                    than a phone card.
                  */}
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
                    <div className="min-w-0">
                      <h3 className="font-display text-h2 uppercase text-balance md:text-display">
                        {/*
                          Highlighter, the same mark as the hero selection and
                          What I do: a solid lime fill (the one-color
                          linear-gradient only exists so background-size can
                          animate) that sweeps in from the left while the card
                          is full screen (data-active, set by the triggers
                          above) and out to the right as it falls. Ink on lime
                          on both card colors. clone repaints it per line.
                        */}
                        <span
                          className={`-mx-[0.08em] px-[0.08em] [-webkit-box-decoration-break:clone] [background-image:linear-gradient(var(--accent),var(--accent))] [background-repeat:no-repeat] [box-decoration-break:clone] [background-position:right_center] [background-size:0%_1em] group-data-[active=true]:text-ink group-data-[active=true]:[background-position:left_center] group-data-[active=true]:[background-size:100%_1em] motion-safe:transition-[background-size,color] motion-safe:duration-[420ms] motion-safe:ease-out-expo`}
                        >
                          {project.title}
                        </span>
                      </h3>
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
                    <p className="order-first shrink-0 font-display text-h3 tabular-nums md:order-none">
                      ({project.index})
                    </p>
                  </div>

                  {/*
                    Row two fills the rest of the screen at md+: summary
                    bottom-left in cols 1 to 6, image bottom-right in cols 7
                    to 12. It is a size container, so the image can be capped
                    by the height that is left (100cqh) as well as by its
                    columns, and the whole card fits one screen down to
                    1280x720. Below md the row dissolves (display contents)
                    and the image moves first in the card's column.
                  */}
                  <div className="contents md:grid md:min-h-0 md:flex-1 md:grid-cols-12 md:items-end md:gap-x-6 md:[container-type:size]">
                    <div className="flex max-w-[44ch] flex-col gap-4 md:col-span-6 md:col-start-1 md:row-start-1">
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

                    {/*
                      Image. Square, like the source mockups, so nothing is
                      cropped. At md+ the cap leaves room for the 2deg tilt
                      and the marks outside it; below md a small side inset
                      keeps the tilted marks off the screen edge.
                    */}
                    <div className="relative order-first aspect-square rotate-[2deg] max-md:mx-3 md:order-none md:col-span-6 md:col-start-7 md:row-start-1 md:w-[min(100%,100cqh_-_2.5rem)] md:justify-self-end md:mb-3 md:mr-3">
                      <div className="absolute inset-0 overflow-hidden">
                        <Image
                          src={project.image}
                          alt={`${project.title} preview`}
                          fill
                          sizes="(min-width: 768px) 45vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out-expo motion-safe:group-hover:scale-[1.03]"
                        />
                      </div>
                      {/* Marks sit outside the photo, on the card color, so they show on every card. */}
                      <Corners size={14} offset={8} />
                    </div>
                  </div>
                </div>

                {/* Shadow veil, scrubbed by GSAP at md+. Inside the falling layer so it tips with it; inert. */}
                <span aria-hidden data-veil className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Nav probe for one card on the md+ stage. The nav drops its difference blend
 * and takes a plain color over any [data-nav] box under its strip, judged by
 * geometry alone (difference over these card colors would turn red teal and
 * brown blue). The stage stays stuck under the nav through the whole
 * sequence, so a card's own box would claim the nav for every card. This
 * invisible box sits in the scrolling wrapper instead, over the stretch of
 * scroll where the card is flat and alone under the bar: from its landing
 * (slot * STEP screens in) through its hold. While the next card rises the
 * covered one tips back and the section canvas shows around its corners, so
 * a plain color would vanish there (canvas on canvas); the bar blends again
 * for the rise. The last card keeps its probe until the stage has scrolled
 * away, since it leaves flat.
 */
function NavProbe({ slot, nav, last }: { slot: number; nav: "ink" | "canvas"; last: boolean }) {
  return (
    <span
      aria-hidden
      data-nav={nav}
      className="pointer-events-none invisible absolute inset-x-0 hidden md:motion-safe:block"
      style={{ top: `calc(${slot * STEP} * 100svh)`, height: `calc(${last ? HOLD + 1 : HOLD} * 100svh)` }}
    />
  );
}
