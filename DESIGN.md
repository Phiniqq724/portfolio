# Design spec, version 2

Read this fully before writing any component. It is the single source of truth.
Version 1 was a clean minimalist page and the owner rejected it as boring. This
version is a playground. The rules below exist so the play stays coherent.

## Design read
Solo developer portfolio for recruiters and clients, in an Awwwards-playful
language. antislop dials: ENERGY 3 / RHYTHM 3 / MOTION 3. taste-skill dials:
DESIGN_VARIANCE 9, MOTION_INTENSITY 8, VISUAL_DENSITY 3.

## Concept: the playground
The owner is a "Website Enthusiast". The site is where that enthusiasm plays:
the type, the grid, and the scroll are the toys. Every section gets exactly one
toy (one interaction or scroll idea that is its own). Nothing loops idly.

Identity motif (repeat it, do not invent others):
1. Crop-mark corners (`components/ui/Corners.tsx`) on the CTA, on images, on
   the active nav item, on hovered cards.
2. Index labels in square brackets: `[01]`, tabular numbers, via the `index`
   utility.
3. Type that responds: Clash Display's weight axis moves under the cursor in
   the hero. Elsewhere headings are static but huge.
4. One accent, acid lime `--accent`. It is a tone (a whole section can be lime)
   and a highlight (selection, the active state), never small text on light.

## Stack
Next.js 16 App Router, React 19, Tailwind v4, Motion (`motion/react`) for UI
interaction, GSAP + ScrollTrigger (`@/lib/gsap`, already registered) for scroll
scenes, Lenis (mounted in `SmoothScroll`, synced with the GSAP ticker). Phosphor
icons only if truly needed. bun.

Rule: GSAP and Motion never in the same component tree. A section is either a
GSAP scene (use `useGSAP` from `@/lib/gsap`, scope it with a ref, and wrap
motion in `gsap.matchMedia()` with a `(prefers-reduced-motion: no-preference)`
condition) or a Motion component. Never `window.addEventListener("scroll")`.

## Tones
Sections declare `data-tone="light" | "dark" | "accent"` on the `<section>`.
That paints background and text and swaps the tone-relative tokens. Components
use ONLY tone-relative colors: `bg-bg`, `text-fg`, `text-fg-2`, `border-line`,
`bg-invert-bg text-invert-fg` (for a solid button in any tone). Fixed colors
(`bg-ink`, `bg-canvas`, `bg-accent`, `bg-cobalt`, `bg-peach`, `bg-plum`,
`bg-sand`) are allowed only for Evidence cards and the nav overlay.

Page tone sequence (this is the rhythm, keep it):
Nav (transparent over whatever is under it) → Hero light → Strip light→dark
seam → About dark → What I do accent → Evidence light → Experience dark →
Footer dark.

Contrast is verified for: ink on canvas, canvas on ink, ink on accent, #4a4a3e
on accent, #a9a8a2 on ink, canvas on cobalt, ink on peach, canvas on plum, ink
on sand. Do not introduce other text/background pairs.

## Type
`font-display` = Clash Display (variable, wght 200 to 700). `font-sans` =
Switzer. There is no mono font. Numbers use `tabular-nums`.
- `font-display text-giant uppercase` hero and footer only
- `font-display text-display uppercase` section titles (About, What I do,
  Evidence, Experience)
- `font-display text-h2` / `text-h3` item titles
- `text-lead` large paragraphs, `text-body` default
- `meta` small uppercase label: MAX 3 on the page (hero corner, one in About,
  one in Footer). Section titles are not eyebrows.

## Spacing and shape
`Container` (max 1400, `px-gutter`), `py-section`, 12-col grid `grid-cols-12
gap-x-6`. Radius is 0 everywhere. No shadows. No gradients except the one
scrim allowed on the Evidence image hover. Hairlines `border-line`.

## Content
All strings from `content/site.ts`. Do not hardcode copy. Placeholder images
are Picsum seeds already in the content file.

## Hard rules (taste-skill + antislop, still in force)
- Zero em-dashes or en-dashes anywhere, code comments included.
- One contact CTA intent: nav "Email me" and footer email both point at the
  email. Nothing else says contact.
- No scroll cues, no locale/time/weather strips, no fake numbers, no decorative
  dots, no pills, no custom cursor.
- Hero fits the first viewport at 1440x900 and at 390x844. Top padding never
  above `pt-24`.
- Nav one line at desktop, 72px tall.
- Every multi-column layout declares its `< 768px` fallback in the same file.
- Every GSAP scene: `useGSAP` with a scope ref, `gsap.matchMedia`, pinning only
  on `(min-width: 768px)`, final readable state rendered under reduced motion,
  `ScrollTrigger.refresh()` after images load if the scene measures height.
- Keyboard: every interactive element reachable and visibly focused. Overlay
  menu closes on Escape and traps nothing it should not.
- Text contrast AA everywhere (see verified pairs).

## Sections, each with its one toy

### Nav (Motion)
Fixed, transparent, mixes with the section under it via `mix-blend-difference`
on the text so it reads on light, dark, and lime. Left: wordmark in
`font-display font-semibold tracking-tight`. Center (md+): links with their
index, `[01] About`; the current section's link gets the `Corners` motif.
Right: `site.contact` button, square, `border border-current px-4 h-10`, with
Corners on hover. Toy: the bar slides up out of view when scrolling down and
returns when scrolling up (`useScroll` + `useMotionValueEvent`, threshold 80px).
Mobile: a "Menu" button opens a full-screen `data-tone="dark"` overlay with the
four links in `font-display text-display` staggered in, plus email and socials
at the bottom. Escape closes. Body scroll locked while open.

### Hero (Motion), `data-tone="light"`, `min-h-[100dvh]`
Four corners of the viewport hold four small things (by-kin move): top-left
`meta` with role and location; top-right nothing (nav lives there); bottom-left
the intro in `text-lead max-w-[28ch]`; bottom-right `site.availability` in
`text-body`. The center is the headline: line one `hero.line1` left-aligned,
line two `hero.line2` right-aligned, both `font-display text-giant uppercase`.
Inline in line two, between letters, sits `hero.tile`, a small image tile the
height of the cap (about 0.8em) with Corners, slightly rotated (-4deg).
Toy: each letter is a span; its `font-variation-settings: "wght"` is a Motion
value that springs between 300 and 700 based on cursor distance (nearest
letters get heaviest). Compute in one pointermove handler using
`useMotionValue` per letter; no React state. On touch devices the weights
gently settle to 600 on load. Entry: letters rise in with `y: 100%` inside an
`overflow-hidden` line wrapper, staggered 25ms, Clash weight animating from 200
to 600 over 1.2s.

### Strip (GSAP), the seam between light and dark
Full-bleed, `h-[40vh] md:h-[55vh]`. Top half canvas, bottom half ink, so the
About section appears to start halfway. An SVG `<textPath>` of `strip.text`
repeated three times runs along a wide shallow arc across the seam in
`font-display` at about 8vw, fill ink on the top part and canvas on the bottom
via `mix-blend-mode: difference` on the text. Toy: `startOffset` is scrubbed by
ScrollTrigger over the strip's own scroll distance, so the sentence slides
along the arc as you scroll (nbnzia's curved-text move, made ours by the seam).
Under reduced motion the text is static at its middle offset.

### About (GSAP), `data-tone="dark"`
12-col. Left cols 1-5: portrait with Corners, rotated -3deg, `md:sticky
md:top-32`. Right cols 7-12: `about.heading` as `font-display text-display
uppercase`, then `about.statement` in `font-display text-h2 font-medium`
split into words. Toy: words start at `opacity 0.25` and scrub to 1 one after
another as the paragraph scrolls through the middle of the viewport (GSAP
`stagger` with `scrub: true`). Facts below as three rows `border-t border-line
py-4 grid grid-cols-[8rem_1fr]`; the first fact label may be the section's one
`meta`. Mobile: title, portrait, statement, facts stacked; no sticky.

### What I do (Motion), `data-tone="accent"`
`servicesHeading` in `font-display text-display uppercase`. Then four rows,
`border-t border-line`, last also `border-b`. Row header is a `<button>`
spanning the full width: `[index]` left, title in `font-display text-h2`, a
plus sign on the right that rotates 45deg when open (draw it with two 1px
divs, not an icon). Toy 1: accordion, one row open at a time, Motion `layout`
and `AnimatePresence` for the body (`height: auto`), body shows `service.body`
and the tags as plain text separated by hairline spacers. Toy 2: on pointer
devices, hovering a closed row shows `service.preview` as a 240x180 image that
follows the cursor with a spring (`useMotionValue` + `useSpring`), Corners on
it, `pointer-events-none`. Hidden on touch. Keyboard: Enter/Space toggles,
`aria-expanded`, `aria-controls`. Mobile: same, no hover preview.

### Evidence (GSAP), `data-tone="light"`
`evidenceHeading` in `font-display text-giant uppercase` bleeding slightly off
the right edge (`translate-x-[4vw]`, `overflow-hidden` on the section). Then
six cards from `projects`. Each card: full container width, `min-h-[78vh]`,
background from its `tone` (cobalt, peach, dark, accent, plum, sand; text
color per verified pairs), padding `p-8 md:p-12`, `(index)` top-right in
`font-display text-h3`, title top-left in `font-display text-display
uppercase`, `kind` and `year` in `text-body` under the title, `summary` bottom
left `max-w-[40ch]`, image right half as a 4:3 tile with Corners rotated 2deg,
whole card is a link to `href` (placeholder `#`). Toy: sticky stack per
taste-skill 5.A, every card `sticky top-[var(--nav-h)]`, the previous card
scales to 0.94 and dims to 0.6 as the next arrives (scrub). Cards below md:
no pin, `min-h-0`, stacked with gap, image above text.

### Experience (CSS sticky + tiny GSAP), `data-tone="dark"`
12-col. Left cols 1-4: `experienceHeading` in `font-display text-display
uppercase`, and under it a giant year in `font-display text-giant` that is
`md:sticky md:top-32`. Toy: as each role scrolls past, the giant year swaps to
that role's `year` (ScrollTrigger `onEnter`/`onEnterBack` toggling a class or
setting textContent; digits flip with a short `y` tween). Right cols 6-12:
roles as `border-t border-line py-10` blocks, `role` in `font-display
text-h2`, `company` and `period` in `text-fg-2`, `summary` `max-w-[40ch]`.
Mobile: heading, then roles with their `period` shown inline; giant year hidden.

### Footer (Motion), `data-tone="dark"`, `id="contact"`
`footer.line1` and `footer.line2` in `font-display text-giant uppercase`, with
`footer.tile` inline between them like the hero. The email as the CTA:
`site.email` in `font-display text-display` as a link, Toy: on hover the text
rolls up and a second copy rolls in from below (two stacked spans in an
`overflow-hidden` wrapper, `translateY`), color to `text-accent`. Under it
`footer.note` `text-fg-2 max-w-[44ch]`. Bottom row `border-t border-line pt-8
grid grid-cols-2 md:grid-cols-12`: nav links, socials (external, noreferrer),
"Based in {location}", copyright with the current year. The footer's one
`meta` may label the socials column.

## As built (version 2 deltas, these override the section specs above)
- `--text-giant` is `clamp(2.75rem, 12.7vw, 11.4rem)`. The cap keeps the
  hero's second line inside the 1400px container even at weight 700; the low
  floor keeps "ENTHUSIAST" on one line at 320px. Hero lines are
  `whitespace-nowrap` and the hero section is `overflow-x-clip`.
- Lenis is driven from the GSAP ticker by a `LenisTicker` child that uses
  `useLenis`; a parent ref reads undefined on the first effect. Anchors use
  `anchors: true` with no offset: every section has `scroll-mt-nav` and Lenis
  honors `scroll-margin-top`. The overlay menu restarts Lenis and calls
  `lenis.scrollTo(href)` itself because Lenis ignores anchors while stopped.
- Strip: `preserveAspectRatio="xMinYMid slice"`, blend on the `<svg>`, no
  `data-tone`, sentence once in an sr-only paragraph.
- About: no `meta`; all three fact labels are `text-sm text-fg-2`.
- What I do: `ServiceAccordion` is the Motion leaf. Arrow keys and Home/End
  move between headers. The preview is a single fixed tile with all four
  images mounted; hidden state also sets `visibility: hidden`.
- Evidence: section uses `overflow-x-clip` (overflow hidden would break
  sticky). Heading bleeds via `md:mr-[calc(50%-50vw)] translate-x-[4vw]`. The
  title row is a flex row across the card; summary and image share row two.
  Image width is also capped by viewport height so a stuck card stays fully on
  screen on short laptops. Dimming is a canvas veil scrubbed 0 to 0.4, not
  element opacity, so earlier titles never ghost through. Mobile titles are
  `text-h2`. Placeholder links prevent default and carry an honest aria-label.
- Experience: heading spans the full width above the grid (the word does not
  fit four columns). The section is one client GSAP tree. A debounced
  ResizeObserver on `document.body` refreshes ScrollTrigger 200ms after the
  document height settles (accordion opening above changes trigger lines).
- Footer: `meta` labels "Based in"; tile sits before "HI."; email is a smaller
  clamp below md and `text-display` from md.
- Meta count on the page: 2 (hero corner, footer "Based in").

## Version 3 deltas (real content, owner notes)
- Content is real, scraped from sndyy.id: name, bio, focus areas, three roles,
  and all eight projects with their Supabase storage images and public links.
  `next.config.ts` allows only that Supabase storage path as a remote host.
- Personal photos are local static imports from `public/images/` (see the
  README there). Tiles and the portrait size themselves from the image's own
  width and height, so any photo shows uncropped.
- Hero: the letter-reveal mask (`overflow-hidden` on each line) is released
  once the entrance finishes, so the tilted tile is never clipped. The corner
  meta shows the name; the role is the headline. The section has `id="top"`.
- Nav: the wordmark is SANDEV. Clicking it scrolls to the top through Lenis
  (restarting Lenis if the overlay stopped it) and clears the hash with
  `history.replaceState`. The CTA label is "Let's Talk", which the footer
  headline repeats, so the contact intent has one name.
- Evidence cards: 8 cards, tones cycle cobalt, dark, accent, peach, plum,
  sand, cobalt, dark. Images are square (the source mockups are 1080x1080)
  and width-capped by viewport height so a stuck card fits at 1440x760. Cards
  with a public link are `<a target="_blank">` with a "Visit project" cue;
  cards without one are plain `<article>` elements, never dead links. Each
  card shows role, kind, year, stack, and summary.
- Experience: company names link to the company sites.

## Version 4 deltas (resume content, owner notes)
- Content source is the resume at `public/resume.pdf` (linked as "Resume" in
  the footer and the mobile menu, opens in a new tab), then sndyy.id. IoT
  projects are removed; the page is web and mobile only. Six projects, each
  with a regularized `partner` shown on the card. Numbers on the page come
  from the resume only.
- Brand: wordmark "SNDYY" (owner is trying all caps; was "Sndyy"), email hey@sndyy.id, hero corner meta
  "Sandy, Indonesia". Strip text reads "WEBSITE / MOBILE ENTHUSIAST /", repeated along the arc.
- Nav is always visible. No hide on scroll.
- Hero line one types between WEBSITE and MOBILE: erase 45ms per letter, 300ms
  gap, type 85ms per letter, hold 2.6s (3.2s the first time). Letters toggle
  `display`; a caret blinks only while a word holds. Pauses off screen, in a
  hidden tab, and while the pointer is over the hero. Off under reduced
  motion. A blur-and-threshold SVG morph was tried first and removed: it
  repainted a large filtered layer every frame and nearly froze Safari. Do
  not bring back per-frame filters on giant type.
- Two headline modes. Web: WEBSITE or MOBILE / ENTHUSIAST, with the typing
  loop. Sketch: SKETCH & / ILLUSTRATE, no loop.
  - Desktop and tablet: the tile is a button. Hover or focus fades in the
    other mode's image. Pressing it selects line one (a lime bar sweeps in
    420ms and rests 160ms), types the new line, does the same for line two,
    and the tile image commits on the press itself (the image the hover just
    previewed stays), while the text catches up. Pressing it again goes
    back and the loop resumes. The headline press area swaps WEBSITE and
    MOBILE in web mode and is disabled in sketch mode.
  - Phone: no tile at all. Pressing the headline switches modes.
  - Presses during a switch are ignored. The hover preview is disarmed from a
    press until the pointer leaves, so the image never flips back under a
    resting cursor.
  - The tile sits before the word on line two, never inside it. The word
    lives in an inline grid whose one cell also holds invisible copies of
    ENTHUSIAST and ILLUSTRATE at resting weight, so the box is as wide as the
    wider word and never changes. The tile therefore holds one position while
    line two erases, retypes, and switches modes (measured: a single x value
    through a full switch in Chromium and WebKit). Trade-off: ILLUSTRATE is
    narrower, so in sketch mode it ends about 38px short of the right edge.
  - Tile alignment: a plain inline-block span carries `align-baseline` and a
    0.035em nudge (tile 0.74em, Clash capitals 0.67em, so it overhangs
    equally). The button fills that span. Never put baseline alignment on an
    empty button: Safari aligns it by its middle, Chrome by its bottom edge.
  - The preview re-arms only after a switch ends and the cursor's last
    position is outside the tile box; hover state and enter/leave events are
    unreliable while the tile slides.
  - Carets are zero-width, one at the end of each line. They never shift
    letters.
  - Reduced motion: presses switch text and image instantly.
- Photos: `public/images/hero-tile.jpg` and `hero-tile-sketch.jpg` should
  share an aspect ratio; the tile sizes itself from the first.
- Evidence title is static, left, `text-display`, like What I do and
  Experience.
- Corners take an `offset` prop. Photos use outside marks (Evidence cards,
  About portrait) so they sit on the surrounding surface and always show.
  About clips x (`overflow-x-clip`) so the tilted portrait's marks never
  cause phone overflow.
- Certificates: a strip between Evidence and Experience (see
  `components/sections/Certificates.tsx`), labeled "More evidence",
  scrubbed to scroll, never auto-looping, each ticket linking to its
  verification page. Tickets behave like the nav's "Let's Talk" button: no
  lift, crop marks fade in 8px outside on hover and focus. The marks take the
  color of the half under them (ink on canvas, canvas on ink) because the
  transformed row cannot use mix-blend-mode against the page.
- Meta count on the page: 3 (hero corner, Certificates heading, footer
  "Based in").

- Experience: the giant year is sticky at `top: calc(50vh - 0.43em)`, which
  puts its middle on the middle of the screen, and it swaps when a role block
  crosses that same 50% line. It releases with the end of the list.
- Sketch mode accent: when SKETCH & ILLUSTRATE finishes typing, the hero sets
  `data-mode="sketch"` on `<html>` and `--accent` becomes rose red `#ff4d5e`
  (secondary text on it `#3b1418`); it returns to lime when WEBSITE
  ENTHUSIAST finishes typing. Crimson `#dc143c` fails AA with ink (3.69:1).
- Nav over accent: the bar drops `mix-blend-mode: difference` and uses ink
  while an accent-toned section is under it (an IntersectionObserver whose
  root is shrunk to the nav strip). Difference over rose red would read teal.
- The hero selection bar uses the target mode's accent: `--accent-sketch`
  (rose red) when switching to SKETCH & ILLUSTRATE, `--accent-web` (lime)
  when switching back. `--accent` itself still changes only after typing.
- Footer headline: `FooterHeadline` makes LET'S TALK. a button. Pressing it
  rolls line two to LARP. letter by letter (500ms, 45ms stagger, transform
  only, each slot a one-cell grid clipped vertically) and back on the next
  press. `aria-pressed` reflects the state; screen readers get the phrase as
  sr-only text.

## Version 5: icons, SEO, larp sync
- Icons are static files rendered from Clash Display: `app/favicon.ico`
  (16, 32, 48, PNG entries), `app/icon.png` (512), `app/apple-icon.png` (180),
  `public/icon-192.png` and `public/icon-512.png` for the manifest. SNDYY in
  ink on `#fcfcfa` (white, but not literal #FFF). PNGs must be RGBA or the
  Next build rejects the favicon.
- Share image: `app/opengraph-image.png` and `app/twitter-image.png`
  (1200x630) with alt text files beside them.
- Metadata in `app/layout.tsx`: canonical `https://www.sndyy.id` (the bare
  domain 308-redirects there, so `site.url` uses www), 56-character title,
  Open Graph profile, Twitter large card, robots with large image previews,
  theme color. JSON-LD `@graph` of WebSite, ProfilePage, and Person (name,
  job, employer, school, location, sameAs LinkedIn and GitHub, knowsAbout).
  `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`.
- Lighthouse on the production build (Sept 16 2026): desktop 100 / 100 /
  100 / 100; mobile SEO, accessibility, and best practices 100, performance
  94 (simulated slow 4G, LCP 3.0s). The hero intro is the LCP element, so it
  is never hidden with opacity on first paint.
- About statement words start at opacity 0.4 (3.5:1 on ink) instead of 0.25.
- Hero line two is not aria-hidden as a whole, because it contains the tile
  button; only its letters are hidden.
- `lib/larp.ts` is a tiny shared store. The footer headline sets it; the nav
  button reads it and rolls "Let's Talk" to "Let's Larp" in a fixed-width
  grid cell, so the bar never shifts.
- Fonts are not committed. The ITF Free Font License allows self-hosting but
  forbids redistributing the files through a repository, so
  `app/fonts/*.woff2` is git-ignored and `scripts/fonts.mjs` downloads them
  from Fontshare in `predev` and `prebuild`.
- Licensing: code under MIT (`LICENSE`); personal content, wordmark, icons,
  and share images all rights reserved (`NOTICE.md`).
