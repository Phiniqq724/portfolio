"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { Container } from "@/components/ui/Container";
import { Corners } from "@/components/ui/Corners";
import { site } from "@/content/site";
import { useLarp } from "@/lib/larp";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Fixed nav. Text blends with whatever section is under it (difference), so
 * one nav reads on light, dark and lime. Always visible, so the way around
 * the page never disappears. Mobile: full-screen dark overlay with giant links.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [onAccent, setOnAccent] = useState(false);
  const larp = useLarp();
  const lenis = useLenis();

  /*
    Is an accent-toned section under the bar? The nav normally inverts
    whatever is behind it (mix-blend-mode: difference), which reads on light
    and dark but turns teal over the rose red accent. Over accent sections it
    drops the blend and uses plain ink, which passes AA on lime and red.
    An observer whose root is shrunk to the nav strip reports the overlap,
    so there is no scroll listener.
  */
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    const build = () => {
      io?.disconnect();
      const navH = parseFloat(getComputedStyle(document.documentElement).fontSize) * 4.5;
      const under = new Set<Element>();
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => (e.isIntersecting ? under.add(e.target) : under.delete(e.target)));
          setOnAccent(under.size > 0);
        },
        { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - navH)}px 0px` },
      );
      document.querySelectorAll('[data-tone="accent"]').forEach((el) => io!.observe(el));
    };
    build();
    window.addEventListener("resize", build);
    return () => {
      window.removeEventListener("resize", build);
      io?.disconnect();
    };
  }, []);

  // Which section is on screen. Drives the corner marks on the active link.
  useEffect(() => {
    const targets = site.nav
      .map((l) => document.querySelector<HTMLElement>(l.href))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.1, 0.5] },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  // Overlay: lock scroll, close on Escape.
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis]);

  // Wordmark: smooth scroll to the hero and leave the URL clean (no hash).
  const toTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setOpen(false);
    if (lenis) {
      lenis.start();
      lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0 });
    }
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  // Overlay links: Lenis is stopped while the menu is open, so restart it and
  // scroll ourselves. Sections carry scroll-margin-top for the nav height and
  // Lenis honors it. Without Lenis (reduced motion) fall back to a native jump.
  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    if (lenis) {
      lenis.start();
      lenis.scrollTo(href);
      history.replaceState(null, "", href);
    } else {
      document.querySelector(href)?.scrollIntoView();
    }
  };

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[70] -translate-y-24 bg-ink px-4 py-2 text-sm text-canvas transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-[60] ${onAccent ? "text-ink" : "text-canvas mix-blend-difference"}`}
      >
        <Container className="flex h-nav items-center justify-between">
          <a
            href="#top"
            aria-label={`${site.wordmark}, back to top`}
            className="font-display text-xl font-semibold tracking-tight md:text-2xl"
            onClick={toTop}
          >
            {site.wordmark}
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {site.nav.map((link) => {
              const isActive = active === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  className="group relative px-2 py-1 text-sm"
                >
                  <span className="index mr-2 text-current opacity-60">[{link.index}]</span>
                  <span className="link-line group-hover:link-line-hover">{link.label}</span>
                  <span
                    className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
                  >
                    <Corners size={7} />
                  </span>
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={site.contact.href}
              className="group relative hidden h-10 items-center border border-current px-4 text-sm transition-transform active:scale-[0.98] md:inline-flex"
            >
              {/*
                Both labels share one grid cell, so the button keeps the width
                of the longer one and nothing in the bar shifts. The label
                rolls when the footer headline switches to LARP.
              */}
              <span className="relative inline-grid overflow-hidden">
                <span className="sr-only">{larp ? site.contact.altLabel : site.contact.label}</span>
                <span
                  aria-hidden
                  className={`[grid-area:1/1] transition-transform duration-500 ease-out-expo ${larp ? "-translate-y-[140%]" : "translate-y-0"}`}
                >
                  {site.contact.label}
                </span>
                <span
                  aria-hidden
                  className={`[grid-area:1/1] transition-transform duration-500 ease-out-expo ${larp ? "translate-y-0" : "translate-y-[140%]"}`}
                >
                  {site.contact.altLabel}
                </span>
              </span>
              <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Corners size={7} className="-m-[3px]" />
              </span>
            </a>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="overlay-menu"
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-11 min-w-11 items-center justify-center px-3 text-sm md:hidden"
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </Container>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="overlay-menu"
            data-tone="dark"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-50 flex flex-col justify-between pb-8 pt-nav"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Container className="pt-10">
              <nav aria-label="Primary mobile">
                <ul className="flex flex-col gap-1">
                  {site.nav.map((link, i) => (
                    <motion.li
                      key={link.href}
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0, transition: { duration: 0.25, ease: EASE } }}
                      transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.06 }}
                    >
                      <a
                        href={link.href}
                        onClick={(e) => goTo(e, link.href)}
                        className="flex items-baseline gap-4 py-2 font-display text-display uppercase"
                      >
                        <span className="index text-current opacity-60">[{link.index}]</span>
                        {link.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </nav>
            </Container>
            <Container className="grid grid-cols-2 gap-6 text-sm">
              <motion.a
                href={`mailto:${site.email}`}
                className="link-line hover:link-line-hover col-span-2 w-fit text-lead"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                {site.email}
              </motion.a>
              <ul className="flex flex-col gap-2">
                {site.socials.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noreferrer" className="link-line hover:link-line-hover">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-fg-2">{site.location}</p>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
