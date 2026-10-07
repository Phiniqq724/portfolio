"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, motionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { Container } from "@/components/ui/Container";
import { hero, site } from "@/content/site";

const EASE = [0.16, 1, 0.3, 1] as const;
const MIN_W = 300;
const MAX_W = 700;
const REST_W = 600;
const RADIUS = 320;

/*
  Typing timing. The headline only ever shows or hides one letter per step
  on a timer, so the browser does a small layout of one line and nothing
  else. (A blur-and-threshold SVG morph was tried first and nearly froze
  Safari; do not bring per-frame filters back to this type.)
  Typing libraries default to roughly 50 to 100ms per character and human
  typing sits near 100ms, so letters appear at 85ms. A word is never erased
  letter by letter: it is selected, like a quick mouse drag (a lime bar
  sweeps across it in 420ms and rests 160ms so it registers), and the new
  word types over the selection. Each word holds for 2.6s.
*/
const TYPE_MS = 85;
const SELECT_MS = 420;
const SELECTED_MS = 160;
const GAP_MS = 150;
const HOLD_MS = 2600;
const FIRST_HOLD_MS = 3200;

/*
  Every letter the headline can ever show is rendered once, with a fixed
  index into the weight array. Line one holds WEBSITE and MOBILE, line two
  holds ENTHUSIAST.
*/
type Slot = { ch: string; index: number };
let slotCount = 0;
const toSlots = (word: string): Slot[] =>
  [...word].map((ch) => ({ ch: ch === " " ? " " : ch, index: slotCount++ }));

const LINE1 = [toSlots(hero.words[0]), toSlots(hero.words[1])];
const LINE2 = toSlots(hero.line2);
const LETTER_COUNT = slotCount;

function useWeights(count: number) {
  // One motion value per letter, created once. Springs are attached per letter.
  const [weights] = useState(() => Array.from({ length: count }, () => motionValue(200)));
  return weights;
}

function Letter({
  slot,
  mv,
  register,
  hidden = false,
}: {
  slot: Slot;
  mv: MotionValue<number>;
  register: (i: number, el: HTMLSpanElement | null) => void;
  hidden?: boolean;
}) {
  const spring = useSpring(mv, { stiffness: 220, damping: 26, mass: 0.6 });
  const fvs = useTransform(spring, (w) => `"wght" ${Math.round(w)}`);
  return (
    <motion.span
      ref={(el) => register(slot.index, el)}
      className="inline-block"
      style={{ fontVariationSettings: fvs, display: hidden ? "none" : undefined }}
      initial={{ y: "110%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 1, ease: EASE, delay: 0.1 + slot.index * 0.012 }}
    >
      {slot.ch}
    </motion.span>
  );
}

/**
 * Zero-width caret. It takes no space in the line, so showing or hiding it
 * never shifts a letter; the visible bar hangs just after its position.
 */
function Caret({ setRef }: { setRef: (el: HTMLSpanElement | null) => void }) {
  return (
    <span
      ref={setRef}
      hidden
      aria-hidden
      data-blink="false"
      className="hero-caret relative inline-block h-[0.7em] w-0 align-baseline"
    >
      <span className="absolute left-[0.04em] top-0 h-full w-[0.07em] bg-current" />
    </span>
  );
}

/**
 * The hero. Four corners hold small facts; the headline holds the toys:
 * letter weights that follow the cursor, and a first word that is selected
 * and typed over, WEBSITE to MOBILE and back. Pressing the headline skips
 * to the other word. The one photo of the owner lives in About.
 */
export function Hero() {
  const weights = useWeights(LETTER_COUNT);
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement | null>(null);
  const hovering = useRef(false);
  const settled = useRef(false);
  // Set by the controller effect; the headline button calls it.
  const swapRef = useRef<() => void>(() => {});

  const [revealed, setRevealed] = useState(false);

  const register = (i: number, el: HTMLSpanElement | null) => {
    els.current[i] = el;
  };

  // Entry: weights rise from 200 to the resting weight, then the pointer owns them.
  useEffect(() => {
    const controls = weights.map((mv, i) =>
      animate(mv, REST_W, { duration: 1.2, ease: EASE, delay: 0.2 + i * 0.01 }),
    );
    const t = window.setTimeout(() => {
      settled.current = true;
      setRevealed(true);
    }, 1400);
    return () => {
      controls.forEach((c) => c.stop());
      window.clearTimeout(t);
    };
  }, [weights]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    const onMove = (e: PointerEvent) => {
      hovering.current = true;
      if (!settled.current) return;
      els.current.forEach((el, i) => {
        if (!el || el.style.display === "none") return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
        const t = Math.min(d / RADIUS, 1);
        weights[i].set(MAX_W - t * (MAX_W - MIN_W));
      });
    };
    const onLeave = () => {
      hovering.current = false;
      weights.forEach((mv) => mv.set(REST_W));
    };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [weights]);

  /*
    The typing loop. Everything here writes straight to the DOM on timers:
    letters toggle `display`, the caret toggles `hidden`, and the selection
    is one element scaled with the Web Animations API. Line one is selected
    and retyped between WEBSITE and MOBILE. It advances only while the hero
    is on screen, the tab is visible, and the pointer is not over the hero.
    Pressing the headline skips the rest of a hold; presses mid-typing are
    ignored. Reduced motion: no loop and no caret, and a press swaps the word
    instantly.
  */
  useEffect(() => {
    const section = sectionRef.current;
    const h1 = h1Ref.current;
    const highlight = highlightRef.current;
    const caret = caretRef.current;
    if (!section || !h1 || !highlight || !caret) return;

    // Hold on to the elements now; callback refs are nulled before cleanup.
    const words = LINE1.map((slots) => slots.map((s) => els.current[s.index]));
    if (words.flat().some((el) => !el)) return;
    const g1 = words as HTMLElement[][];

    const show = (el: HTMLElement, on: boolean) => {
      el.style.display = on ? "" : "none";
    };
    const showGroup = (group: HTMLElement[], on: boolean) => group.forEach((el) => show(el, on));
    const resetDom = () => {
      g1.forEach((g, i) => showGroup(g, i === 0));
      caret.hidden = true;
      highlight.hidden = true;
    };

    let word = 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      swapRef.current = () => {
        showGroup(g1[word], false);
        word = 1 - word;
        showGroup(g1[word], true);
      };
      return () => {
        swapRef.current = () => {};
        resetDom();
      };
    }

    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    }, { threshold: 0.15 });
    io.observe(section);

    let timer = 0;
    let holding = false;
    let selection: Animation | null = null;
    const wait = (ms: number, fn: () => void) => {
      timer = window.setTimeout(fn, ms);
    };
    const setCaret = (on: boolean, blink: boolean) => {
      caret.hidden = !on;
      caret.dataset.blink = on && blink ? "true" : "false";
    };
    const free = () =>
      settled.current && onScreen && document.visibilityState === "visible" && !hovering.current;

    const typeInto = (group: HTMLElement[], done: () => void, i = 0) => {
      if (i >= group.length) {
        done();
        return;
      }
      show(group[i], true);
      setCaret(true, false);
      wait(TYPE_MS, () => typeInto(group, done, i + 1));
    };

    const holdThen = (ms: number) => {
      holding = true;
      setCaret(true, true);
      let left = ms;
      const tick = () => {
        if (free()) left -= 200;
        if (left <= 0) replace();
        else wait(200, tick);
      };
      wait(200, tick);
    };

    // Select the current word: the lime bar sweeps across its letters from
    // the left and rests. Then the word goes, as if typed over, and the
    // other word types in from the caret.
    const replace = () => {
      holding = false;
      setCaret(false, false);
      const group = g1[word];
      const box = h1.getBoundingClientRect();
      const first = group[0].getBoundingClientRect();
      const last = group[group.length - 1].getBoundingClientRect();
      highlight.style.left = `${first.left - box.left}px`;
      highlight.style.top = `${first.top - box.top}px`;
      highlight.style.width = `${last.right - first.left}px`;
      highlight.style.height = `${first.height}px`;
      highlight.hidden = false;
      selection = highlight.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration: SELECT_MS,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      });
      selection.onfinish = () => {
        wait(SELECTED_MS, () => {
          showGroup(group, false);
          highlight.hidden = true;
          word = 1 - word;
          setCaret(true, false);
          wait(GAP_MS, () => typeInto(g1[word], () => holdThen(HOLD_MS)));
        });
      };
    };

    swapRef.current = () => {
      if (!holding) return;
      window.clearTimeout(timer);
      replace();
    };

    holdThen(FIRST_HOLD_MS);

    return () => {
      swapRef.current = () => {};
      window.clearTimeout(timer);
      selection?.cancel();
      io.disconnect();
      resetDom();
    };
  }, []);

  const lineClass = `pointer-events-none relative block whitespace-nowrap pb-[0.05em] ${revealed ? "overflow-visible" : "overflow-hidden"}`;

  return (
    <section
      ref={sectionRef}
      id="top"
      data-tone="light"
      className="relative flex min-h-[100dvh] flex-col overflow-x-clip pt-nav"
    >
      <Container className="flex flex-1 flex-col justify-between pb-8 pt-6 md:pb-10">
        <motion.p
          className="meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          {hero.meta}
        </motion.p>

        <h1 ref={h1Ref} className="relative font-display text-giant uppercase" aria-label={hero.label}>
          {/* Selection bar. Behind the letters, positioned by the controller. */}
          <span
            ref={highlightRef}
            hidden
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 origin-left bg-accent"
          />

          {/*
            The headline's press area. It sits under the letters, which let
            clicks through. Pressing swaps WEBSITE and MOBILE.
          */}
          <button
            type="button"
            onClick={() => swapRef.current()}
            aria-label={`Swap ${hero.words[0].toLowerCase()} and ${hero.words[1].toLowerCase()}`}
            className="absolute inset-0 cursor-pointer [-webkit-tap-highlight-color:transparent]"
          />

          <span aria-hidden className={`${lineClass} text-left`}>
            {LINE1.map((word, w) =>
              word.map((slot) => (
                <Letter key={slot.index} slot={slot} mv={weights[slot.index]} register={register} hidden={w !== 0} />
              )),
            )}
            <Caret
              setRef={(el) => {
                caretRef.current = el;
              }}
            />
          </span>

          <span aria-hidden className={`${lineClass} text-right`}>
            {LINE2.map((slot) => (
              <Letter key={slot.index} slot={slot} mv={weights[slot.index]} register={register} />
            ))}
          </span>
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
          {/*
            The intro is the page's largest text block, so it is the element
            search engines time as "largest contentful paint". It must be
            visible in the very first paint: it slides up a little after
            hydration but is never hidden with opacity.
          */}
          <motion.p
            className="max-w-[28ch] text-lead md:col-span-6"
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
          >
            {hero.intro}
          </motion.p>
          <motion.p
            className="text-body text-fg-2 md:col-span-6 md:text-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            {site.availability}
          </motion.p>
        </div>
      </Container>
    </section>
  );
}
