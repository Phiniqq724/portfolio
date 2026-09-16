"use client";

import Image from "next/image";
import { larpStore, useLarp } from "@/lib/larp";
import { Corners } from "@/components/ui/Corners";
import { footer } from "@/content/site";

const STAGGER_MS = 45;

/*
  The footer headline, LET'S TALK. Pressing it rolls TALK. into LARP. one
  letter at a time and back again on the next press. Each letter slot is a
  one-cell inline grid holding both letters, clipped vertically; the letters
  only move with transform, so it costs nothing to repaint. The slot is as
  wide as the wider of its two letters, so nothing reflows mid-roll.
  Screen readers get the current phrase as plain text; the rolling letters
  are hidden from them. Under reduced motion the global rule makes it instant.
*/
export function FooterHeadline() {
  // Shared with the nav, whose "Let's Talk" button becomes "Let's Larp" too.
  const alt = useLarp();
  const from = [...footer.line2];
  const to = [...footer.line2Alt];
  const count = Math.max(from.length, to.length);
  const phrase = `${footer.line1} ${alt ? footer.line2Alt : footer.line2}`;

  return (
    <h2 className="font-display text-giant uppercase">
      <button
        type="button"
        onClick={() => larpStore.set(!alt)}
        aria-pressed={alt}
        className="block cursor-pointer select-none text-left uppercase [-webkit-tap-highlight-color:transparent]"
      >
        <span className="sr-only">{phrase}</span>
        <span aria-hidden className="block">
          {footer.line1}
        </span>
        <span aria-hidden className="block">
          <span
            className="relative mx-[0.08em] inline-block h-[0.72em] rotate-[3deg] overflow-hidden align-[-0.04em]"
            style={{ aspectRatio: `${footer.tile.src.width} / ${footer.tile.src.height}` }}
          >
            <Image
              src={footer.tile.src}
              alt=""
              fill
              sizes="(min-width: 768px) 13vw, 16vw"
              placeholder="blur"
              className="object-cover"
            />
            <Corners size={10} />
          </span>
          {Array.from({ length: count }, (_, i) => {
            const delay = { transitionDelay: `${i * STAGGER_MS}ms` };
            return (
              <span key={i} className="-my-[0.08em] inline-grid overflow-hidden py-[0.08em] align-baseline">
                <span
                  className={`[grid-area:1/1] transition-transform duration-500 ease-out-expo ${alt ? "-translate-y-[120%]" : "translate-y-0"}`}
                  style={delay}
                >
                  {from[i] ?? ""}
                </span>
                <span
                  className={`[grid-area:1/1] transition-transform duration-500 ease-out-expo ${alt ? "translate-y-0" : "translate-y-[120%]"}`}
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
