import type { ReactNode } from "react";
import type { FillSpec, PanelId, PatternId } from "./types";
import type { MockupPaint } from "../components/ProductMockup";

/**
 * Repeatable sportswear patterns, drawn as SVG tiles so they recolour with the customer's own two or
 * three colours, scale and rotate — and so the PNG sent to the ERP carries them exactly as shown.
 * c[0] is the ground, c[1] the main motif, c[2] (where used) the accent.
 */

interface PatternDef {
  id: PatternId;
  label: string;
  w: number;
  h: number;
  /** How many colours the pattern uses. */
  colors: 2 | 3;
  tile: (c: string[]) => ReactNode;
}

export const PATTERNS: PatternDef[] = [
  {
    id: "stripes", label: "Stripes", w: 24, h: 24, colors: 3,
    tile: (c) => (<><rect width="24" height="24" fill={c[0]} /><rect width="24" height="10" fill={c[1]} /><rect y="10" width="24" height="2" fill={c[2]} /></>),
  },
  {
    id: "pinstripes", label: "Pinstripes", w: 16, h: 16, colors: 2,
    tile: (c) => (<><rect width="16" height="16" fill={c[0]} /><rect x="7" width="2" height="16" fill={c[1]} /></>),
  },
  {
    id: "diagonal", label: "Diagonal", w: 24, h: 24, colors: 2,
    tile: (c) => (<><rect width="24" height="24" fill={c[0]} /><path d="M0,24 L24,0 L24,12 L12,24 Z M0,0 L0,12 L12,0 Z" fill={c[1]} /></>),
  },
  {
    id: "chevron", label: "Chevron", w: 40, h: 20, colors: 2,
    tile: (c) => (<><rect width="40" height="20" fill={c[0]} /><path d="M0,10 L20,0 L40,10 L40,20 L20,10 L0,20 Z" fill={c[1]} /></>),
  },
  {
    id: "zigzag", label: "Zigzag", w: 20, h: 12, colors: 2,
    tile: (c) => (<><rect width="20" height="12" fill={c[0]} /><path d="M0,8 L5,3 L10,8 L15,3 L20,8" fill="none" stroke={c[1]} strokeWidth="2" /></>),
  },
  {
    id: "halftone", label: "Halftone", w: 16, h: 16, colors: 3,
    tile: (c) => (
      <>
        <rect width="16" height="16" fill={c[0]} />
        <circle cx="8" cy="8" r="4.5" fill={c[1]} />
        {[[0, 0], [16, 0], [0, 16], [16, 16]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill={c[2]} />)}
      </>
    ),
  },
  {
    id: "checker", label: "Checker", w: 32, h: 32, colors: 2,
    tile: (c) => (<><rect width="32" height="32" fill={c[0]} /><rect width="16" height="16" fill={c[1]} /><rect x="16" y="16" width="16" height="16" fill={c[1]} /></>),
  },
  {
    id: "triangles", label: "Geometric", w: 40, h: 40, colors: 3,
    tile: (c) => (
      <>
        <rect width="40" height="40" fill={c[0]} />
        <path d="M0,40 L20,0 L40,40 Z" fill={c[1]} />
        <path d="M14,34 L20,22 L26,34 Z" fill={c[2]} />
      </>
    ),
  },
  {
    id: "hexagon", label: "Hexagon", w: 56, h: 100, colors: 2,
    tile: (c) => (
      <>
        <rect width="56" height="100" fill={c[0]} />
        <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke={c[1]} strokeWidth="3" />
        <path d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" fill="none" stroke={c[1]} strokeWidth="3" />
      </>
    ),
  },
  {
    id: "waves", label: "Waves", w: 40, h: 20, colors: 2,
    tile: (c) => (<><rect width="40" height="20" fill={c[0]} /><path d="M0,10 Q10,2 20,10 T40,10 L40,16 Q30,8 20,16 T0,16 Z" fill={c[1]} /></>),
  },
  {
    id: "camo", label: "Camo", w: 80, h: 80, colors: 3,
    tile: (c) => (
      <>
        <rect width="80" height="80" fill={c[0]} />
        <path d="M6,10 C14,2 30,6 32,16 C34,26 22,30 14,28 C6,26 0,18 6,10 Z" fill={c[1]} />
        <path d="M44,38 C52,30 72,34 74,46 C76,58 60,64 50,58 C40,52 38,44 44,38 Z" fill={c[1]} />
        <path d="M10,52 C16,44 30,48 30,58 C30,70 16,74 10,66 C6,60 6,56 10,52 Z" fill={c[2]} />
        <path d="M46,6 C54,0 70,4 68,14 C66,22 54,24 48,18 C44,14 42,10 46,6 Z" fill={c[2]} />
      </>
    ),
  },
  {
    id: "brush", label: "Brush", w: 60, h: 30, colors: 3,
    tile: (c) => (
      <>
        <rect width="60" height="30" fill={c[0]} />
        <path d="M4,9 C16,5 30,12 44,7" fill="none" stroke={c[1]} strokeWidth="5" strokeLinecap="round" />
        <path d="M18,22 C28,18 40,25 56,20" fill="none" stroke={c[2]} strokeWidth="4" strokeLinecap="round" />
        <path d="M8,16 C12,15 16,16 20,15" fill="none" stroke={c[1]} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
];

export const patternById = (id: PatternId): PatternDef => PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];

/**
 * Continuity round the body (full print, "Continuous around the body"): the back panel's paint is the
 * front's moved one panel width along the unrolled strip, so it carries on across the side seams.
 *   shift   x offset of this panel's paint (back = −D, so back(x) = front(x + D));
 *   period  the circumference 2D — a repeating pattern is resized to fit it a whole number of times,
 *           so the back's right seam meets the front's left seam too;
 *   box     the whole strip in this panel's coordinates (gradients and a "fill" picture span it).
 */
export interface Continuity {
  shift: number;
  period: number;
  box?: { x: number; y: number; w: number; h: number };
}

/** A tile scale that repeats a whole number of times round the body (straight or right-angled patterns). */
export function wrapScale(base: number, scale: number, period: number): number {
  const k = Math.max(1, Math.round(period / (base * scale)));
  return period / (k * base);
}

/** The <defs> entry and the paint string of one fill. */
export function fillPaint(id: string, fill: FillSpec, cont?: Continuity): { def: ReactNode; paint: string } {
  const shift = cont?.shift ?? 0;
  const move = shift ? `translate(${shift} 0) ` : "";
  switch (fill.kind) {
    case "solid":
      return { def: null, paint: fill.color };
    case "gradient": {
      const stops = fill.colors.length > 1 ? fill.colors : [fill.colors[0] ?? "#000", fill.colors[0] ?? "#000"];
      const b = cont?.box;
      return {
        paint: `url(#${id})`,
        def: b ? (
          <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={b.x + b.w / 2} y1={b.y} x2={b.x + b.w / 2} y2={b.y + b.h}
            gradientTransform={`rotate(${fill.angle} ${b.x + b.w / 2} ${b.y + b.h / 2})`}>
            {stops.map((c, i) => <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />)}
          </linearGradient>
        ) : (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1" gradientTransform={`rotate(${fill.angle} 0.5 0.5)`}>
            {stops.map((c, i) => <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />)}
          </linearGradient>
        ),
      };
    }
    case "pattern": {
      const p = patternById(fill.pattern);
      const r = ((fill.rotate % 180) + 180) % 180;
      const scale = cont && (r === 0 || r === 90) ? wrapScale(r === 0 ? p.w : p.h, fill.scale, cont.period) : fill.scale;
      return {
        paint: `url(#${id})`,
        def: (
          <pattern key={id} id={id} patternUnits="userSpaceOnUse" width={p.w} height={p.h}
            patternTransform={`${move}rotate(${fill.rotate}) scale(${scale})`}>
            {p.tile(fill.colors)}
          </pattern>
        ),
      };
    }
    case "image":
      if (fill.mode === "cover") {
        const s = fill.scale;
        const b = cont?.box;
        if (b) {
          // One picture round the whole body: the tile IS the strip, so it repeats exactly once per turn.
          return {
            paint: `url(#${id})`,
            def: (
              <pattern key={id} id={id} patternUnits="userSpaceOnUse" x={b.x} y={b.y} width={b.w} height={b.h}>
                <image href={fill.src} x={(b.w * (1 - s)) / 2} y={(b.h * (1 - s)) / 2} width={b.w * s} height={b.h * s} preserveAspectRatio="xMidYMid slice" />
              </pattern>
            ),
          };
        }
        return {
          paint: `url(#${id})`,
          def: (
            <pattern key={id} id={id} patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">
              <image href={fill.src} x={(1 - s) / 2} y={(1 - s) / 2} width={s} height={s} preserveAspectRatio="xMidYMid slice" />
            </pattern>
          ),
        };
      }
      {
        const t = 80 * (cont ? wrapScale(80, fill.scale, cont.period) : fill.scale);
        return {
          paint: `url(#${id})`,
          def: (
            <pattern key={id} id={id} patternUnits="userSpaceOnUse" width={t} height={t} patternTransform={move || undefined}>
              <image href={fill.src} width={t} height={t} preserveAspectRatio="xMidYMid slice" />
            </pattern>
          ),
        };
      }
  }
}

/** Geometry of the body strip, for continuous fills (see wrap.ts). */
export interface StripGeometry { L: number; D: number; top: number; height: number }

/** All panel paints of a design, ready for ProductMockup's `paint` / `defs`. */
export function panelPaints(
  prefix: string, fills: Partial<Record<PanelId, FillSpec>>, strip?: StripGeometry | null,
): { paint: MockupPaint; defs: ReactNode[] } {
  const paint: MockupPaint = {};
  const defs: ReactNode[] = [];
  (Object.keys(fills) as PanelId[]).forEach((panel) => {
    const fill = fills[panel];
    if (!fill) return;
    let cont: Continuity | undefined;
    if (strip) {
      const period = 2 * strip.D;
      if (panel === "bodyFront") cont = { shift: 0, period, box: { x: strip.L, y: strip.top, w: period, h: strip.height } };
      else if (panel === "bodyBack") cont = { shift: -strip.D, period, box: { x: strip.L - strip.D, y: strip.top, w: period, h: strip.height } };
      // Sleeves do not wrap, but use the same pattern size as the body they are sewn to.
      else if (panel === "sleeves") cont = { shift: 0, period };
    }
    const { def, paint: p } = fillPaint(`${prefix}-${panel}`, fill, cont);
    paint[panel] = p;
    if (def) defs.push(def);
  });
  return { paint, defs };
}
