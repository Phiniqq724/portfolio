"use client";

import { useEffect, useRef, useState } from "react";
import { larpStore, useLarp } from "@/lib/larp";
import { footer } from "@/content/site";

const STAGGER_MS = 45;

/*
  The footer headline, LET'S TALK. Pressing it rolls TALK. into LARP. one
  letter at a time and back again on the next press. Each letter slot is a
  one-cell inline grid holding both letters, clipped on the y axis only: a
  horizontal clip would cut the parts of Clash Display's letters that
  overhang their boxes at this tight tracking (the A's feet, the K's arms).

  Each slot is exactly as wide as the letter it shows, so TALK. and LARP.
  are both spaced like normal type. The widths are measured once the font is
  in, stored in em (the giant size is fluid, the ratio is not), and the slot
  width rolls along with its letter, same duration, same stagger. Before the
  measurement the slot falls back to the wider letter.

  Only the second word is the toy: LET'S is plain heading text, and TALK. /
  LARP. is the button, so only that word is clickable and only that word
  lights up. Hover or focus turns it lime; in LARP. it is the reverse, lime
  at rest and back to canvas on hover. Lime on ink is AA.
  The heading reads "LET'S TALK." (or LARP.) to screen readers: the button
  holds the current word as plain text with aria-pressed, and the rolling
  letters are hidden. Under reduced motion the global rule makes it instant.
*/
export function FooterHeadline() {
  // Shared with the nav, whose "Let's Talk" button becomes "Let's Larp" too.
  const alt = useLarp();
  const from = [...footer.line2];
  const to = [...footer.line2Alt];
  const count = Math.max(from.length, to.length);

  const slots = useRef<(HTMLSpanElement | null)[]>([]);
  // Per slot: [width of the TALK. letter, width of the LARP. letter], in em.
  const [widths, setWidths] = useState<[number, number][] | null>(null);

  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      setWidths(
        slots.current.map((slot) => {
          if (!slot) return [0, 0];
          const size = parseFloat(getComputedStyle(slot).fontSize) || 1;
          const [a, b] = Array.from(slot.children) as HTMLElement[];
          return [a.getBoundingClientRect().width / size, b.getBoundingClientRect().width / size];
        }),
      );
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <h2 className="font-display text-giant uppercase">
      <span className="block">{footer.line1}</span>
      <button
        type="button"
        onClick={() => larpStore.set(!alt)}
        aria-pressed={alt}
        className={`inline-block cursor-pointer select-none text-left uppercase transition-colors duration-300 ease-out-expo [-webkit-tap-highlight-color:transparent] ${
          alt ? "text-accent hover:text-fg focus-visible:text-fg" : "hover:text-accent focus-visible:text-accent"
        }`}
      >
        <span className="sr-only">{alt ? footer.line2Alt : footer.line2}</span>
        <span aria-hidden className="block">
          {Array.from({ length: count }, (_, i) => {
            const delay = { transitionDelay: `${i * STAGGER_MS}ms` };
            const width = widths?.[i]?.[alt ? 1 : 0];
            return (
              <span
                key={i}
                ref={(el) => {
                  slots.current[i] = el;
                }}
                className="-my-[0.08em] inline-grid overflow-x-visible overflow-y-clip py-[0.08em] align-baseline transition-[width] duration-500 ease-out-expo"
                style={{ ...delay, width: width === undefined ? undefined : `${width}em` }}
              >
                <span
                  className={`justify-self-start [grid-area:1/1] transition-transform duration-500 ease-out-expo ${alt ? "-translate-y-[120%]" : "translate-y-0"}`}
                  style={delay}
                >
                  {from[i] ?? ""}
                </span>
                <span
                  className={`justify-self-start [grid-area:1/1] transition-transform duration-500 ease-out-expo ${alt ? "translate-y-0" : "translate-y-[120%]"}`}
                  style={delay}
                >
                  {to[i] ?? ""}
                </span>
              </span>
            );
          })}
        </span>
      </button>
    </h2>
  );
}
