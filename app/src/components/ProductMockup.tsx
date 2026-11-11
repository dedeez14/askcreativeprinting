import { useId, useMemo, useState, type ReactNode, type Ref } from "react";
import { previewProductFor, type PreviewModel } from "../lib/previewProduct";

/**
 * Flat product mockup for the Online Design studio and the Get Quotation form.
 *
 * It replaced the WebGL preview (user, 1-Nov-2026): two 3D generations were turned down — the
 * procedural one looked stiff, the cloth-simulated one crumpled — and a print shop's customer wants
 * what every print-on-demand site shows instead: a clean, flat garment, front and back, in their
 * colours, with their artwork where it will be printed.
 *
 * Everything is SVG drawn here, so there is no model to load and no WebGL: it renders instantly,
 * on any phone, and never looks broken. The look of a real mockup comes from layers, bottom to top:
 * ground shadow → garment in the main colour → trims in the second colour → the customer's artwork,
 * clipped to the garment → shading, folds and weave drawn OVER the artwork, so the print sits in the
 * fabric instead of floating on it → outline and stitching.
 *
 * Selections drive the drawing: product → silhouette, sleeve → sleeve length, collar → neckline and
 * collar, colour → body, second colour → collar, cuffs, hem and side panels, fabric → weave and sheen.
 */

export interface ProductMockupProps {
  product: string;
  collar?: string;
  color?: string;
  secondaryColor?: string;
  sleeve?: string;
  fabric?: string;
  artworkUrl?: string;
  /** Which side to open on (the customer can flip it with the Front / Back buttons). */
  defaultSide?: "front" | "back";
  /** Controlled side — set by a caller that draws its own Front / Back switch (StudioPreview). */
  side?: "front" | "back";
  /** Draw the built-in Front / Back switch over the drawing (off when the caller has its own). */
  showToggle?: boolean;
  /**
   * Which side of a garment carries the artwork. Defaults to both; the studio passes the print
   * positions the customer ticked, so a logo chosen for the front does not also appear on the back.
   */
  artOn?: { front: boolean; back: boolean };
  /**
   * Paint per garment panel (any SVG paint — a colour or `url(#id)` of a gradient / pattern the caller
   * puts in `defs`). Used by the design editor's full-print mode; unset panels keep the colours.
   */
  paint?: MockupPaint;
  /** Extra <defs> (the gradients and patterns `paint` refers to). */
  defs?: ReactNode;
  /** The customer's design, drawn inside the garment and under the shading (local board units). */
  renderArt?: (ctx: MockupContext) => ReactNode;
  /** Drawn on top of everything, unclipped — the editor's handles and guides. */
  overlay?: (ctx: MockupContext) => ReactNode;
  svgRef?: Ref<SVGSVGElement>;
  /** Classes of the <svg> (default: 88 % of the frame height). */
  svgClassName?: string;
}

export interface MockupPaint {
  bodyFront?: string;
  bodyBack?: string;
  sleeves?: string;
  trim?: string;
}

/** What a design layer drawn into the mockup needs to know about the drawing. */
export interface MockupContext {
  side: Side;
  /** The garment silhouette (garments only) and the id of its clip path. */
  outline?: string;
  clipId?: string;
  sleeves?: string[];
  /** The body panel alone (the outline without the sleeves) — what wraps round at the side seams. */
  body?: string;
}

export type Side = "front" | "back";
type Sleeve = "sleeveless" | "short" | "threequarter" | "long";
type Neck = "round" | "v" | "polo" | "mandarin" | "shirt" | "hood" | "stand";

const W = 400;
const H = 440;
/** The board every mockup is drawn on, and the shift of a garment inside it (for the design editor). */
export const BOARD = { width: W, height: H, garmentOffsetY: 34 } as const;
/** Hem line of every garment: a tee is about 1.35× as long as it is wide. */
const HEM_Y = 336;

/* ─────────────────────────── colour ─────────────────────────── */

function validHex(c?: string): c is string {
  return /^#[0-9a-fA-F]{6}$/.test(c ?? "");
}

/** Shade a hex colour: -1 → black, +1 → white. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v: number) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Perceived lightness 0–1: a pale garment needs darker seams to stay readable. */
function lightness(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

/* ─────────────────────────── garment kinds ─────────────────────────── */

type GarmentSpec = {
  sleeve: Sleeve;
  neck: Neck;
  /** Body half-width at the hem (the shoulders stay put). */
  hem: number;
  placket?: "half" | "full" | "zip";
  pocket?: "chest" | "kangaroo";
  sidePanels?: boolean;
  ribbedHem?: boolean;
  /** Where the artwork goes on the front: chest centre, or the wearer's left chest (a logo). */
  frontPrint: "centre" | "logo";
  /**
   * The cut IS the product: a windbreaker or hoodie has long sleeves, a basketball jersey or a running
   * singlet none, whatever the sleeve list says. The studio form fills the sleeve with the first option
   * before the customer chooses (a windbreaker showed short sleeves on the live site, 1-Nov-2026).
   */
  fixedSleeve?: boolean;
};

const GARMENTS: Partial<Record<PreviewModel, GarmentSpec>> = {
  "T-Shirt":           { sleeve: "short", neck: "round", hem: 86, frontPrint: "centre" },
  "Polo Shirt":        { sleeve: "short", neck: "polo", hem: 86, placket: "half", frontPrint: "logo" },
  "Corporate Shirt":   { sleeve: "long", neck: "shirt", hem: 84, placket: "full", pocket: "chest", frontPrint: "logo" },
  "Hoodie":            { sleeve: "long", neck: "hood", hem: 88, pocket: "kangaroo", ribbedHem: true, frontPrint: "centre", fixedSleeve: true },
  "Windbreaker":       { sleeve: "long", neck: "stand", hem: 90, placket: "zip", ribbedHem: true, frontPrint: "logo", fixedSleeve: true },
  "Football Jersey":   { sleeve: "short", neck: "v", hem: 84, sidePanels: true, frontPrint: "centre" },
  "Basketball Jersey": { sleeve: "sleeveless", neck: "v", hem: 80, sidePanels: true, frontPrint: "centre", fixedSleeve: true },
  "Baseball Jersey":   { sleeve: "short", neck: "v", hem: 86, placket: "full", frontPrint: "centre" },
  "Running Singlet":   { sleeve: "sleeveless", neck: "round", hem: 76, frontPrint: "centre", fixedSleeve: true },
};

function sleeveFrom(choice: string | undefined, fallback: Sleeve): Sleeve {
  const s = (choice ?? "").toLowerCase();
  if (!s) return fallback;
  if (s.includes("sleeveless") || s.includes("singlet") || s.includes("tank")) return "sleeveless";
  if (s.includes("3/4") || s.includes("three") || s.includes("quarter")) return "threequarter";
  if (s.includes("long")) return "long";
  if (s.includes("short") || s.includes("raglan") || s.includes("cap")) return "short";
  return fallback;
}

/** The ERP's collar names are free text (Collar Type master): read them by what they describe. */
function neckFrom(choice: string | undefined, fallback: Neck): Neck {
  const c = (choice ?? "").toLowerCase();
  if (!c) return fallback;
  // A product whose neck IS its shape keeps it whatever the collar list says.
  if (fallback === "hood" || fallback === "stand" || fallback === "shirt") return fallback;
  if (c.includes("hood")) return "hood";
  if (c.includes("mandarin") || c.includes("chinese")) return "mandarin";
  if (/\bv\b|v-?neck/.test(c)) return "v";
  if (c.includes("polo") || c.includes("rib collar") || c.includes("body collar") || c.includes("shirt collar")) return "polo";
  if (c.includes("round") || c.includes("crew") || c.includes("retro") || c.includes("nfl") || c.includes("o-neck")) return "round";
  return fallback;
}

/* ─────────────────────────── garment geometry ─────────────────────────── */
/*
 * Drawn on a 400 × 440 board, centre line x = 200. Every point is given for the wearer's right
 * (the viewer's left) and mirrored, so the garment is always symmetrical.
 */

const mx = (x: number) => W - x;

/** The one line colour of every drawing — a tech flat is inked, whatever the garment colour. */
const INK = "#23261f";

type Geometry = {
  outline: string;
  body: string;
  sleeves: string[];
  cuffs: string[];
  armholes: string[];
  neckline: string;
  hemY: number;
  hemHalf: number;
};

function garmentGeometry(spec: GarmentSpec, sleeve: Sleeve, neck: Neck, side: Side): Geometry {
  const sleeveless = sleeve === "sleeveless";
  const neckX = sleeveless ? 150 : 160;
  const neckY = 50;
  const shoulder = sleeveless ? { x: 126, y: 60 } : { x: 98, y: 72 };
  const under = sleeveless ? { x: 116, y: 168 } : { x: 116, y: 142 };
  const hemY = HEM_Y;
  const hemL = 200 - spec.hem;

  // Neckline: deep at the front, shallow at the back; a V is two straight lines.
  const depth = side === "back" ? 62
    : neck === "v" ? 0
      : neck === "polo" || neck === "shirt" || neck === "stand" || neck === "mandarin" ? 72
        : neck === "hood" ? 74 : 92;
  const neckPath = side === "front" && neck === "v"
    ? `L200,${sleeveless ? 132 : 118} L${mx(neckX)},${neckY}`
    : `Q200,${depth} ${mx(neckX)},${neckY}`;

  // Sleeve end points (outer, inner) per length.
  const ends: Record<Exclude<Sleeve, "sleeveless">, [number, number, number, number]> = {
    short: [46, 146, 84, 172],
    threequarter: [34, 236, 72, 246],
    long: [28, 316, 64, 324],
  };

  const sleeves: string[] = [];
  const cuffs: string[] = [];
  const armholes: string[] = [];
  if (sleeveless) {
    // A singlet's armhole: from the narrow shoulder strap down and round to the underarm.
    armholes.push(
      `M${shoulder.x},${shoulder.y} C${shoulder.x - 14},${shoulder.y + 50} ${under.x - 18},${under.y - 30} ${under.x},${under.y}`,
      `M${mx(shoulder.x)},${shoulder.y} C${mx(shoulder.x - 14)},${shoulder.y + 50} ${mx(under.x - 18)},${under.y - 30} ${mx(under.x)},${under.y}`,
    );
  } else {
    const [ox, oy, ix, iy] = ends[sleeve];
    // Outer edge bows out a little, inner edge runs straight back to the underarm.
    sleeves.push(
      `M${shoulder.x},${shoulder.y} Q${(shoulder.x + ox) / 2 - 8},${(shoulder.y + oy) / 2} ${ox},${oy} L${ix},${iy} L${under.x},${under.y} Z`,
      `M${mx(shoulder.x)},${shoulder.y} Q${mx((shoulder.x + ox) / 2 - 8)},${(shoulder.y + oy) / 2} ${mx(ox)},${oy} L${mx(ix)},${iy} L${mx(under.x)},${under.y} Z`,
    );
    if (sleeve !== "short") {
      // A cuff band at the end of a long / three-quarter sleeve.
      const cx1 = ox + (shoulder.x - ox) * 0.012, cy1 = oy - 14;
      const cx2 = ix + (under.x - ix) * 0.05, cy2 = iy - 14;
      cuffs.push(`M${cx1},${cy1} L${ox},${oy} L${ix},${iy} L${cx2},${cy2} Z`);
      cuffs.push(`M${mx(cx1)},${cy1} L${mx(ox)},${oy} L${mx(ix)},${iy} L${mx(cx2)},${cy2} Z`);
    } else {
      // A short sleeve hem: a narrow band, same colour, read by its stitching.
      cuffs.push(`M${ox + 3},${oy - 8} L${ox},${oy} L${ix},${iy} L${ix + 2},${iy - 9} Z`);
      cuffs.push(`M${mx(ox + 3)},${oy - 8} L${mx(ox)},${oy} L${mx(ix)},${iy} L${mx(ix + 2)},${iy - 9} Z`);
    }
  }

  // Clockwise from the wearer's right neck point.
  const outline = [
    `M${neckX},${neckY}`,
    neckPath,
    `L${mx(shoulder.x)},${shoulder.y}`,
    sleeveless
      ? `C${mx(shoulder.x - 14)},${shoulder.y + 50} ${mx(under.x - 18)},${under.y - 30} ${mx(under.x)},${under.y}`
      : (() => {
        const [ox, oy, ix, iy] = ends[sleeve as Exclude<Sleeve, "sleeveless">];
        return `Q${mx((shoulder.x + ox) / 2 - 8)},${(shoulder.y + oy) / 2} ${mx(ox)},${oy} L${mx(ix)},${iy} L${mx(under.x)},${under.y}`;
      })(),
    `C${mx(under.x + 1)},${under.y + 80} ${mx(hemL - 2)},${hemY - 120} ${mx(hemL)},${hemY}`,
    `Q200,${hemY + 7} ${hemL},${hemY}`,
    `C${hemL - 2},${hemY - 120} ${under.x + 1},${under.y + 80} ${under.x},${under.y}`,
    sleeveless
      ? `C${under.x - 18},${under.y - 30} ${shoulder.x - 14},${shoulder.y + 50} ${shoulder.x},${shoulder.y}`
      : (() => {
        const [ox, oy, ix, iy] = ends[sleeve as Exclude<Sleeve, "sleeveless">];
        return `L${ix},${iy} L${ox},${oy} Q${(shoulder.x + ox) / 2 - 8},${(shoulder.y + oy) / 2} ${shoulder.x},${shoulder.y}`;
      })(),
    "Z",
  ].join(" ");

  const body = [
    `M${neckX},${neckY}`, neckPath, `L${mx(shoulder.x)},${shoulder.y}`,
    `L${mx(under.x)},${under.y}`,
    `C${mx(under.x + 1)},${under.y + 80} ${mx(hemL - 2)},${hemY - 120} ${mx(hemL)},${hemY}`,
    `Q200,${hemY + 7} ${hemL},${hemY}`,
    `C${hemL - 2},${hemY - 120} ${under.x + 1},${under.y + 80} ${under.x},${under.y}`,
    `L${shoulder.x},${shoulder.y} Z`,
  ].join(" ");

  return {
    outline,
    body,
    sleeves,
    cuffs,
    armholes,
    neckline: `M${neckX},${neckY} ${neckPath}`,
    hemY,
    hemHalf: spec.hem,
  };
}

/* ─────────────────────────── the garment ─────────────────────────── */

function Garment({
  spec, sleeve, neck, side, main, trim: trimColour, fabric, artworkUrl, paint, renderArt, overlay,
}: {
  spec: GarmentSpec; sleeve: Sleeve; neck: Neck; side: Side; main: string; trim: string; fabric: string; artworkUrl?: string;
  paint?: MockupPaint; renderArt?: (ctx: MockupContext) => ReactNode; overlay?: (ctx: MockupContext) => ReactNode;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = useMemo(() => garmentGeometry(spec, sleeve, neck, side), [spec, sleeve, neck, side]);
  const pale = lightness(main) > 0.72;
  const line = INK;
  const stitch = pale ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.32)";
  const f = fabric.toLowerCase();
  const sheen = /dry|micro|poly|satin|mesh/.test(f) ? 0.16 : /fleece|terry/.test(f) ? 0.04 : 0.08;

  // Where the print goes. A logo sits on the wearer's left chest (viewer's right).
  const art = side === "back"
    ? { x: 130, y: 92, w: 140, h: 160 }
    : spec.frontPrint === "logo"
      ? { x: 218, y: 100, w: 52, h: 52 }
      : { x: 140, y: neck === "v" ? 132 : 112, w: 120, h: 130 };

  const clip = `clip-${uid}`;
  // Panel paints: a full-print design can give the body, sleeves and trims their own fill.
  const body = (side === "back" ? paint?.bodyBack : paint?.bodyFront) ?? main;
  const sleevePaint = paint?.sleeves;
  const trim = paint?.trim ?? trimColour;
  /** Shading of trim details needs a colour, not a pattern. */
  const trimHex = validHex(paint?.trim) ? paint.trim : trimColour;
  const ctx: MockupContext = { side, outline: g.outline, clipId: clip, sleeves: g.sleeves, body: g.body };
  const shadeH = `sh-${uid}`, shadeV = `sv-${uid}`, glow = `gl-${uid}`;

  return (
    <g transform="translate(0,34)">
      <defs>
        <clipPath id={clip}><path d={g.outline} /></clipPath>
        <linearGradient id={shadeH} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.12" />
          <stop offset="0.22" stopColor="#000" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fff" stopOpacity={sheen * 0.8} />
          <stop offset="0.78" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={shadeV} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.10" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
        <filter id={glow}><feGaussianBlur stdDeviation="14" /></filter>
      </defs>

      {/* Hood behind the shoulders (front view) — drawn first so the body overlaps it. */}
      {neck === "hood" && side === "front" && (
        <path d="M148,62 C138,14 262,14 252,62 Z" fill={shade(main, -0.14)} stroke={line} strokeWidth="1.6" />
      )}

      {/* The garment in the main colour (or the body paint of a full-print design). */}
      <path d={g.outline} fill={body} />
      {sleevePaint && (
        <g clipPath={`url(#${clip})`}>
          {g.sleeves.map((d, i) => <path key={`sp${i}`} d={d} fill={sleevePaint} />)}
        </g>
      )}

      {/* Trims in the second colour. */}
      <g clipPath={`url(#${clip})`}>
        {g.cuffs.map((d, i) => (
          <path key={`c${i}`} d={d} fill={sleeve === "short" ? (sleevePaint ?? body) : trim} />
        ))}
        {spec.sidePanels && (() => {
          const u = sleeve === "sleeveless" ? 168 : 142, h = 200 - spec.hem;
          const left = `M116,${u} C118,${u + 70} ${h + 2},${HEM_Y - 100} ${h},${HEM_Y} L${h + 20},${HEM_Y} C${h + 20},${HEM_Y - 100} 136,${u + 70} 134,${u + 4} Z`;
          return (<>
            <path d={left} fill={trim} />
            <path d={left} fill={trim} transform={`translate(${W},0) scale(-1,1)`} />
          </>);
        })()}
        {spec.ribbedHem && (
          <path d={`M0,${g.hemY - 16} L${W},${g.hemY - 16} L${W},${H} L0,${H} Z`} fill={trim} />
        )}
      </g>

      {/* The customer's artwork, inside the garment, under the shading. */}
      {artworkUrl && (
        <g clipPath={`url(#${clip})`}>
          <image href={artworkUrl} x={art.x} y={art.y} width={art.w} height={art.h} preserveAspectRatio="xMidYMid meet" />
        </g>
      )}
      {renderArt && <g clipPath={`url(#${clip})`}>{renderArt(ctx)}</g>}

      {/* Details that belong to the cut. */}
      {side === "front" && spec.pocket === "kangaroo" && (
        <path d="M140,236 L260,236 L278,300 L122,300 Z" fill={body} stroke={line} strokeWidth="1.2" opacity="0.98" />
      )}
      {side === "front" && spec.pocket === "chest" && (
        <path d="M128,128 L170,128 L170,172 Q149,180 128,172 Z" fill={body} stroke={line} strokeWidth="1.1" />
      )}
      {side === "front" && spec.placket === "half" && (
        <>
          <rect x="191" y="70" width="18" height="78" rx="2" fill={shade(main, -0.06)} stroke={line} strokeWidth="1" />
          {[88, 110, 132].map((y) => <circle key={y} cx="200" cy={y} r="3.2" fill={shade(main, pale ? -0.35 : 0.35)} />)}
        </>
      )}
      {side === "front" && spec.placket === "full" && (
        <>
          <rect x="192" y={neck === "v" ? 116 : 70} width="16" height={HEM_Y - (neck === "v" ? 116 : 70)} fill={shade(main, -0.05)} stroke={line} strokeWidth="0.9" />
          {Array.from({ length: 5 }, (_, i) => (neck === "v" ? 134 : 92) + i * 46).map((y) => (
            <circle key={y} cx="200" cy={y} r="3" fill={shade(main, pale ? -0.35 : 0.35)} />
          ))}
        </>
      )}
      {side === "front" && spec.placket === "zip" && (
        <>
          <line x1="200" y1="58" x2="200" y2={HEM_Y} stroke={shade(trimHex, -0.2)} strokeWidth="3.2" />
          <line x1="200" y1="58" x2="200" y2={HEM_Y} stroke={shade(trimHex, 0.35)} strokeWidth="1" strokeDasharray="1.5 2.5" />
          <rect x="195" y="62" width="10" height="20" rx="3" fill={shade(trimHex, -0.3)} />
        </>
      )}

      {/* Shading OVER the print, so the print sits in the cloth: a soft fall-off at both sides, a shadow
          down each side seam and under each sleeve — the shapes a flat-lay garment actually shows. */}
      <g clipPath={`url(#${clip})`} pointerEvents="none">
        <rect width={W} height={H} fill={`url(#${shadeH})`} />
        <rect width={W} height={H} fill={`url(#${shadeV})`} />
        {(() => {
          const u = (sleeve === "sleeveless" ? 168 : 142), h = 200 - spec.hem;
          const sideShadow = `M${118},${u + 6} C124,${u + 70} ${h + 8},${HEM_Y - 110} ${h + 6},${HEM_Y} L${h + 26},${HEM_Y} C${h + 30},${HEM_Y - 120} 146,${u + 60} 132,${u + 6} Z`;
          return (<>
            <path d={sideShadow} fill="#000" opacity="0.07" />
            <path d={sideShadow} fill="#000" opacity="0.11" transform={`translate(${W},0) scale(-1,1)`} />
          </>);
        })()}
        {g.sleeves.map((d, i) => <path key={`s${i}`} d={d} fill="#000" opacity={i ? 0.08 : 0.04} />)}
        {sheen > 0.1 && <ellipse cx="170" cy="170" rx="46" ry="90" fill="#fff" opacity="0.10" filter={`url(#${glow})`} />}
      </g>

      {/* Seams: shoulders and armholes. */}
      {sleeve !== "sleeveless" && (
        <g fill="none" stroke={INK} strokeOpacity="0.45" strokeWidth="1">
          <path d="M98,72 Q114,106 116,142" />
          <path d={`M${mx(98)},72 Q${mx(114)},106 ${mx(116)},142`} />
        </g>
      )}

      {/* The inside of the back neck, seen through the front opening. */}
      {side === "front" && (neck === "round" || neck === "v") && (
        <path d={neck === "v" ? `M162,52 L200,${sleeve === "sleeveless" ? 128 : 114} L238,52 Q200,64 162,52 Z` : "M164,52 Q200,86 236,52 Q200,62 164,52 Z"}
          fill={shade(main, -0.38)} />
      )}

      {/* Neckline / collar. */}
      {(neck === "round" || neck === "v" || neck === "mandarin" || neck === "stand") && (() => {
        const wdt = neck === "stand" ? 16 : neck === "mandarin" ? 13 : 10;
        return (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={g.neckline} stroke={INK} strokeWidth={wdt + 2.4} />
            <path d={g.neckline} stroke={trim} strokeWidth={wdt} />
            <path d={g.neckline} stroke={stitch} strokeWidth="0.9" strokeDasharray="2.5 2.5" transform="translate(0,1)" />
          </g>
        );
      })()}
      {(neck === "polo" || neck === "shirt") && (
        side === "front" ? (
          <g stroke={line} strokeWidth="1.2" strokeLinejoin="round">
            <path d="M158,50 Q200,64 242,50 L240,58 Q200,72 160,58 Z" fill={shade(trimHex, -0.1)} />
            <path d={neck === "shirt" ? "M160,48 L199,76 L180,112 L144,66 Z" : "M160,48 L199,76 L184,104 L146,68 Z"} fill={trim} />
            <path d={neck === "shirt" ? "M240,48 L201,76 L220,112 L256,66 Z" : "M240,48 L201,76 L216,104 L254,68 Z"} fill={trim} />
          </g>
        ) : (
          <path d="M156,44 Q200,58 244,44 L244,62 Q200,76 156,62 Z" fill={trim} stroke={line} strokeWidth="1.2" />
        )
      )}
      {neck === "hood" && side === "front" && (
        <g>
          <path d="M162,54 C166,28 234,28 238,54 Q200,86 162,54 Z" fill={shade(main, -0.32)} />
          <path d="M162,54 Q200,86 238,54" fill="none" stroke={trim} strokeWidth="7" strokeLinecap="round" />
          <path d="M184,74 C183,96 181,116 180,134" stroke="#f5f5f2" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M216,74 C217,96 219,116 220,134" stroke="#f5f5f2" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <rect x="177.5" y="132" width="5" height="9" rx="1.5" fill="#cfcfc8" />
          <rect x="217.5" y="132" width="5" height="9" rx="1.5" fill="#cfcfc8" />
        </g>
      )}
      {neck === "hood" && side === "back" && (
        <g>
          <path d="M146,62 C144,26 256,26 254,62 C252,116 218,140 200,146 C182,140 148,116 146,62 Z" fill={shade(main, -0.06)} stroke={line} strokeWidth="1.6" />
          <path d="M200,32 C201,70 201,110 200,146" stroke={line} strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M146,62 C144,26 256,26 254,62 C252,116 218,140 200,146 C182,140 148,116 146,62 Z" fill="#000" opacity="0.06" />
        </g>
      )}

      {/* Armhole and neck bindings of a singlet. */}
      {g.armholes.map((d, i) => <path key={`a${i}`} d={d} fill="none" stroke={trim} strokeWidth="8" strokeLinecap="round" />)}

      {/* Outline and stitching. */}
      <path d={g.outline} fill="none" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <g fill="none" stroke={stitch} strokeWidth="1" strokeDasharray="3 3">
        <path d={`M${200 - g.hemHalf + 2},${g.hemY - 9} Q200,${g.hemY - 2} ${mx(200 - g.hemHalf + 2)},${g.hemY - 9}`} />
        <path d={`M${200 - g.hemHalf + 2},${g.hemY - 13} Q200,${g.hemY - 6} ${mx(200 - g.hemHalf + 2)},${g.hemY - 13}`} />
        {g.cuffs.map((d, i) => <path key={`cs${i}`} d={d} />)}
      </g>
      {overlay?.(ctx)}
    </g>
  );
}

/* ─────────────────────────── other products ─────────────────────────── */

function OtherProduct({ model, main, trim, artworkUrl }: { model: PreviewModel; main: string; trim: string; artworkUrl?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const line = INK;
  const cyl = `cy-${uid}`, clip = `oc-${uid}`;
  const Art = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) =>
    artworkUrl ? <image href={artworkUrl} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid meet" /> : null;
  const shadeDefs = (
    <linearGradient id={cyl} x1="0" x2="1">
      <stop offset="0" stopColor="#000" stopOpacity="0.28" />
      <stop offset="0.3" stopColor="#fff" stopOpacity="0.16" />
      <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity="0.32" />
    </linearGradient>
  );

  switch (model) {
    case "Mug": {
      const body = "M118,118 L272,118 L272,318 Q272,336 254,336 L136,336 Q118,336 118,318 Z";
      return (
        <g>
          <defs>{shadeDefs}<clipPath id={clip}><path d={body} /></clipPath></defs>
          <path d="M272,160 C338,156 338,300 272,292" fill="none" stroke={main} strokeWidth="20" strokeLinecap="round" />
          <path d="M272,160 C338,156 338,300 272,292" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="20" strokeLinecap="round" />
          <path d={body} fill={main} />
          <g clipPath={`url(#${clip})`}>
            <Art x={138} y={150} w={114} h={160} />
            <rect x="110" y="110" width="170" height="240" fill={`url(#${cyl})`} />
          </g>
          <ellipse cx="195" cy="118" rx="77" ry="13" fill={shade(main, -0.25)} stroke={line} strokeWidth="1.4" />
          <ellipse cx="195" cy="120" rx="68" ry="9" fill={shade(main, -0.45)} />
          <path d={body} fill="none" stroke={line} strokeWidth="1.5" />
        </g>
      );
    }
    case "Cap": {
      const crown = "M104,262 C100,128 300,128 296,262 Z";
      return (
        <g>
          <defs>{shadeDefs}<clipPath id={clip}><path d={crown} /></clipPath></defs>
          <path d={crown} fill={main} />
          <g clipPath={`url(#${clip})`}>
            <Art x={158} y={172} w={84} h={70} />
            <rect x="100" y="120" width="200" height="150" fill={`url(#${cyl})`} />
            <g stroke={line} strokeWidth="1" opacity="0.6" fill="none">
              <path d="M200,162 C188,196 174,232 166,262" /><path d="M200,162 C212,196 226,232 234,262" />
              <path d="M200,162 C164,184 132,224 118,262" /><path d="M200,162 C236,184 268,224 282,262" />
            </g>
          </g>
          <circle cx="200" cy="163" r="5.5" fill={shade(main, -0.2)} stroke={line} />
          <path d="M98,254 Q200,244 302,254 Q298,280 200,286 Q102,280 98,254 Z" fill={trim} stroke={line} strokeWidth="1.6" />
          <path d="M110,262 Q200,254 290,262" fill="none" stroke={line} strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 3" />
          <path d={crown} fill="none" stroke={line} strokeWidth="1.5" />
        </g>
      );
    }
    case "Lanyard":
      return (
        <g>
          <path d="M150,24 L190,246" stroke={main} strokeWidth="22" strokeLinecap="round" />
          <path d="M250,24 L210,246" stroke={shade(main, -0.12)} strokeWidth="22" strokeLinecap="round" />
          <rect x="186" y="238" width="28" height="22" rx="4" fill="#b9bcc2" stroke="#7d828a" />
          <path d="M200,260 L200,282" stroke="#7d828a" strokeWidth="4" />
          <rect x="140" y="280" width="120" height="150" rx="10" fill="#fff" stroke="#d6d6d0" strokeWidth="1.5" />
          <rect x="182" y="290" width="36" height="6" rx="3" fill="#e5e5e0" />
          <Art x={154} y={306} w={92} h={110} />
        </g>
      );
    case "Banner":
    case "Bunting":
      if (model === "Bunting") {
        const flags = [0, 1, 2, 3, 4].map((i) => {
          const x = 52 + i * 74;
          const y = 98 + Math.sin((i / 4) * Math.PI) * 34;
          return { x, y, fill: i % 2 ? trim : main };
        });
        return (
          <g>
            <path d="M24,92 Q200,170 376,92" fill="none" stroke="#8b8f86" strokeWidth="2.5" />
            {flags.map((fl, i) => (
              <g key={i}>
                <defs><clipPath id={`${clip}${i}`}><path d={`M${fl.x - 30},${fl.y} L${fl.x + 30},${fl.y} L${fl.x},${fl.y + 92} Z`} /></clipPath></defs>
                <path d={`M${fl.x - 30},${fl.y} L${fl.x + 30},${fl.y} L${fl.x},${fl.y + 92} Z`} fill={fl.fill} stroke={shade(fl.fill, -0.35)} strokeWidth="1.2" />
                <g clipPath={`url(#${clip}${i})`}><Art x={fl.x - 22} y={fl.y + 4} w={44} h={44} /></g>
              </g>
            ))}
          </g>
        );
      }
      return (
        <g>
          <rect x="34" y="96" width="332" height="236" rx="3" fill={main} stroke={line} strokeWidth="1.5" />
          <Art x={56} y={116} w={288} h={196} />
          {[[46, 108], [354, 108], [46, 320], [354, 320]].map(([x, y]) => (
            <g key={`${x}${y}`}><circle cx={x} cy={y} r="6" fill="#d9dbd6" stroke="#8b8f86" /><circle cx={x} cy={y} r="2.6" fill="#fff" /></g>
          ))}
        </g>
      );
    case "Sticker":
      return (
        <g>
          <rect x="104" y="104" width="192" height="210" rx="26" fill="#fff" stroke="#dcdcd6" strokeWidth="1.5" />
          <rect x="116" y="116" width="168" height="186" rx="18" fill={main} />
          <Art x={128} y={128} w={144} h={162} />
          <path d="M296,262 L296,288 Q296,314 270,314 L244,314 Z" fill="#ecece6" stroke="#d0d0ca" />
        </g>
      );
    default: {
      // Premium gift — shown as a printed tote bag, the most common carrier of a logo.
      const bag = "M108,168 L292,168 L300,404 L100,404 Z";
      return (
        <g>
          <defs>{shadeDefs}<clipPath id={clip}><path d={bag} /></clipPath></defs>
          <path d="M150,170 C150,96 250,96 250,170" fill="none" stroke={trim} strokeWidth="12" />
          <path d={bag} fill={main} />
          <g clipPath={`url(#${clip})`}>
            <Art x={140} y={220} w={120} h={140} />
            <rect x="96" y="160" width="208" height="250" fill={`url(#${cyl})`} opacity="0.6" />
          </g>
          <path d={bag} fill="none" stroke={line} strokeWidth="1.5" />
        </g>
      );
    }
  }
}

/**
 * True when the product's neckline is part of the product (a hood, a stand collar, a shirt collar), so a
 * collar label from the form would describe something the mockup does not show.
 */
export function hasOwnNeck(product: string): boolean {
  const spec = GARMENTS[previewProductFor(product) ?? "T-Shirt"];
  return !!spec && (spec.neck === "hood" || spec.neck === "stand" || spec.neck === "shirt");
}

/** What the design editor needs to know about a product's drawing. */
export function mockupInfo(product: string): {
  model: PreviewModel; garment: boolean; frontPrint?: "centre" | "logo"; vNeck: boolean; sleeveless: boolean;
  /** Body half-width at the hem (the side seams sit at 200 ± hem). */
  hem: number;
} {
  const model = previewProductFor(product) ?? "T-Shirt";
  const spec = GARMENTS[model];
  return {
    model,
    garment: !!spec,
    frontPrint: spec?.frontPrint,
    vNeck: spec?.neck === "v",
    sleeveless: spec?.sleeve === "sleeveless" && !!spec.fixedSleeve,
    hem: spec?.hem ?? 86,
  };
}

/* ─────────────────────────── the mockup ─────────────────────────── */

/** Where each product's ground shadow sits (its lowest point + a little). Bunting hangs: no shadow. */
const SHADOW: Record<string, number | undefined> = {
  garment: HEM_Y + 34 + 16, Mug: 346, Cap: 312, Lanyard: 436, Banner: 344, Sticker: 326, "Premium Gift": 414,
};

export default function ProductMockup({
  product, collar, color = "#1d4ed8", secondaryColor, sleeve, fabric = "", artworkUrl, defaultSide = "front",
  side: sideProp, showToggle = true, artOn, paint, defs, renderArt, overlay, svgRef,
  svgClassName = "h-[88%] w-auto max-w-full",
}: ProductMockupProps) {
  const [ownSide, setSide] = useState<Side>(defaultSide);
  const side = sideProp ?? ownSide;
  const artHere = !artOn || artOn[side];
  const model = previewProductFor(product) ?? "T-Shirt";
  const spec = GARMENTS[model];
  const main = validHex(color) ? color : "#1d4ed8";
  const trim = validHex(secondaryColor) ? secondaryColor : shade(main, lightness(main) > 0.6 ? -0.22 : 0.18);

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={svgClassName} role="img"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`${model}${spec ? `, ${side} view` : ""}`}>
        {defs && <defs>{defs}</defs>}
        {/* Ground shadow just under the product, so it stands on the board instead of floating. */}
        {SHADOW[spec ? "garment" : model] && (
          <ellipse cx="200" cy={SHADOW[spec ? "garment" : model]} rx={spec ? 120 : 96} ry="8" fill="#000" opacity="0.10" style={{ filter: "blur(4px)" }} />
        )}
        {spec
          ? <Garment spec={spec} sleeve={spec.fixedSleeve ? spec.sleeve : sleeveFrom(sleeve, spec.sleeve)} neck={neckFrom(collar, spec.neck)}
              side={side} main={main} trim={trim} fabric={fabric} artworkUrl={artHere ? artworkUrl : undefined}
              paint={paint} renderArt={renderArt} overlay={overlay} />
          : (
            <>
              <OtherProduct model={model} main={main} trim={trim} artworkUrl={artworkUrl} />
              {renderArt?.({ side: "front" })}
              {overlay?.({ side: "front" })}
            </>
          )}
      </svg>

      {spec && showToggle && (
        <div className="absolute bottom-3 right-3 flex rounded-md bg-white/90 backdrop-blur p-0.5 shadow-sm" role="group" aria-label="View">
          {(["front", "back"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setSide(s)} aria-pressed={side === s}
              className={`px-3 py-1 text-[11px] font-body rounded capitalize transition-colors ${side === s ? "bg-forest-900 text-white" : "text-forest-900/70 hover:text-forest-900"}`}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
