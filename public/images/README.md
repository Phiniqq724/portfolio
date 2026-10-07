# Your photo

The site shows one personal photo.

| File           | Where it shows                                 | Suggested         |
| -------------- | ---------------------------------------------- | ----------------- |
| `portrait.jpg` | Large tilted sticky photo in the About section | Portrait, 1200px+ |

Replace it with your own and keep the file name. Any aspect ratio works: the
layout reads the image's real width and height, so nothing gets cropped. JPG
is expected; if yours is PNG or WEBP, either convert it or change the import
at the top of `content/site.ts`.

After replacing, restart `bun run dev` if the old image is still cached.
