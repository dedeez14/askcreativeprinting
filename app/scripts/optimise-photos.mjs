/*
 * Re-encode the site photos for phones (06 §13 "fast loading"). Every public/images/*.jpg wider than 1200 px or
 * heavier than 180 kB is resized to at most 1200 px wide and saved as a progressive mozjpeg at quality 72.
 * The originals stay in git history; run again after adding photos: node scripts/optimise-photos.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.resolve('public/images');
let before = 0, after = 0;
for (const f of fs.readdirSync(dir).filter((n) => /\.jpe?g$/i.test(n))) {
  const file = path.join(dir, f);
  const size = fs.statSync(file).size;
  const meta = await sharp(file).metadata();
  if (meta.width <= 1200 && size <= 180 * 1024) continue;
  const out = await sharp(file).rotate().resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 72, progressive: true, mozjpeg: true }).toBuffer();
  if (out.length < size) {
    fs.writeFileSync(file, out);
    before += size; after += out.length;
    console.log(`${f.padEnd(34)} ${Math.round(size / 1024)} kB → ${Math.round(out.length / 1024)} kB`);
  }
}
console.log(`total ${Math.round(before / 1024)} kB → ${Math.round(after / 1024)} kB`);
