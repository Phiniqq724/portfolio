"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Corners } from "@/components/ui/Corners";

type Service = {
  index: string;
  title: string;
  body: string;
  tags: readonly string[];
  preview: string;
};

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.45;
// How long the pointer has to rest on a row before it opens, so a quick
// sweep across the list opens only the row it stops on.
const INTENT_MS = 100;
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);

function subscribeFinePointer(onChange: () => void) {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const readFinePointer = () => window.matchMedia(FINE_POINTER).matches;
const readFinePointerOnServer = () => false;

/**
 * True only on devices with a hovering, precise pointer. False on the server,
 * during hydration, and on touch, so hover never opens rows there.
 */
function useFinePointer() {
  return useSyncExternalStore(subscribeFinePointer, readFinePointer, readFinePointerOnServer);
}

/**
 * Motion tree for the What I do section: a compact list where one row is
 * open at a time, the first on load (nbnzia's services list, made ours by
 * the lime mark and the crop marks).
 * - Pointer devices: resting on a row for 100ms opens it, and leaving the
 *   list keeps the last one open. Only real pointer movement counts, so rows
 *   sliding under a still cursor never open anything. A click opens too.
 * - Touch: a tap opens a row, a tap on the open row closes it.
 * - Keyboard: the header is a native disclosure button (aria-expanded,
 *   aria-controls). Keyboard focus opens its row, so Tab and the arrows
 *   browse like hover; arrows and Home/End move between headers, Enter and
 *   Space still toggle.
 * The body's height animates from 0 to auto. At md+ the row's image unrolls
 * on the right inside the row, a 4:3 crop with outside crop marks, top down
 * on the same 0.45s curve as the height, so it never pokes past the row.
 * The open title wears the section's only lime: a highlighter mark (ink on
 * accent) that sweeps in over 420ms. Reduced motion: all of it is instant.
 * Below md: no image, a plus sign that turns into a cross marks the open row.
 */
export function ServiceAccordion({ services }: { services: readonly Service[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const finePointer = useFinePointer();
  const reduce = useReducedMotion();

  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<number | null>(null);
  const lastPoint = useRef({ x: -1, y: -1 });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const cancelIntent = () => {
    window.clearTimeout(timer.current);
    pending.current = null;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    // Browsers replay hover after layout changes with the same coordinates.
    // Ignoring those keeps an opening row from opening the one it pushed
    // under the cursor.
    const { clientX: x, clientY: y } = event;
    if (x === lastPoint.current.x && y === lastPoint.current.y) return;
    lastPoint.current = { x, y };

    const row = (event.target as Element).closest<HTMLElement>("[data-row]");
    if (!row) return;
    const next = Number(row.dataset.row);
    if (next === pending.current) return;
    cancelIntent();
    pending.current = next;
    timer.current = window.setTimeout(() => {
      pending.current = null;
      setOpen(next);
    }, INTENT_MS);
  };

  const onFocus = (event: FocusEvent<HTMLButtonElement>, i: number) => {
    // Keyboard focus only. A tap focuses the button too, and its click
    // decides on its own.
    if (event.currentTarget.matches(":focus-visible")) setOpen(i);
  };

  const onClick = (event: MouseEvent<HTMLButtonElement>, i: number) => {
    // Hover already opened this row on pointer devices, so a mouse click
    // there never closes it. Taps, and Enter or Space (detail 0), toggle.
    const toggles = !finePointer || event.detail === 0;
    setOpen((current) => (current === i && toggles ? null : i));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!NAV_KEYS.has(event.key)) return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button[aria-controls]"),
    );
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
    event.preventDefault();
    const last = buttons.length - 1;
    let next = current;
    if (event.key === "ArrowDown") next = current === last ? 0 : current + 1;
    if (event.key === "ArrowUp") next = current === 0 ? last : current - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    buttons[next].focus();
  };

  // The image follows the row's height on the same curve. On open it waits
  // two frames, because the body only starts growing once it has mounted.
  const imageTransition = (isOpen: boolean) =>
    reduce ? { duration: 0 } : { duration: DURATION, ease: EASE, delay: isOpen ? 0.035 : 0 };
  const last = services.length - 1;

  return (
    // The list is a size container so the image width (--tile-w) and the
    // room the open row keeps for it come from the same number.
    <div
      onKeyDown={onKeyDown}
      onPointerMove={finePointer ? onPointerMove : undefined}
      onPointerLeave={finePointer ? cancelIntent : undefined}
      className="@container [--tile-w:min(24cqw,22.5rem)]"
    >
      {services.map((service, i) => {
        const isOpen = open === i;
        const buttonId = `what-i-do-button-${service.index}`;
        const panelId = `what-i-do-panel-${service.index}`;

        return (
          <div
            key={service.index}
            data-row={i}
            className={`relative border-t border-line ${i === last ? "border-b" : ""}`}
          >
            <h3>
              {/*
                < md: index, title, plus; 20px rows. Below 400px the index and
                plus columns and the gaps shrink, so the longest word
                ("development") still fits its column on a 320px phone.
                md+: index and title in a 96px row, the plus gives way to the
                image, and the title stops short of the image column.
              */}
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={(event) => onClick(event, i)}
                onFocus={(event) => onFocus(event, i)}
                className="group grid w-full grid-cols-[2.25rem_1fr_1.25rem] items-baseline gap-x-3 py-5 text-left min-[400px]:grid-cols-[3rem_1fr_2rem] min-[400px]:gap-x-6 md:min-h-24 md:grid-cols-[6rem_1fr] md:content-center md:py-0 md:pr-[calc(var(--tile-w)+2rem)]"
              >
                <span className="index">[{service.index}]</span>
                <span className="font-display text-h3 transition-transform duration-500 ease-out-expo group-hover:translate-x-2">
                  {/* Highlighter mark. The single-color linear-gradient is a solid
                      lime fill, not a gradient: it exists so background-size can
                      sweep it in from the left on open and out to the right on
                      close (position flips instantly at full or zero width, so the
                      flip never shows). Clone repaints it per line when the title
                      wraps on phones; 1em tall and centered, it fills exactly one
                      line box, so wrapped lines meet without overlapping. The
                      negative margin keeps the text in place. */}
                  <span
                    className={`-mx-[0.12em] px-[0.12em] text-fg [-webkit-box-decoration-break:clone] [background-image:linear-gradient(var(--accent),var(--accent))] [background-repeat:no-repeat] [box-decoration-break:clone] motion-safe:transition-[background-size] motion-safe:duration-[420ms] motion-safe:ease-out-expo ${
                      isOpen
                        ? "[background-position:left_center] [background-size:100%_1em]"
                        : "[background-position:right_center] [background-size:0%_1em]"
                    }`}
                  >
                    {service.title}
                  </span>
                </span>
                <span className="self-center justify-self-end transition-transform duration-200 ease-out-expo group-active:scale-90 md:hidden">
                  <motion.span
                    aria-hidden
                    className="relative block h-4 w-4"
                    initial={false}
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                    <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
                  </motion.span>
                </span>
              </button>
            </h3>

            <div id={panelId}>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { height: { duration: DURATION, ease: EASE }, opacity: { duration: 0.25 } }
                    }
                    className="overflow-hidden"
                  >
                    {/*
                      Copy sits under the title, past the index column. md+:
                      it stops before the image column, and the open row is
                      held tall enough (min-height) for the image plus 24px
                      above and below it: 6rem header + this = 1.5rem + the
                      image's height + 1.5rem.
                    */}
                    <div className="pb-6 pl-[3rem] min-[400px]:pl-[4.5rem] md:min-h-[calc(var(--tile-w)_*_0.75_-_3rem)] md:pb-8 md:pl-[7.5rem] md:pr-[calc(var(--tile-w)+2rem)]">
                      <p className="max-w-[56ch] text-fg">{service.body}</p>
                      {/* Every tag leads with a hairline spacer. The list is
                          pulled left by one spacer and clipped, so the spacer
                          that starts each line (the first, and any after a wrap
                          on phones) falls outside and never shows. */}
                      <div className="mt-3 overflow-hidden">
                        <ul className="-ml-[calc(0.75rem+1px)] flex flex-wrap text-fg-2">
                          {service.tags.map((tag) => (
                            <li
                              key={tag}
                              className="flex items-center gap-x-3 pr-3 before:h-3 before:w-px before:bg-line"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/*
              md+ only (hidden below md). Decorative, the copy says it all.
              Every row keeps its image mounted, so a first hover never shows
              an empty box. The wrapper does not clip, so the outside crop
              marks sit on the canvas around the photo.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 top-6 hidden aspect-[4/3] w-[var(--tile-w)] md:block"
            >
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ clipPath: isOpen ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }}
                transition={imageTransition(isOpen)}
              >
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{ scale: isOpen ? 1 : 1.12 }}
                  transition={imageTransition(isOpen)}
                >
                  <Image
                    src={service.preview}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 360px, 1px"
                    className="object-cover"
                  />
                </motion.div>
              </motion.div>
              <motion.span
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: isOpen ? 1 : 0 }}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.2, delay: isOpen ? DURATION * 0.6 : 0 }
                }
              >
                <Corners size={10} offset={6} />
              </motion.span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
