"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import {
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
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
const SPRING = { stiffness: 300, damping: 30 };
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
 * during hydration, and on touch, so the hover preview never mounts there.
 */
function useFinePointer() {
  return useSyncExternalStore(subscribeFinePointer, readFinePointer, readFinePointerOnServer);
}

/**
 * Motion tree for the What I do section. Two toys:
 * 1. Accordion. One row open at a time, the first open on load. Header is a
 *    native button (Enter and Space work), arrows and Home/End move between
 *    headers. Body height animates from 0 to auto through AnimatePresence.
 * 2. Hover preview. On pointer devices, hovering a closed row shows its
 *    preview image in a 240x180 tile that follows the cursor on a spring.
 *    Position lives in motion values, never in React state. Only which row
 *    is hovered is state, and it bails out when unchanged.
 * Mobile: same rows stacked in one column, no preview.
 */
export function ServiceAccordion({ services }: { services: readonly Service[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const finePointer = useFinePointer();
  const reduce = useReducedMotion();
  const previewEnabled = finePointer && !reduce;
  const previewVisible = previewEnabled && hovering && hoverIndex !== open;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const previewX = useSpring(x, SPRING);
  const previewY = useSpring(y, SPRING);

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    // Land on the cursor at entry so the tile never flies in from where it was last seen.
    x.jump(event.clientX);
    y.jump(event.clientY);
    previewX.jump(event.clientX);
    previewY.jump(event.clientY);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    x.set(event.clientX);
    y.set(event.clientY);
    const row = (event.target as Element).closest<HTMLElement>("[data-row]");
    if (row) {
      setHoverIndex(Number(row.dataset.row));
      setHovering(true);
    } else {
      setHovering(false);
    }
  };

  const onPointerLeave = () => setHovering(false);

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

  const last = services.length - 1;

  return (
    <div
      onKeyDown={onKeyDown}
      onPointerEnter={previewEnabled ? onPointerEnter : undefined}
      onPointerMove={previewEnabled ? onPointerMove : undefined}
      onPointerLeave={previewEnabled ? onPointerLeave : undefined}
    >
      {services.map((service, i) => {
        const isOpen = open === i;
        const buttonId = `what-i-do-button-${service.index}`;
        const panelId = `what-i-do-panel-${service.index}`;

        return (
          <div
            key={service.index}
            data-row={i}
            className={`border-t border-line ${i === last ? "border-b" : ""}`}
          >
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group grid w-full grid-cols-[3rem_1fr_2rem] items-center gap-x-6 py-6 text-left md:grid-cols-[6rem_1fr_3rem] md:py-8"
              >
                <span className="index">[{service.index}]</span>
                <span className="font-display text-h2 transition-transform duration-500 ease-out-expo group-hover:translate-x-2">
                  {service.title}
                </span>
                <span className="justify-self-end transition-transform duration-200 ease-out-expo group-active:scale-90">
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
                        : { height: { duration: 0.5, ease: EASE }, opacity: { duration: 0.3 } }
                    }
                    className="overflow-hidden"
                  >
                    {/* < md: copy then tags stacked. md+: 12-col, copy in 3-8, tags in 9-12. */}
                    <div className="grid grid-cols-1 gap-y-6 pb-8 md:grid-cols-12 md:gap-x-6 md:gap-y-0">
                      <p className="max-w-[48ch] text-fg md:col-span-6 md:col-start-3">{service.body}</p>
                      <ul className="md:col-span-4">
                        {service.tags.map((tag) => (
                          <li key={tag} className="border-t border-line py-2 text-fg-2">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {previewEnabled && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 aspect-[4/3] w-[240px] overflow-hidden"
          style={{ x: previewX, y: previewY, translate: "-50% -50%" }}
          initial={false}
          animate={{
            opacity: previewVisible ? 1 : 0,
            scale: previewVisible ? 1 : 0.92,
            // Motion flips visibility after the fade out and before the fade in,
            // so the hidden tile is never painted and never counts as LCP.
            visibility: previewVisible ? "visible" : "hidden",
          }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          {/* All four tiles stay mounted so a first hover never shows an empty box. */}
          {services.map((service, i) => (
            <Image
              key={service.index}
              src={service.preview}
              alt=""
              fill
              sizes="240px"
              className={`object-cover transition-opacity duration-300 ${
                i === hoverIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <Corners size={12} />
        </motion.div>
      )}
    </div>
  );
}
