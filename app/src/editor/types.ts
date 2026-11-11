import type { UploadedFile } from "../types/landing";

/**
 * The Online Design editor's document: what the customer put on the garment.
 *
 * Every position is in BOARD units — the 400 × 440 board every mockup is drawn on (ProductMockup),
 * local to the product's own group. All garments share that board and stand on the same hem line, so
 * a logo placed on a tee's chest is still on the chest of the polo the customer switches to.
 * The ERP export (exportDesign.ts) converts to print-area-relative units.
 */

export type Side = "front" | "back";

/** "simple" = a print on a plain garment; "full" = full print / sublimation (the whole panel). */
export type PrintMode = "simple" | "full";

export type FontId =
  | "dm-sans" | "anton" | "bebas-neue" | "oswald" | "montserrat" | "graduate" | "permanent-marker";

export type PatternId =
  | "stripes" | "pinstripes" | "diagonal" | "chevron" | "halftone" | "checker"
  | "triangles" | "hexagon" | "waves" | "camo" | "brush" | "zigzag";

export type ShapeId = "rect" | "circle" | "star" | "shield" | "triangle" | "stripe" | "diamond";

/** The paint of one garment panel in full-print mode. */
export type FillSpec =
  | { kind: "solid"; color: string }
  | { kind: "gradient"; colors: string[]; angle: number }
  | { kind: "pattern"; pattern: PatternId; colors: string[]; scale: number; rotate: number }
  | { kind: "image"; src: string; path?: string; name?: string; mode: "tile" | "cover"; scale: number };

export type PanelId = "bodyFront" | "bodyBack" | "sleeves" | "trim";

interface LayerBase {
  id: string;
  side: Side;
  /** Centre of the layer, board units. */
  x: number;
  y: number;
  /** Degrees, clockwise. */
  rotation: number;
  opacity?: number;
}

export interface ImageLayer extends LayerBase {
  type: "image";
  /** Same-origin URL the browser can read (the ERP file through /erp-media). */
  src: string;
  /** The ERP upload path — ties the layer to the file sent with the enquiry. */
  path?: string;
  name?: string;
  w: number;
  h: number;
  /** Natural width / height of the picture. */
  ratio: number;
  lockRatio: boolean;
}

export interface TextLayer extends LayerBase {
  type: "text";
  text: string;
  font: FontId;
  /** Font size, board units. */
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  /** Letter spacing, hundredths of an em. */
  spacing: number;
  strokeColor: string;
  /** Outline width, percent of the font size (0 = none). */
  strokeWidth: number;
  /** Curve, -100 … 100 (100 = a half circle arching up). */
  arc: number;
  /** A placeholder for the names-and-numbers list. */
  bind?: "name" | "number";
}

export interface ShapeLayer extends LayerBase {
  type: "shape";
  shape: ShapeId;
  w: number;
  h: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
}

export type Layer = ImageLayer | TextLayer | ShapeLayer;

export interface DesignDoc {
  v: 1;
  mode: PrintMode;
  /** Bottom to top. */
  layers: Layer[];
  /** Full-print panel paints; an unset panel follows the garment colours. */
  fills: Partial<Record<PanelId, FillSpec>>;
  /** The uploads the design uses (kept so a restored design still sends its files). */
  assets: UploadedFile[];
}

export const emptyDoc = (mode: PrintMode = "simple"): DesignDoc => ({ v: 1, mode, layers: [], fills: {}, assets: [] });

export const isEmptyDoc = (d: DesignDoc): boolean => d.layers.length === 0 && Object.keys(d.fills).length === 0;

export interface Rect { x: number; y: number; w: number; h: number }
