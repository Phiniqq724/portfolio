# Your photos

Replace these three files with your own photos. Keep the same file names.
Any aspect ratio works: the layout reads each image's real width and height,
so nothing gets cropped. JPG is expected; if yours is PNG or WEBP, either
convert it or change the matching import at the top of `content/site.ts`.

| File              | Where it shows                                   | Suggested        |
| ----------------- | ------------------------------------------------ | ---------------- |
| `hero-tile.jpg`   | Small tilted tile inside the word "ENTHUSIAST"   | Portrait, 800px+ |
| `hero-tile-sketch.jpg` | The same tile in SKETCH & ILLUSTRATE mode, and on hover | Same ratio as `hero-tile.jpg` |
| `portrait.jpg`    | Large tilted sticky photo in the About section   | Portrait, 1200px+|
| `footer-tile.jpg` | Small tilted tile inside "LET'S TALK." in footer | Any, 800px+      |

The hero tile only shows on tablet and desktop. Keep `hero-tile.jpg` and
`hero-tile-sketch.jpg` at the same aspect ratio: the tile sizes itself from
`hero-tile.jpg`, so a different ratio in the sketch image gets cropped.

After replacing, restart `bun run dev` if the old image is still cached.
