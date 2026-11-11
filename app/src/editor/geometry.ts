import { fontFamily } from "./fonts";
import type { Layer, TextLayer } from "./types";

/** Sizes and outlines of design layers, in board units (text is measured with its own font). */

export const LINE = 1.15;
let ctx2d: CanvasRenderingContext2D | null = null;

const fontString = (t: Pick<TextLayer, "font" | "size" | "bold" | "italic">) =>
  `${t.italic ? "italic " : ""}${t.bold ? 700 : 400} ${t.size}px "${fontFamily(t.font)}", sans-serif`;

export const lines = (t: TextLayer): string[] => (Math.abs(t.arc) >= 2 ? [t.text.replace(/\n+/g, " ")] : t.text.split("\n"));

function textWidth(t: TextLayer, line: string): number {
  ctx2d ??= document.createElement("canvas").getContext("2d");
  if (!ctx2d) return line.length * t.size * 0.6;
  ctx2d.font = fontString(t);
  const spacing = (t.spacing / 100) * t.size;
  return ctx2d.measureText(line || " ").width + spacing * Math.max(0, line.length - 1);
}

export interface ArcGeometry { r: number; half: number; sag: number; y0: number; up: boolean; width: number }

export function arcGeometry(t: TextLayer): ArcGeometry | null {
  if (Math.abs(t.arc) < 2) return null;
  const width = textWidth(t, lines(t)[0]);
  const theta = (Math.abs(t.arc) / 100) * Math.PI;
  const r = Math.max(width / theta, t.size * 0.6);
  const half = Math.min(theta / 2, Math.PI / 2);
  const sag = r * (1 - Math.cos(half));
  const up = t.arc > 0;
  const y0 = up ? (0.75 * t.size - sag) / 2 : (sag + 0.55 * t.size) / 2;
  return { r, half, sag, y0, up, width };
}

/** The box a layer occupies before rotation, board units. */
export function layerBox(layer: Layer): { w: number; h: number } {
  if (layer.type !== "text") return { w: layer.w, h: layer.h };
  const pad = (layer.size * layer.strokeWidth) / 100;
  const arc = arcGeometry(layer);
  if (arc) {
    const chord = 2 * arc.r * Math.sin(arc.half);
    return { w: Math.max(chord, layer.size) + layer.size * 0.4 + pad * 2, h: arc.sag + layer.size * 1.05 + pad * 2 };
  }
  const ls = lines(layer);
  const w = Math.max(...ls.map((l) => textWidth(layer, l)));
  return { w: w + pad * 2 + layer.size * 0.1, h: ls.length * layer.size * LINE + pad * 2 };
}


/** Corners of a layer's rotated box (for hit-testing the print area). */
export function layerCorners(layer: Layer): Array<[number, number]> {
  const { w, h } = layerBox(layer);
  const a = (layer.rotation * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [layer.x + x * c - y * s, layer.y + x * s + y * c]);
}

/** Axis-aligned bounds of the rotated layer. */
export function layerBounds(layer: Layer): { x: number; y: number; w: number; h: number } {
  const pts = layerCorners(layer);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
