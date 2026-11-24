// Writes the site's icon files from the mark in src/lib/mark.ts:
//   src/app/favicon.ico     16, 32 and 48 px, each drawn at its own weight
//   src/app/icon.png        192 px, the size the design board names
//   src/app/apple-icon.png  180 px, full bleed (iOS rounds the corners itself)
// Next.js turns these files into the <link> tags (see app-icons.md in
// node_modules/next/dist/docs). The files are committed; run this again only
// when the mark changes:  node scripts/make-icons.mts
//
// sharp comes with Next.js (its image optimiser), so nothing extra is installed.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { markSvg, type MarkWeight } from "../src/lib/mark.ts";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "app");

async function png(weight: MarkWeight, size: number, fullBleed = false): Promise<Buffer> {
  return sharp(Buffer.from(markSvg({ weight, size, fullBleed })))
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// An .ico file holding PNG images (read by every current browser and Windows).
function ico(images: Array<{ size: number; data: Buffer }>): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // no palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const favicon = ico([
  { size: 16, data: await png("tiny", 16) },
  { size: 32, data: await png("small", 32) },
  { size: 48, data: await png("regular", 48) },
]);
writeFileSync(join(APP, "favicon.ico"), favicon);
writeFileSync(join(APP, "icon.png"), await png("regular", 192));
writeFileSync(join(APP, "apple-icon.png"), await png("regular", 180, true));
console.log("Wrote favicon.ico, icon.png and apple-icon.png in src/app.");
