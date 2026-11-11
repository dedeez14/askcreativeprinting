import { useCallback, useRef, useState } from "react";
import { layerBounds } from "./geometry";
import { defaultSpot, printArea } from "./printAreas";
import type { DesignDoc, ImageLayer, Layer, PrintMode, Rect, ShapeId, ShapeLayer, Side, TextLayer } from "./types";

/* ─────────────── undo / redo ─────────────── */

export type Update = (fn: (d: DesignDoc) => DesignDoc, key?: string) => void;

interface History { past: DesignDoc[]; present: DesignDoc; future: DesignDoc[] }

/**
 * The design with its history. A change carrying the same `key` as the one before it is folded into
 * that step — a whole drag is one undo step (keys starting "g:" are gestures), and so is a burst of
 * typing or a slider being dragged (same key within a second).
 */
export function useDesignHistory(initial: () => DesignDoc) {
  const [h, setH] = useState<History>(() => ({ past: [], present: initial(), future: [] }));
  const last = useRef({ key: "", t: 0 });

  const update: Update = useCallback((fn, key) => {
    const now = Date.now();
    const fold = !!key && key === last.current.key && (key.startsWith("g:") || now - last.current.t < 1000);
    last.current = { key: key ?? "", t: now };
    setH((s) => {
      const next = fn(s.present);
      if (next === s.present) return s;
      return fold
        ? { past: s.past, present: next, future: [] }
        : { past: [...s.past.slice(-80), s.present], present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = { key: "", t: 0 };
    setH((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s));
  }, []);
  const redo = useCallback(() => {
    last.current = { key: "", t: 0 };
    setH((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s));
  }, []);
  /** Replace the whole design (a restore or "Start over") — not an undo step. */
  const reset = useCallback((doc: DesignDoc) => {
    last.current = { key: "", t: 0 };
    setH({ past: [], present: doc, future: [] });
  }, []);

  return { doc: h.present, update, undo, redo, reset, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
}

/* ─────────────── layer operations ─────────────── */

export const newId = (): string => Math.random().toString(36).slice(2, 10);

export const patchLayer = (id: string, patch: Partial<Layer>) => (d: DesignDoc): DesignDoc => ({
  ...d,
  layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)),
});

export const setLayer = (layer: Layer) => (d: DesignDoc): DesignDoc => ({
  ...d,
  layers: d.layers.map((l) => (l.id === layer.id ? layer : l)),
});

export const removeLayer = (id: string) => (d: DesignDoc): DesignDoc => ({ ...d, layers: d.layers.filter((l) => l.id !== id) });

export const addLayer = (layer: Layer) => (d: DesignDoc): DesignDoc => ({ ...d, layers: [...d.layers, layer] });

/** Move a layer one step up (+1) or down (-1) among the layers of its own side. */
export const reorder = (id: string, dir: 1 | -1) => (d: DesignDoc): DesignDoc => {
  const i = d.layers.findIndex((l) => l.id === id);
  if (i < 0) return d;
  const side = d.layers[i].side;
  let j = i + dir;
  while (j >= 0 && j < d.layers.length && d.layers[j].side !== side) j += dir;
  if (j < 0 || j >= d.layers.length) return d;
  const layers = [...d.layers];
  [layers[i], layers[j]] = [layers[j], layers[i]];
  return { ...d, layers };
};

export const duplicateLayer = (id: string, newLayerId: string) => (d: DesignDoc): DesignDoc => {
  const i = d.layers.findIndex((l) => l.id === id);
  if (i < 0) return d;
  const copy = { ...d.layers[i], id: newLayerId, x: d.layers[i].x + 12, y: d.layers[i].y + 12 } as Layer;
  const layers = [...d.layers];
  layers.splice(i + 1, 0, copy);
  return { ...d, layers };
};

/**
 * Keep a layer inside the printable zone: wholly inside when it fits, else with its centre inside
 * (a big full-print graphic may run off the garment — the silhouette clips it).
 */
export function constrain<T extends Layer>(layer: T, area: Rect): T {
  const b = layerBounds(layer);
  let dx = 0, dy = 0;
  if (b.w <= area.w) {
    if (b.x < area.x) dx = area.x - b.x;
    else if (b.x + b.w > area.x + area.w) dx = area.x + area.w - (b.x + b.w);
  } else {
    dx = Math.min(Math.max(layer.x, area.x), area.x + area.w) - layer.x;
  }
  if (b.h <= area.h) {
    if (b.y < area.y) dy = area.y - b.y;
    else if (b.y + b.h > area.y + area.h) dy = area.y + area.h - (b.y + b.h);
  } else {
    dy = Math.min(Math.max(layer.y, area.y), area.y + area.h) - layer.y;
  }
  return dx || dy ? { ...layer, x: layer.x + dx, y: layer.y + dy } : layer;
}

/** True when part of the layer lies outside the zone (shown after a product switch). */
export function outside(layer: Layer, area: Rect): boolean {
  const b = layerBounds(layer);
  const t = 1;
  return b.x < area.x - t || b.y < area.y - t || b.x + b.w > area.x + area.w + t || b.y + b.h > area.y + area.h + t;
}

/* ─────────────── new layers ─────────────── */

interface Where { product: string; side: Side; mode: PrintMode }

export function makeImage(w: Where, src: string, ratio: number, extra: Partial<ImageLayer> = {}): ImageLayer {
  const spot = defaultSpot(w.product, w.side, w.mode);
  const area = printArea(w.product, w.side, w.mode);
  let width = spot.w, height = width / ratio;
  const maxH = area.h * 0.6;
  if (height > maxH) { height = maxH; width = height * ratio; }
  return constrain({
    id: newId(), type: "image", side: w.side, x: spot.x, y: spot.y, rotation: 0,
    src, w: width, h: height, ratio, lockRatio: true, ...extra,
  }, area);
}

export function makeText(w: Where, text: string, extra: Partial<TextLayer> = {}): TextLayer {
  const spot = defaultSpot(w.product, w.side, w.mode);
  return {
    id: newId(), type: "text", side: w.side, x: spot.x, y: spot.y, rotation: 0,
    text, font: "anton", size: 30, color: "#ffffff", bold: false, italic: false, align: "center",
    spacing: 2, strokeColor: "#0d1f16", strokeWidth: 0, arc: 0, ...extra,
  };
}

export function makeShape(w: Where, shape: ShapeId, color: string): ShapeLayer {
  const spot = defaultSpot(w.product, w.side, w.mode);
  const size = shape === "stripe" ? { w: Math.min(140, printArea(w.product, w.side, w.mode).w), h: 14 } : { w: 60, h: shape === "shield" ? 70 : 60 };
  return {
    id: newId(), type: "shape", side: w.side, x: spot.x, y: spot.y + (shape === "stripe" ? 60 : 0), rotation: 0,
    shape, ...size, color, strokeColor: "#0d1f16", strokeWidth: 0,
  };
}

/* ─────────────── autosave ─────────────── */

const KEY = "ask-design:v1:";

export function loadDoc(product: string): DesignDoc | null {
  try {
    const raw = localStorage.getItem(KEY + product.toLowerCase());
    if (!raw) return null;
    const d = JSON.parse(raw) as DesignDoc;
    return d && d.v === 1 && Array.isArray(d.layers) ? { ...d, fills: d.fills ?? {}, assets: d.assets ?? [] } : null;
  } catch {
    return null;
  }
}

export function saveDoc(product: string, doc: DesignDoc | null): void {
  try {
    if (!doc) localStorage.removeItem(KEY + product.toLowerCase());
    else localStorage.setItem(KEY + product.toLowerCase(), JSON.stringify(doc));
  } catch { /* private mode / full storage: the design simply is not kept */ }
}

/** Width / height of a picture (1 when the browser cannot tell, e.g. an SVG without a size). */
export function imageRatio(src: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1);
    img.onerror = () => resolve(1);
    img.src = src;
  });
}
