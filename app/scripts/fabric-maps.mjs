/*
 * Shrink the CC0 fabric PBR sets down to something a landing page can afford.
 *
 * Only the normal and roughness maps are kept. The base colour is the customer's choice,
 * so a photographed colour would fight it; what we want from these sets is the weave —
 * the micro-relief that stops a tinted surface reading as plastic.
 *
 * Source: ambientCG (CC0 1.0, public domain). Asset ids are kept in the file names so the
 * provenance travels with the texture.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2];
const OUT = process.argv[3];
const SIZE = 512;

// fabric key -> ambientCG asset, chosen for how the weave reads at garment scale
const SETS = {
  cotton: "Fabric082A",      // fine smooth woven
  polyester: "Fabric048",    // polyester, as used for sports vests
  fleece: "Fabric084",       // soft microfiber
  print: "Fabric081C",       // plastisol screen print, for the ink relief under artwork
};

await mkdir(OUT, { recursive: true });
for (const [key, asset] of Object.entries(SETS)) {
  for (const [map, suffix] of [["normal", "NormalGL"], ["roughness", "Roughness"]]) {
    const from = path.join(SRC, asset, `${asset}_1K-JPG_${suffix}.jpg`);
    const to = path.join(OUT, `${key}-${map}.webp`);
    const info = await sharp(from)
      .resize(SIZE, SIZE, { fit: "cover" })
      .webp({ quality: map === "normal" ? 92 : 82 })
      .toFile(to);
    console.log(`${key}-${map}.webp  ${(info.size / 1024).toFixed(0)} kB  (${asset} CC0)`);
  }
}
