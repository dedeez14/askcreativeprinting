import { mockupInfo } from "../components/ProductMockup";
import type { PrintMode, Rect, Side } from "./types";

/**
 * The printable zone of each product, in board units local to the product drawing (see types.ts).
 *
 *  - simple mode: a chest / back print rectangle on a garment, the printable face of anything else;
 *  - full mode (sublimation): the whole garment, clipped to its silhouette — sleeves included.
 *
 * The rectangles follow the drawings in ProductMockup (shoulders at y≈72, hem at y≈336).
 */

const OTHER: Record<string, Rect> = {
  Mug: { x: 132, y: 136, w: 126, h: 184 },
  Cap: { x: 150, y: 166, w: 100, h: 82 },
  Lanyard: { x: 150, y: 300, w: 100, h: 124 },
  Banner: { x: 44, y: 106, w: 312, h: 216 },
  Bunting: { x: 30, y: 100, w: 340, h: 130 },
  Sticker: { x: 120, y: 120, w: 160, h: 178 },
  "Premium Gift": { x: 126, y: 196, w: 148, h: 190 },
};

/** The whole garment, for full print (the silhouette clip trims it to the cloth). */
const FULL: Rect = { x: 24, y: 12, w: 352, h: 336 };

export function printArea(product: string, side: Side, mode: PrintMode): Rect {
  const info = mockupInfo(product);
  if (!info.garment) return OTHER[info.model] ?? OTHER["Premium Gift"];
  if (mode === "full") return FULL;
  if (side === "back") return { x: 124, y: 84, w: 152, h: 206 };
  return info.vNeck ? { x: 128, y: 120, w: 144, h: 176 } : { x: 126, y: 98, w: 148, h: 196 };
}

/** Products drawn with a back to design on. */
export const hasBack = (product: string): boolean => mockupInfo(product).garment;

/**
 * Full print (sublimation) is offered on every garment that can be sublimated — everything but the
 * woven corporate shirt — and is where a jersey, singlet or a "sublimation" product opens.
 */
export function fullPrintAllowed(product: string): boolean {
  const info = mockupInfo(product);
  return info.garment && info.model !== "Corporate Shirt";
}

export function fullPrintByDefault(product: string): boolean {
  if (!fullPrintAllowed(product)) return false;
  const { model } = mockupInfo(product);
  return /jersey|singlet/i.test(model) || /sublimat|full ?print|all.?over|jersey/i.test(product);
}

/** Where a new picture goes: the wearer's left chest for a polo or jacket logo, else the centre. */
export function defaultSpot(product: string, side: Side, mode: PrintMode): { x: number; y: number; w: number } {
  const info = mockupInfo(product);
  const a = printArea(product, side, mode);
  if (info.garment && side === "front" && info.frontPrint === "logo") return { x: 244, y: 128, w: 46 };
  if (info.garment && mode === "full") {
    const chest = printArea(product, side, "simple");
    return { x: chest.x + chest.w / 2, y: chest.y + chest.h * 0.38, w: chest.w * 0.6 };
  }
  return { x: a.x + a.w / 2, y: a.y + a.h * (info.garment ? 0.38 : 0.5), w: a.w * 0.6 };
}
