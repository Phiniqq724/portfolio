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
seam → About dark → What I do light → Evidence light → Experience dark →
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
  `anchors: true` with no offset. (Version 6: sections no longer carry
  `scroll-mt-nav`; see the anchors bullet at the end.) The overlay menu restarts Lenis and calls
  `lenis.scrollTo(href)` itself because Lenis ignores anchors while stopped.
- Strip: `preserveAspectRatio="xMinYMid slice"`, blend on the `<svg>`, no
  `data-tone`, sentence once in an sr-only paragraph.
- About: no `meta`; all three fact labels are `text-sm text-fg-2`.
- (Superseded by Version 6: no cursor tile.) What I do: `ServiceAccordion` is the Motion leaf. Arrow keys and Home/End
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
- (Superseded by the Version 6 ledger.) Certificates: a strip between Evidence and Experience (see
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

## Version 6 deltas (teacher and family review, Oct 2026)
These override everything above where they conflict.
- One photo on the whole page: the About portrait. The hero has no image,
  the footer headline has no tile, and SKETCH & ILLUSTRATE mode is gone,
  with the rose red accent, `data-mode`, and the tile. The accent is lime,
  always. (A cut-out photo in the hero was tried and reverted by the owner.)
- Hero: the four-corner layout from version 2, text only. The first word is
  never erased letter by letter: after its hold, a lime selection bar sweeps
  across it (420ms, rests 160ms), the word goes, and the other word types in
  from the caret at 85ms per letter. Pressing the headline starts the swap
  early. Reduced motion: no loop, a press swaps instantly.
- Nav: "Let's Talk" is a `mailto:` link to `site.email`. The footer email
  is the same intent. The nav still turns ink over any `data-tone="accent"`
  surface, which is now only the lime Evidence card.
- Experience runs oldest first (school, then each role up to now). Code
  that wants the current role reads the LAST entry (`app/layout.tsx`).
- Experience year: an odometer of four single-digit slots, each a one-cell
  grid clipped on y. Only digits that differ roll (2025 to 2026 moves one
  slot, 2029 to 2030 moves two), transform only, 0.45s expo.out, 0.04s
  stagger left to right among changed slots. Scrolling down rolls the old
  digit up and the new one in from below; scrolling back reverses it. A roll
  in flight is completed before the next starts on that slot. Clash Display
  has no tabular figures, so a changing cell takes the new digit's width
  when the roll starts, not when it ends. Reduced motion swaps instantly.
- What I do: light tone; the full lime section was too loud. Lime is a
  highlighter mark (ink on lime) behind the open row's title, the section's
  only lime at rest. It sweeps in from the left over 420ms on open and out
  to the right on close; instant under reduced motion. The mark is a
  single-color `linear-gradient` animated through `background-size` (a solid
  fill, not a gradient), 1em tall and centered, with
  `box-decoration-break: clone` so wrapped lines each get their own block.
  The plus sign stays ink and hover adds no lime.
- Evidence: full-bleed, full-screen cards at md+ (100vw x 100svh), content
  in a 1400px inner wrapper under the nav, image capped by the remaining
  height (`100cqh`). The stack is one sticky stage (top 0, `h-svh`,
  `overflow: clip`) inside a wrapper `cards x 1.25` screens tall (plain CSS,
  no GSAP pin, so the page height is final from first paint); cards sit
  absolutely on it, later ones on top. One scrubbed timeline, in screens:
  a card holds flat for 0.25 (shortened from 0.5 by the owner), then the next rises over 1 (yPercent 100 to 0)
  while the covered card falls back (random `rollFall`, ink veil to 0.5),
  and once fully covered it goes to opacity 0 (not visibility, so Tab still
  reaches it). At most two cards are ever drawn; scrolling back reverses
  it. The last card holds 0.25, then the stage releases. `rollFall`: left or
  right, pivot near that top corner, rotateX 20-34, rotateY 6-16 and a
  2-8deg turn toward that side, 3-9% drift, scale 0.74-0.84, never the same
  side three times running. The lime card's nav probe is an invisible
  `data-tone="accent"` box in the wrapper for its 1.25 screens. Below md and
  under reduced motion: plain full-screen blocks in order, no 3D. Focusing a
  hidden card scrolls a quarter screen into its hold.
- About portrait always fits, tilt and crop marks included. Its footprint
  (photo plus the marks 10px outside, turned -3deg: w*cos + h*sin wide,
  w*sin + h*cos tall) is solved to be no wider than its column and no
  taller than the screen minus the nav and 2rem above and below (`fit` in
  About.tsx). Centered in its column at every width, sticky 2rem under the
  nav. On phones the marks run exactly gutter to gutter. Checked with the
  marks measured at 22 sizes from 320x568 to 1920x1080, landscape phones
  too. Below 400px the What I do row tightens (2.25rem index, 1.25rem plus,
  12px gaps) so "development" fits a 320px phone.
- Accent as a hint, not a surface: no section is painted lime any more.
  Lime appears on hover and on the active thing. `link-line` reads three
  hint variables set per surface in globals.css: dark tones turn the link
  text and underline lime; light tones keep ink text and grow a lime
  highlighter band (0.42em) behind the word; `hint-plain` (lime surfaces,
  the nav, whose difference blend would turn lime blue) keeps a
  currentColor underline. Evidence cards pick `hint-dark`, `hint-light` or
  `hint-plain` by their own color.
- Footer: headline and email are one block. From md the headline takes
  cols 1-7 and the email (`text-h3`, semibold, with a ↗ that nudges and
  turns lime on hover) plus the note sit in cols 8-12, bottom-aligned with
  TALK. Below md the email follows the headline 2rem under it.
- (Placement superseded below: the ledger now lives inside Experience.)
  Certificates: a dark ledger between Evidence and Experience, no lime
  blocks. One `meta` ("More evidence") plus an `index` count, then one
  hairline row per certificate, each a single new-tab link to its
  verification page. md+: year cols 1-2, title (`text-h3`) 3-8, issuer
  9-11, arrow 12. Below md: title on its own line, year and issuer small
  under it, arrow right. Hover and focus are a hint: title and arrow turn
  lime, the arrow moves 4px up-right, the year brightens; crop marks around
  the arrow on hover only. Toy: hairlines draw in and rows rise once as the
  list enters (GSAP, final state server-rendered). No scrub, pin or seam.
- What I do is a compact hover list, after nbnzia: 96px closed rows at
  md+, `[01]` index, `text-h3` title. One row open at a time, the first on
  load. Pointer devices: resting 100ms on a row opens it; leaving the list
  keeps the last one open; moves that repeat the last coordinates are
  ignored. Keyboard focus opens a row, Enter/Space toggle; touch taps
  toggle. md+: the open row shows its image on the right inside the row,
  4:3, `min(24cqw, 22.5rem)` wide, outside crop marks, clipped in top-down
  on the row's own 0.45s height curve. Below md no image, a plus marks the
  row. The lime title mark stays. The cursor-following tile is gone.
- Anchors land on the section's top edge, with no scroll margin. Every
  nav target's own top padding (96px minimum) is taller than the 72px nav,
  so the transparent bar only ever sits over that section's empty padding,
  never over the end of the section above (the certificates ledger has no
  bottom padding and used to show through). Footer headline: letter slots
  clip on y only (an x clip cut the overhangs of Clash Display's A and K)
  and animate their width to the letter shown, so TALK. and LARP. are both
  spaced like normal type. Only the second word is the button (LET'S is
  plain heading text): hover turns that word lime, and in LARP. it is lime
  at rest and canvas on hover.
- One divider per seam on phones. Below md a list does not draw a closing
  rule when something right below already divides: the certificates ledger
  has top rules only, and the last Experience role has no bottom rule (the
  footer's full-bleed top line closes it). From md both closing rules show:
  the gaps are wide enough there that they read as the end of the list, not
  as lines stacking.
- Experience "now": while the giant year belongs to the current role (the
  last entry), it turns lime (`data-now` on the year, 500ms color fade with
  the roll, back to canvas when scrolling up). Below md, where the giant
  year is hidden, the current role's period ("Jun 2026 - Now") is lime.
- Evidence cards are black and white, alternating, starting with ink
  (`scheme` in content/site.ts), so lime is the only color in the section.
  (Thumbnail-derived Material colors were tried first; the owner preferred
  monochrome.) Canvas cards carry a hairline edge so they still read as
  they fall against the canvas section. While a card is full screen and
  flat (landing through hold; the last card until the stage leaves), its
  title wears the lime highlighter, the same mark as the hero selection and
  What I do: sweeps in from the left over 420ms, ink text on lime, out to
  the right as the card starts to fall. It is driven by plain
  ScrollTriggers setting `data-active`, not the scrubbed timeline, so the
  sweep runs on its own clock. Below md and under reduced motion the card
  crossing the middle of the screen is the active one. Only canvas on ink
  and ink on canvas (and ink on lime) are used.
- Nav over Evidence: each card has an invisible `data-nav="ink|canvas"`
  probe; the nav takes that plain color while the card is flat under it
  (landing through hold) and blends again during the fall, when canvas
  shows around the tipped card. The nav judges from a 1px line through its
  middle, so exactly one surface decides at a time.
- About statement highlights: the phrases in `about.highlights` ("the
  backend meets the screen", "feel quiet to use") get the lime highlighter,
  ink on lime. Each sweeps in (420ms, from the left) the moment the word
  scrub brings the phrase's last word to full opacity, read from the same
  ScrollTrigger's progress (`litAt`, capped at 0.98 so the closing phrase
  cannot be missed by rounding), and out again when scrolling back above
  that point. Reduced motion: highlighted from the start. Keep it to two or
  three phrases, or the mark stops meaning anything.
- Hero loop under the cursor: the WEBSITE / MOBILE select-and-type loop
  no longer pauses while the pointer is over the hero (it filled the first
  screen, so on desktop the loop looked stuck unless pressed). It now
  advances whenever the hero is on screen and the tab is visible, so the
  swap plays on its own; pressing still skips the hold. The headline stays
  one press area, and there is no wave or breathing on it (several were
  tried and dropped by the owner). Typing timing lives in `lib/typing.ts`
  and the caret in `components/ui/Caret.tsx`, shared with Experience.
- Certificates moved into Experience, under the roles: the same ledger
  rows (year cols 1-2, title 3-8, issuer 9-11, arrow 12) across the full
  width, no separate section, no `meta` (the page now has 2: hero corner
  and footer). From md the year column spans one extra grid row, an empty
  slot one year-height tall under the last role (`data-verified`), so the
  sticky year comes to rest right above the ledger and never follows it
  down. While the year is seated in that slot it reads VERIFIED
  (`certificatesHeading`): the year is selected (lime bar, ink text) and
  the word types in with a caret, centered on the year's line and sized
  to fill the column exactly (font size = column width over the word's
  measured width in em). Scrolling back up far enough that the year rides
  again selects VERIFIED and types the year back. The swap runs at about
  twice the hero's pace (select 260ms, rest 80ms, gap 60ms, 45ms per
  letter), under a second in all. Swaps never overlap; one asked for
  mid-swap runs after. Below md the year column is hidden, so VERIFIED is
  a visible `text-display` heading over the ledger (sr-only from md).
  Reduced motion swaps instantly.
- Experience "now", revised: while the giant year belongs to the current
  role, that role's title (`text-h2`) turns lime with the year. The
  section title EXPERIENCE stays canvas and scrolls normally (pinning it
  was tried and rejected by the owner).
- About highlights run as one continuous marker stroke: the phrase's band
  uses `box-decoration-break: slice`, so a phrase that wraps is one strip
  cut across its lines (padding only at the phrase's two ends), and the
  sweep runs along line one and continues on line two instead of every
  line sweeping at once. 700ms, since it travels further than a one-line
  mark. Other highlighter marks (hero, What I do, Evidence) keep `clone`.
