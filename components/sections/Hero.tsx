"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, motionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Corners } from "@/components/ui/Corners";
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
  typing sits near 100ms, so letters appear at 85ms and disappear faster at
  45ms, since erasing reads as one gesture. Each word holds for 2.6s.
  Selecting a line takes 420ms, close to a quick mouse drag, and the
  selection rests for 160ms so it registers before the text is replaced.
*/
const TYPE_MS = 85;
const ERASE_MS = 45;
const GAP_MS = 300;
const HOLD_MS = 2600;
const FIRST_HOLD_MS = 3200;
const SELECT_MS = 420;
const SELECTED_MS = 160;

/*
  Every letter the headline can ever show is rendered once, with a fixed
  index into the weight array. Line one holds WEBSITE, MOBILE and SKETCH &.
  Line two holds ENTHUSIAST and ILLUSTRATE, and the tile sits before them.
*/
type Slot = { ch: string; index: number };
let slotCount = 0;
const toSlots = (word: string): Slot[] =>
  [...word].map((ch) => ({ ch: ch === " " ? "\u00A0" : ch, index: slotCount++ }));

const LINE1 = [toSlots(hero.words[0]), toSlots(hero.words[1]), toSlots(hero.sketch.line1)];
const LINE2 = [toSlots(hero.line2), toSlots(hero.sketch.line2)];
const LETTER_COUNT = slotCount;

const DESKTOP = "(min-width: 768px)";
const subscribeDesktop = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
/** True at tablet width and up. The server and hydration assume desktop. */
function useDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  );
}

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

type Mode = "web" | "sketch";

/** Page-wide accent switch. CSS in globals.css maps data-mode to the accent. */
const setAccentMode = (mode: Mode) => {
  if (mode === "sketch") document.documentElement.dataset.mode = "sketch";
  else delete document.documentElement.dataset.mode;
};

/**
 * The hero. Four corners hold small facts; the headline holds the toys:
 * letter weights that follow the cursor, a first word that types itself
 * between WEBSITE and MOBILE, and a second mode, SKETCH & ILLUSTRATE, that
 * the tile (desktop) or the headline (phone) switches to and back.
 */
export function Hero() {
  const weights = useWeights(LETTER_COUNT);
  const isDesktop = useDesktop();
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  // Carets: end of line one, end of line two.
  const caretRefs = useRef<(HTMLSpanElement | null)[]>([null, null]);
  const hovering = useRef(false);
  const settled = useRef(false);
  // Mode switch in progress. The tile slides a little while line two retypes,
  // which can move it out from under a resting cursor and back (WebKit even
  // reports that as the pointer leaving); the preview must not re-arm from it.
  const switching = useRef(false);
  const tileRef = useRef<HTMLButtonElement>(null);
  // Last cursor position seen on the tile, used to decide when to re-arm.
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  // Set by the controller effect; the buttons call them.
  const swapRef = useRef<() => void>(() => {});
  const toggleRef = useRef<() => void>(() => {});

  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState<Mode>("web");
  // The tile image commits the moment the tile is pressed, so the image the
  // hover just previewed stays; the text catches up with the typing.
  const [tileMode, setTileMode] = useState<Mode>("web");
  // The tile's hover preview is disarmed from a press until the switch has
  // finished and the pointer is off the tile, so the image never flips back
  // under a resting cursor.
  const [previewArmed, setPreviewArmed] = useState(true);

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
    The headline controller. Everything here writes straight to the DOM on
    timers: letters toggle `display`, carets toggle `hidden`, the selection
    is one element scaled with the Web Animations API. React state changes
    only when a mode switch starts and ends (labels and the tile image).

    Web mode loop: line one erases and retypes between WEBSITE and MOBILE.
    It advances only while the hero is on screen, the tab is visible, and the
    pointer is not over the hero. Pressing the headline (desktop) skips the
    rest of a hold. Presses mid-typing are ignored.

    Mode switch: the tile image changes on the press, then line one is
    selected and replaced by typing, then line two. Any press during a switch is
    ignored. In sketch mode the loop stops; switching back types WEBSITE
    ENTHUSIAST and the loop resumes.

    Reduced motion: no loop, no caret, no selection. Presses still work and
    change the text and image instantly.
  */
  useEffect(() => {
    const section = sectionRef.current;
    const h1 = h1Ref.current;
    const highlight = highlightRef.current;
    const [c1, c2] = caretRefs.current;
    if (!section || !h1 || !highlight || !c1 || !c2) return;

    // Hold on to the elements now; callback refs are nulled before cleanup.
    const pick = (slots: Slot[]) => slots.map((s) => els.current[s.index]);
    const line1 = LINE1.map(pick);
    const line2 = LINE2.map(pick);
    if ([...line1, ...line2].flat().some((el) => !el)) return;
    const g1 = line1 as HTMLElement[][];
    const g2 = line2 as HTMLElement[][];
    const carets = [c1, c2];

    const show = (el: HTMLElement, on: boolean) => {
      el.style.display = on ? "" : "none";
    };
    const showGroup = (group: HTMLElement[], on: boolean) => group.forEach((el) => show(el, on));
    const resetDom = () => {
      g1.forEach((g, i) => showGroup(g, i === 0));
      g2.forEach((g, i) => showGroup(g, i === 0));
      carets.forEach((c) => (c.hidden = true));
      highlight.hidden = true;
    };

    let current: Mode = "web";
    let webWord = 0;
    let busy = false;

    // Re-arm the tile preview only once the cursor is really off the tile.
    // Neither enter/leave events nor :hover can be trusted here: the tile
    // slides while line two retypes, and WebKit keeps a stale hover state for
    // a cursor that has not moved. So compare the cursor's last position with
    // the tile's box, and if it is still inside, wait for a move that leaves.
    let offTileWatch: (() => void) | null = null;
    const inside = (x: number, y: number) => {
      const tile = tileRef.current;
      if (!tile) return false;
      const r = tile.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const armPreviewWhenOff = () => {
      offTileWatch?.();
      const at = lastPointer.current;
      if (!at || !inside(at.x, at.y)) {
        setPreviewArmed(true);
        return;
      }
      const onMove = (e: PointerEvent) => {
        if (inside(e.clientX, e.clientY)) return;
        setPreviewArmed(true);
        offTileWatch?.();
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      offTileWatch = () => {
        window.removeEventListener("pointermove", onMove);
        offTileWatch = null;
      };
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      swapRef.current = () => {
        if (current !== "web") return;
        showGroup(g1[webWord], false);
        webWord = 1 - webWord;
        showGroup(g1[webWord], true);
      };
      toggleRef.current = () => {
        const toSketch = current === "web";
        showGroup(g1[webWord], !toSketch);
        showGroup(g1[2], toSketch);
        showGroup(g2[0], !toSketch);
        showGroup(g2[1], toSketch);
        current = toSketch ? "sketch" : "web";
        setMode(current);
        setTileMode(current);
        setAccentMode(current);
        setPreviewArmed(false);
        armPreviewWhenOff();
      };
      return () => {
        swapRef.current = () => {};
        toggleRef.current = () => {};
        offTileWatch?.();
        setAccentMode("web");
        resetDom();
      };
    }

    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    }, { threshold: 0.15 });
    io.observe(section);

    let timer = 0;
    let selection: Animation | null = null;
    let holding = false;
    const wait = (ms: number, fn: () => void) => {
      timer = window.setTimeout(fn, ms);
    };
    const caretOnly = (caret: HTMLElement | null, blink: boolean) => {
      carets.forEach((c) => {
        c.hidden = c !== caret;
        c.dataset.blink = c === caret && blink ? "true" : "false";
      });
    };
    const free = () =>
      settled.current && onScreen && document.visibilityState === "visible" && !hovering.current;

    // Shared typing step. `caretFor` receives how many letters are shown.
    const typeInto = (
      group: HTMLElement[],
      caretFor: (typed: number) => HTMLElement,
      done: () => void,
      i = 0,
    ) => {
      if (i >= group.length) {
        done();
        return;
      }
      show(group[i], true);
      // The caret follows the letter just typed, so it jumps past the tile
      // the moment the first letter after the tile appears.
      caretOnly(caretFor(i + 1), false);
      wait(TYPE_MS, () => typeInto(group, caretFor, done, i + 1));
    };

    // Web mode loop on line one.
    const holdThen = (ms: number) => {
      holding = true;
      caretOnly(c1, true);
      let left = ms;
      const tick = () => {
        if (free()) left -= 200;
        if (left <= 0) erase(g1[webWord].length - 1);
        else wait(200, tick);
      };
      wait(200, tick);
    };
    const erase = (i: number) => {
      holding = false;
      caretOnly(c1, false);
      if (i < 0) {
        webWord = 1 - webWord;
        wait(GAP_MS, () => typeInto(g1[webWord], () => c1, () => holdThen(HOLD_MS)));
        return;
      }
      show(g1[webWord][i], false);
      wait(ERASE_MS, () => erase(i - 1));
    };

    // Selection: a lime bar sweeps across the visible letters of a group,
    // rests, and then the group disappears as if typed over.
    const select = (group: HTMLElement[], done: () => void) => {
      const visible = group.filter((el) => el.style.display !== "none");
      if (visible.length === 0) {
        done();
        return;
      }
      caretOnly(null, false);
      const box = h1.getBoundingClientRect();
      const first = visible[0].getBoundingClientRect();
      const last = visible[visible.length - 1].getBoundingClientRect();
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
          done();
        });
      };
    };

    const toggle = () => {
      if (busy) return;
      busy = true;
      switching.current = true;
      holding = false;
      window.clearTimeout(timer);
      setPreviewArmed(false);

      const toSketch = current === "web";
      setTileMode(toSketch ? "sketch" : "web");
      // The selection previews where it is going: rose red on the way to
      // SKETCH & ILLUSTRATE, lime on the way back. The page accent itself
      // only changes once the new text has finished typing.
      highlight.style.backgroundColor = toSketch ? "var(--accent-sketch)" : "var(--accent-web)";
      const from1 = toSketch ? g1[webWord] : g1[2];
      const to1 = toSketch ? g1[2] : g1[0];
      const from2 = toSketch ? g2[0] : g2[1];
      const to2 = toSketch ? g2[1] : g2[0];
      // Line two's caret sits before the tile for the first half of the word.
      const line2Caret = () => c2;

      select(from1, () => {
        caretOnly(c1, false);
        wait(GAP_MS / 2, () =>
          typeInto(to1, () => c1, () =>
            wait(GAP_MS, () =>
              select(from2, () => {
                caretOnly(c2, false);
                wait(GAP_MS / 2, () =>
                  typeInto(to2, line2Caret, () => {
                    current = toSketch ? "sketch" : "web";
                    setMode(current);
                    // The page accent follows the finished text: rose red for
                    // SKETCH & ILLUSTRATE, lime again for WEBSITE ENTHUSIAST.
                    setAccentMode(current);
                    busy = false;
                    switching.current = false;
                    armPreviewWhenOff();
                    if (toSketch) {
                      caretOnly(c2, true);
                    } else {
                      webWord = 0;
                      holdThen(HOLD_MS);
                    }
                  }),
                );
              }),
            ),
          ),
        );
      });
    };

    swapRef.current = () => {
      if (busy || current !== "web" || !holding) return;
      window.clearTimeout(timer);
      erase(g1[webWord].length - 1);
    };
    toggleRef.current = toggle;

    holdThen(FIRST_HOLD_MS);

    return () => {
      swapRef.current = () => {};
      toggleRef.current = () => {};
      window.clearTimeout(timer);
      selection?.cancel();
      io.disconnect();
      switching.current = false;
      offTileWatch?.();
      setAccentMode("web");
      resetDom();
    };
  }, []);

  const sketch = mode === "sketch";
  const tileSketch = tileMode === "sketch";
  const tileRatio = `${hero.tile.src.width} / ${hero.tile.src.height}`;
  // Which image shows in the tile. The other one fades in on hover or focus.
  const imageClass = (isBase: boolean) =>
    [
      "absolute inset-0 transition-opacity duration-500 ease-out-expo",
      isBase ? "opacity-100" : "opacity-0",
      previewArmed &&
        (isBase
          ? "group-hover:opacity-0 group-focus-visible:opacity-0"
          : "group-hover:opacity-100 group-focus-visible:opacity-100"),
    ]
      .filter(Boolean)
      .join(" ");

  const headlineAction = isDesktop
    ? {
        label: `Swap ${hero.words[0].toLowerCase()} and ${hero.words[1].toLowerCase()}`,
        disabled: sketch,
      }
    : {
        label: sketch ? "Switch back to website and mobile" : "Switch to sketch and illustrate",
        disabled: false,
      };

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

        <h1
          ref={h1Ref}
          className="relative font-display text-giant uppercase"
          aria-label={sketch ? hero.sketch.label : hero.label}
        >
          {/* Selection bar. Behind the letters, positioned and colored by the controller. */}
          <span
            ref={highlightRef}
            hidden
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 origin-left bg-accent"
          />

          {/*
            The headline's press area. It sits under the letters, which let
            clicks through, and under the tile, which keeps its own clicks.
            Desktop: swaps WEBSITE and MOBILE (off in sketch mode).
            Phone: switches between the two modes.
          */}
          <button
            type="button"
            onClick={() => (isDesktop ? swapRef.current() : toggleRef.current())}
            disabled={headlineAction.disabled}
            aria-label={headlineAction.label}
            className="absolute inset-0 cursor-pointer disabled:cursor-default [-webkit-tap-highlight-color:transparent]"
          />

          <span aria-hidden className={`${lineClass} text-left`}>
            {LINE1.map((word, w) =>
              word.map((slot) => (
                <Letter key={slot.index} slot={slot} mv={weights[slot.index]} register={register} hidden={w !== 0} />
              )),
            )}
            <Caret
              setRef={(el) => {
                caretRefs.current[0] = el;
              }}
            />
          </span>

          {/* Not aria-hidden as a whole: it contains the tile button. Only the letters are hidden. */}
          <span className={`${lineClass} text-right`}>
            {/*
              Baseline wrapper. Alignment lives on this plain span, not on the
              button: Safari aligns an empty button by its vertical middle
              while Chrome uses its bottom edge, which left the tile half a
              tile too low in Safari. An empty inline-block span aligns by its
              bottom edge in every engine.
            */}
            <span
              className="relative mr-[0.1em] hidden h-[0.74em] translate-y-[0.035em] align-baseline md:inline-block"
              style={{ aspectRatio: tileRatio }}
            >
              <button
                type="button"
                onClick={() => toggleRef.current()}
                ref={tileRef}
                onPointerDown={(e) => {
                  lastPointer.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerMove={(e) => {
                  lastPointer.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerLeave={(e) => {
                  lastPointer.current = { x: e.clientX, y: e.clientY };
                  if (!switching.current) setPreviewArmed(true);
                }}
                onBlur={() => {
                  if (!switching.current && !lastPointer.current) setPreviewArmed(true);
                }}
                aria-label={tileSketch ? "Switch back to website and mobile" : "Switch to sketch and illustrate"}
                className="group pointer-events-auto absolute inset-0 cursor-pointer text-fg"
              >
                <motion.span
                  className="absolute inset-0 block"
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: -5 }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
                >
                  <span className="absolute inset-0 overflow-hidden">
                    <span className={imageClass(!tileSketch)}>
                      <Image
                        src={hero.tile.src}
                        alt={hero.tile.alt}
                        fill
                        sizes="160px"
                        className="object-cover"
                        priority
                        placeholder="blur"
                      />
                    </span>
                    <span className={imageClass(tileSketch)}>
                      <Image
                        src={hero.sketch.tile.src}
                        alt={hero.sketch.tile.alt}
                        fill
                        sizes="160px"
                        className="object-cover"
                        placeholder="blur"
                      />
                    </span>
                  </span>
                  <Corners size={8} />
                </motion.span>
              </button>
            </span>
            {/*
              The word box. An inline grid whose single cell holds invisible
              copies of both words at resting weight, so the cell is as wide
              as the wider word. The visible letters type into that same
              cell from the left. The box never changes width, so the tile
              in front of it holds still while line two erases, retypes, and
              switches modes.
            */}
            <span aria-hidden className="inline-grid text-left align-baseline">
              {LINE2.map((word) => (
                <span key={`ghost-${word[0].index}`} aria-hidden className="invisible [grid-area:1/1]">
                  {word.map((slot) => (
                    <span key={slot.index} className="inline-block" style={{ fontVariationSettings: `"wght" ${REST_W}` }}>
                      {slot.ch}
                    </span>
                  ))}
                </span>
              ))}
              <span className="whitespace-nowrap [grid-area:1/1]">
                {LINE2.map((word, w) =>
                  word.map((slot) => (
                    <Letter key={slot.index} slot={slot} mv={weights[slot.index]} register={register} hidden={w !== 0} />
                  )),
                )}
                <Caret
                  setRef={(el) => {
                    caretRefs.current[1] = el;
                  }}
                />
              </span>
            </span>
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
