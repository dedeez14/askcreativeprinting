import { useEffect, useState } from "react";
import type { FontId } from "./types";

import dmSans400 from "@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2?url";
import dmSans700 from "@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2?url";
import dmSans400i from "@fontsource/dm-sans/files/dm-sans-latin-400-italic.woff2?url";
import dmSans700i from "@fontsource/dm-sans/files/dm-sans-latin-700-italic.woff2?url";
import anton400 from "@fontsource/anton/files/anton-latin-400-normal.woff2?url";
import bebas400 from "@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2?url";
import oswald400 from "@fontsource/oswald/files/oswald-latin-400-normal.woff2?url";
import oswald700 from "@fontsource/oswald/files/oswald-latin-700-normal.woff2?url";
import mont400 from "@fontsource/montserrat/files/montserrat-latin-400-normal.woff2?url";
import mont700 from "@fontsource/montserrat/files/montserrat-latin-700-normal.woff2?url";
import mont400i from "@fontsource/montserrat/files/montserrat-latin-400-italic.woff2?url";
import mont700i from "@fontsource/montserrat/files/montserrat-latin-700-italic.woff2?url";
import graduate400 from "@fontsource/graduate/files/graduate-latin-400-normal.woff2?url";
import marker400 from "@fontsource/permanent-marker/files/permanent-marker-latin-400-normal.woff2?url";

/**
 * The editor's fonts — a short list that suits sportswear and merch. They are self-hosted (Fontsource,
 * SIL OFL / Apache) rather than fetched from Google, so a font is only downloaded when a customer picks
 * it, and so the PNG preview can embed the very same file (an SVG drawn into a canvas cannot see the
 * page's fonts). Only the Latin subset is shipped; a missing weight or slant is synthesised.
 */

type Variant = "400normal" | "700normal" | "400italic" | "700italic";

export interface EditorFont {
  id: FontId;
  label: string;
  /** What the font is good for, shown under the chip. */
  note: string;
  files: Partial<Record<Variant, string>>;
  /** Fonts that are all caps by design. */
  caps?: boolean;
}

export const FONTS: EditorFont[] = [
  { id: "anton", label: "Anton", note: "Bold block", files: { "400normal": anton400 } },
  { id: "bebas-neue", label: "Bebas Neue", note: "Tall caps", files: { "400normal": bebas400 }, caps: true },
  { id: "oswald", label: "Oswald", note: "Condensed", files: { "400normal": oswald400, "700normal": oswald700 } },
  { id: "graduate", label: "Graduate", note: "College", files: { "400normal": graduate400 } },
  { id: "montserrat", label: "Montserrat", note: "Clean", files: { "400normal": mont400, "700normal": mont700, "400italic": mont400i, "700italic": mont700i } },
  { id: "permanent-marker", label: "Marker", note: "Hand-drawn", files: { "400normal": marker400 } },
  { id: "dm-sans", label: "DM Sans", note: "Our site font", files: { "400normal": dmSans400, "700normal": dmSans700, "400italic": dmSans400i, "700italic": dmSans700i } },
];

export const fontById = (id: FontId): EditorFont => FONTS.find((f) => f.id === id) ?? FONTS[0];

/** The CSS family name the editor registers a font under (never clashes with the page's own fonts). */
export const fontFamily = (id: FontId): string => `ed-${id}`;

const variantOf = (bold: boolean, italic: boolean): Variant =>
  `${bold ? 700 : 400}${italic ? "italic" : "normal"}` as Variant;

/** The file actually used for a weight/slant, and whether the browser must synthesise the rest. */
function fileFor(font: EditorFont, bold: boolean, italic: boolean): { url: string; variant: Variant } {
  const wanted = variantOf(bold, italic);
  if (font.files[wanted]) return { url: font.files[wanted]!, variant: wanted };
  const upright = variantOf(bold, false);
  if (font.files[upright]) return { url: font.files[upright]!, variant: upright };
  return { url: font.files["400normal"]!, variant: "400normal" };
}

const loading = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

/** Called whenever a font finishes loading, so text boxes can be measured again. */
export function onFontLoaded(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Load one font face (once). Safe to call on every render. */
export function ensureFont(id: FontId, bold = false, italic = false): Promise<void> {
  const font = fontById(id);
  const { url, variant } = fileFor(font, bold, italic);
  const key = `${id}:${variant}`;
  let p = loading.get(key);
  if (!p) {
    const face = new FontFace(fontFamily(id), `url(${url}) format("woff2")`, {
      weight: variant.startsWith("700") ? "700" : "400",
      style: variant.endsWith("italic") ? "italic" : "normal",
    });
    p = face.load().then((f) => {
      document.fonts.add(f);
      listeners.forEach((fn) => fn());
    }).catch(() => {
      // The fallback font is drawn meanwhile; the next call tries again.
      loading.delete(key);
    });
    loading.set(key, p);
  }
  return p;
}

const toDataUrl = async (url: string): Promise<string> => {
  const blob = await (await fetch(url)).blob();
  return await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
};

/**
 * @font-face rules with the font files inlined, for the PNG preview: an SVG rendered as an image is
 * sandboxed and sees no font the page loaded.
 */
export async function embeddedFontCss(used: Array<{ font: FontId; bold: boolean; italic: boolean }>): Promise<string> {
  const seen = new Set<string>();
  const rules: string[] = [];
  for (const u of used) {
    const font = fontById(u.font);
    const { url, variant } = fileFor(font, u.bold, u.italic);
    const key = `${u.font}:${variant}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const data = await toDataUrl(url);
      rules.push(`@font-face{font-family:"${fontFamily(u.font)}";src:url(${data}) format("woff2");font-weight:${variant.startsWith("700") ? 700 : 400};font-style:${variant.endsWith("italic") ? "italic" : "normal"};}`);
    } catch { /* fallback font */ }
  }
  return rules.join("\n");
}

export { toDataUrl };

/** Re-render when an editor font has loaded (text boxes are measured with it). */
export function useFontVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => onFontLoaded(() => setV((n) => n + 1)), []);
  return v;
}
