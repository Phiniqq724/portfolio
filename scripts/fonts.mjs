/*
  Downloads the Fontshare fonts into app/fonts before dev and build.

  Why this exists: Clash Display and Switzer are licensed under the ITF Free
  Font License, which allows self-hosting on your own site but forbids
  redistributing the font files through a repository. So the .woff2 files are
  git-ignored and fetched straight from Fontshare instead. By running this you
  accept the ITF Free Font License published on https://www.fontshare.com.

  Runs with Node 18+ or Bun. Skips any file that is already present.
*/
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "app", "fonts");

const fonts = [
  { family: "clash-display", files: ["ClashDisplay-Variable.woff2"] },
  { family: "switzer", files: ["Switzer-Variable.woff2", "Switzer-VariableItalic.woff2"] },
];

mkdirSync(outDir, { recursive: true });

for (const { family, files } of fonts) {
  const missing = files.filter((f) => !existsSync(join(outDir, f)));
  if (missing.length === 0) continue;

  const res = await fetch(`https://api.fontshare.com/v2/fonts/download/${family}`);
  if (!res.ok) throw new Error(`Fontshare download failed for ${family}: HTTP ${res.status}`);
  const zip = unzipSync(new Uint8Array(await res.arrayBuffer()));

  for (const file of missing) {
    const entry = Object.keys(zip).find((path) => path.endsWith(`/WEB/fonts/${file}`));
    if (!entry) throw new Error(`${file} not found in the ${family} download`);
    writeFileSync(join(outDir, file), zip[entry]);
    console.log(`fonts: ${file}`);
  }
}
