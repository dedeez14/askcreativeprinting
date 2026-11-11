import { mockupInfo } from "../components/ProductMockup";
import { layerBounds } from "./geometry";
import { fullPrintAllowed, printArea } from "./printAreas";
import { constrain } from "./state";
import type { DesignDoc, Layer, PrintMode, Side } from "./types";

/**
 * Full print wraps round the body (user, 11-Nov-2026: "ketika fullprint design nyambung depan belakang
 * ketika design ada di pinggir"). A sublimated body is one piece of cloth: walking round the wearer,
 * the FRONT (seen from the front, viewer-left → viewer-right) runs into the BACK (seen from the back,
 * viewer-left → viewer-right), and the back's right edge runs into the front's left edge.
 *
 * On the flat mockups the side seams are two vertical lines at x = L and x = R (200 ∓ the hem
 * half-width); front and back are drawn on the same board with the same hem, so a point at height y
 * is at height y on both views. Unrolled, the body is a strip of circumference 2D (D = R − L):
 *   front x ↦ strip x − L,   back x ↦ strip D + x − L.
 * So anything past R on one view continues at x − D on the other, and past L at x + D.
 *
 * Sleeves stay their own panels: a layer above the underarm and outside the body band is a sleeve
 * print and does not wrap.
 */

export interface Seams {
  /** Viewer-left and viewer-right side seam. */
  L: number;
  R: number;
  /** Width of one body panel; the circumference is 2D. */
  D: number;
  /** Underarm height — below it, crossing a seam means going round the body. */
  underY: number;
  /** The vertical extent of the body strip. */
  top: number;
  height: number;
}

export function seamsFor(product: string): Seams | null {
  const info = mockupInfo(product);
  if (!info.garment) return null;
  const L = 200 - info.hem, R = 200 + info.hem;
  return { L, R, D: R - L, underY: info.sleeveless ? 168 : 142, top: 12, height: 336 };
}

/** True when the design wraps: full print on a garment that can be sublimated. */
export function wrapsFor(product: string, mode: PrintMode): Seams | null {
  return mode === "full" && fullPrintAllowed(product) ? seamsFor(product) : null;
}

/** A layer on the body panel (as opposed to a sleeve print). */
export const onBody = (l: Layer, s: Seams): boolean => l.x >= s.L - 0.5 && l.x <= s.R + 0.5;

/** Bring a layer's centre back onto the body panel it is over, crossing to the other view if needed. */
export function wrapLayer<T extends Layer>(l: T, s: Seams): T {
  if (l.y <= s.underY) return l;
  let { x, side } = l;
  for (let i = 0; i < 4 && (x > s.R || x < s.L); i++) {
    x += x > s.R ? -s.D : s.D;
    side = side === "front" ? "back" : "front";
  }
  return x === l.x ? l : { ...l, x, side };
}

/** Where the part of a body layer that runs past a seam shows on the other view (x offsets). */
export function ghostShifts(l: Layer, s: Seams): number[] {
  if (!onBody(l, s)) return [];
  const b = layerBounds(l);
  const out: number[] = [];
  if (b.x + b.w > s.R) out.push(-s.D);
  if (b.x < s.L) out.push(s.D);
  return out;
}

/** Keep a layer in its zone; on a wrapping garment, move it round the body instead of stopping it. */
export function place<T extends Layer>(l: T, product: string, mode: PrintMode): T {
  const s = wrapsFor(product, mode);
  if (!s) return constrain(l, printArea(product, l.side, mode));
  const w = wrapLayer(l, s);
  const a = printArea(product, w.side, mode);
  const x = Math.min(Math.max(w.x, a.x), a.x + a.w), y = Math.min(Math.max(w.y, a.y), a.y + a.h);
  return x === w.x && y === w.y ? w : { ...w, x, y };
}

/** The layers drawn on one view: its own, and the parts of the other view's layers that wrap round. */
export function layersOnView(doc: DesignDoc, side: Side, product: string): Array<{ layer: Layer; shift: number; ghost: boolean }> {
  const s = wrapsFor(product, doc.mode);
  const out: Array<{ layer: Layer; shift: number; ghost: boolean }> = [];
  for (const l of doc.layers) {
    if (l.side === side) out.push({ layer: l, shift: 0, ghost: false });
    else if (s) for (const shift of ghostShifts(l, s)) out.push({ layer: l, shift, ghost: true });
  }
  return out;
}

/** Strip position of a layer centre, 0–1 round the body from the front's left seam. */
export const stripX = (l: Layer, s: Seams): number => ((l.side === "front" ? 0 : s.D) + l.x - s.L) / (2 * s.D);
