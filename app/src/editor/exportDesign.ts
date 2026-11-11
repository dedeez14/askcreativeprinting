import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import DesignStage, { type GarmentLook } from "./DesignStage";
import { embeddedFontCss, ensureFont, fontById, toDataUrl } from "./fonts";
import { layerBox } from "./geometry";
import { patternById } from "./patterns";
import { fullPrintAllowed, printArea } from "./printAreas";
import { BOARD, mockupInfo } from "../components/ProductMockup";
import type { DesignDoc, FillSpec, Layer, PanelId, Side, TextLayer } from "./types";

/**
 * What leaves the browser when the design is sent: one PNG per designed side (garment + design,
 * 1600 px wide) and a JSON description precise enough for ASK Creative's designer to rebuild it.
 */

export const sidesWithDesign = (doc: DesignDoc, product: string): Side[] => {
  const sides: Side[] = mockupInfo(product).garment ? ["front", "back"] : ["front"];
  return sides.filter((s) => doc.layers.some((l) => l.side === s)
    || (doc.mode === "full" && Object.keys(doc.fills).length > 0));
};

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** The garment and design of one side as a PNG — drawn off screen, never from the live editor. */
export async function renderSidePng(look: GarmentLook, doc: DesignDoc, side: Side, width = 1600): Promise<Blob | null> {
  const texts = doc.layers.filter((l): l is TextLayer => l.type === "text" && l.side === side);
  await Promise.all(texts.map((t) => ensureFont(t.font, t.bold, t.italic)));

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${BOARD.width}px;height:${BOARD.height}px;pointer-events:none;opacity:0;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(createElement(DesignStage, { ...look, doc, side, idPrefix: `x${side}`, svgClassName: "w-full h-full" }));
    });
    await nextFrame();
    await nextFrame();
    const svg = host.querySelector("svg");
    if (!svg) return null;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll("[data-ui]").forEach((n) => n.remove());
    const height = Math.round((width * BOARD.height) / BOARD.width);
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.removeAttribute("class");

    // Pictures must be inside the file: an SVG drawn as an image loads nothing from outside.
    const cache = new Map<string, string>();
    for (const img of Array.from(clone.querySelectorAll("image"))) {
      const href = img.getAttribute("href") ?? img.getAttribute("xlink:href") ?? "";
      if (!href || href.startsWith("data:")) continue;
      try {
        if (!cache.has(href)) cache.set(href, await toDataUrl(href));
        img.setAttribute("href", cache.get(href)!);
      } catch {
        img.remove();
      }
    }
    const css = await embeddedFontCss(texts.map((t) => ({ font: t.font, bold: t.bold, italic: t.italic })));
    if (css) {
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = css;
      clone.insertBefore(style, clone.firstChild);
    }

    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const pic = new Image();
      pic.decoding = "sync";
      await new Promise<void>((resolve, reject) => {
        pic.onload = () => resolve();
        pic.onerror = () => reject(new Error("preview"));
        pic.src = url;
      });
      // Safari may paint an SVG's embedded fonts a moment after the image reports loaded.
      await new Promise((r) => setTimeout(r, 120));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#F0F4F1";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(pic, 0, 0, width, height);
      return await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  } finally {
    root.unmount();
    host.remove();
  }
}

/* ─────────────────────────── the JSON for the designer ─────────────────────────── */

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const r1 = (n: number) => Math.round(n * 10) / 10;

export interface ExportContext {
  product: string;
  /** Upload paths in the order they are sent as `artwork` — gives each picture its artwork_index. */
  artworkPaths: string[];
  garmentColors: { main: string; secondary?: string };
}

function fillJson(fill: FillSpec, artworkPaths: string[]) {
  switch (fill.kind) {
    case "solid": return { type: "solid", color: fill.color };
    case "gradient": return { type: "gradient", colors: fill.colors, angle_deg: fill.angle };
    case "pattern": return {
      type: "pattern", pattern: fill.pattern, pattern_name: patternById(fill.pattern).label,
      colors: fill.colors, scale: r3(fill.scale), rotation_deg: fill.rotate,
    };
    case "image": return {
      type: "image", fit: fill.mode, scale: r3(fill.scale), file_name: fill.name ?? null, path: fill.path ?? null,
      artwork_index: fill.path ? (artworkPaths.indexOf(fill.path) >= 0 ? artworkPaths.indexOf(fill.path) : null) : null,
    };
  }
}

function layerJson(l: Layer, z: number, ctx: ExportContext, mode: DesignDoc["mode"]) {
  const a = printArea(ctx.product, l.side, mode);
  const { w, h } = layerBox(l);
  const base = {
    id: l.id,
    side: l.side,
    type: l.type,
    z,
    // Print-area-relative (0 = left/top edge of the print area, 1 = right/bottom edge), box before rotation.
    x: r3((l.x - w / 2 - a.x) / a.w),
    y: r3((l.y - h / 2 - a.y) / a.h),
    w: r3(w / a.w),
    h: r3(h / a.h),
    center_x: r3((l.x - a.x) / a.w),
    center_y: r3((l.y - a.y) / a.h),
    rotation_deg: r1(l.rotation),
    opacity: l.opacity ?? 1,
    board: { cx: r1(l.x), cy: r1(l.y), w: r1(w), h: r1(h) },
  };
  if (l.type === "image") {
    const idx = l.path ? ctx.artworkPaths.indexOf(l.path) : -1;
    return { ...base, file_name: l.name ?? null, path: l.path ?? null, artwork_index: idx >= 0 ? idx : null, keep_ratio: l.lockRatio };
  }
  if (l.type === "text") {
    return {
      ...base,
      text: l.text,
      bind: l.bind ?? null,
      font: fontById(l.font).label,
      font_size_rel: r3(l.size / a.h),
      bold: l.bold, italic: l.italic, align: l.align,
      color: l.color,
      letter_spacing_em: r3(l.spacing / 100),
      outline: l.strokeWidth > 0 ? { color: l.strokeColor, width_pct_of_size: l.strokeWidth } : null,
      arc: l.arc,
    };
  }
  return { ...base, shape: l.shape, color: l.color, outline: l.strokeWidth > 0 ? { color: l.strokeColor, width: l.strokeWidth } : null };
}

export interface DesignJson {
  contract: "ask-design-editor-v1";
  [key: string]: unknown;
}

export function buildDesignJson(doc: DesignDoc, ctx: ExportContext): DesignJson {
  const info = mockupInfo(ctx.product);
  const sides: Side[] = info.garment ? ["front", "back"] : ["front"];
  const z: Record<string, number> = {};
  const layers = doc.layers.map((l) => {
    z[l.side] = (z[l.side] ?? -1) + 1;
    return layerJson(l, z[l.side], ctx, doc.mode);
  });
  const panels: PanelId[] = ["bodyFront", "bodyBack", "sleeves", "trim"];
  return {
    contract: "ask-design-editor-v1",
    product: ctx.product,
    mockup: info.model,
    mode: doc.mode === "full" ? "full_print" : "print_area",
    full_print_available: fullPrintAllowed(ctx.product),
    units: "Positions x/y/w/h/center are fractions of the print area of their side (0–1, from its top-left corner; the box before rotation). font_size_rel is a fraction of the print-area height. board = mockup units (400 × 440 board).",
    garment_colors: ctx.garmentColors,
    print_areas: Object.fromEntries(sides.map((s) => {
      const a = printArea(ctx.product, s, doc.mode);
      return [s, { board: { x: a.x, y: a.y, w: a.w, h: a.h }, clip: doc.mode === "full" && info.garment ? "garment_silhouette" : "rectangle" }];
    })),
    fills: doc.mode === "full"
      ? Object.fromEntries(panels.filter((p) => doc.fills[p]).map((p) => [p, fillJson(doc.fills[p]!, ctx.artworkPaths)]))
      : {},
    layers,
  };
}

/** A short plain-text reading of the design, for the notes the sales team reads first. */
export function designSummary(doc: DesignDoc, product: string): string {
  if (doc.layers.length === 0 && !(doc.mode === "full" && Object.keys(doc.fills).length)) return "";
  const out: string[] = [`Online editor (${doc.mode === "full" ? "full print" : "print area"}):`];
  if (doc.mode === "full") {
    const names: Record<PanelId, string> = { bodyFront: "front body", bodyBack: "back body", sleeves: "sleeves", trim: "collar/trims" };
    (Object.keys(doc.fills) as PanelId[]).forEach((p) => {
      const f = doc.fills[p]!;
      out.push(`- ${names[p]}: ${f.kind === "pattern" ? `${patternById(f.pattern).label} pattern ${f.colors.join("/")}` : f.kind === "gradient" ? `gradient ${f.colors.join(" → ")}` : f.kind === "image" ? `image ${f.name ?? ""} (${f.mode})` : f.color}`);
    });
  }
  for (const side of ["front", "back"] as Side[]) {
    const ls = doc.layers.filter((l) => l.side === side);
    if (!ls.length) continue;
    const a = printArea(product, side, doc.mode);
    out.push(`- ${side}: ${ls.map((l) => {
      const pos = `@${Math.round(((l.x - a.x) / a.w) * 100)}%,${Math.round(((l.y - a.y) / a.h) * 100)}%`;
      if (l.type === "text") return `${l.bind ? `[${l.bind.toUpperCase()}] ` : ""}"${l.text.replace(/\s+/g, " ").slice(0, 40)}" ${fontById(l.font).label} ${l.color}${l.strokeWidth ? ` outline ${l.strokeColor}` : ""} ${pos}`;
      if (l.type === "image") return `image ${l.name ?? ""} ${pos}`;
      return `${l.shape} ${l.color} ${pos}`;
    }).join("; ")}`);
  }
  return out.join("\n");
}
