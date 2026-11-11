import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Copy, Trash2, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import ProductMockup, { type MockupContext } from "../components/ProductMockup";
import { LayerView } from "./layers";
import { layerBox } from "./geometry";
import { useFontVersion } from "./fonts";
import { panelPaints } from "./patterns";
import { printArea } from "./printAreas";
import { duplicateLayer, newId, outside, removeLayer, reorder, setLayer, type Update } from "./state";
import { layersOnView, onBody, place, wrapsFor } from "./wrap";
import type { DesignDoc, Layer, Side } from "./types";

/**
 * The garment with the customer's design on it — and, when `interactive`, the editor itself:
 * tap to select, drag to move, corner handles to resize, the round handle to rotate, pinch with two
 * fingers, snapping to the centre lines of the print area, whose outline is shown while editing.
 *
 * Everything is SVG in the mockup's own board units, so the handles, the PNG export and the ERP
 * JSON all share one coordinate system. The handles are drawn at a constant SCREEN size (their
 * board size follows the zoom) with a 44 px touch target.
 */

export interface GarmentLook {
  product: string;
  collar?: string;
  color?: string;
  secondaryColor?: string;
  sleeve?: string;
  fabric?: string;
}

export interface DesignStageProps extends GarmentLook {
  doc: DesignDoc;
  side: Side;
  /** Unique per mounted stage — keeps the SVG ids of two stages on one page apart. */
  idPrefix: string;
  interactive?: boolean;
  update?: Update;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** Read-only stage: what a tap does (open the full-screen editor). */
  onRequestEdit?: () => void;
  svgClassName?: string;
  /** Stop the page scrolling under a finger anywhere on the stage (the full-screen editor). */
  lockTouch?: boolean;
  /** Ids drawn with a warning outline (outside the print area after a product switch). */
  warnIds?: string[];
  svgRef?: React.Ref<SVGSVGElement>;
}

/* `shift` = where the layer is drawn on this view relative to its own coordinates (non-zero when
   the customer grabs the part of a layer that wrapped round from the other side). */
type Gesture =
  | { kind: "move"; pointerId: number; key: string; start: DOMPoint; orig: Layer; shift: number }
  | { kind: "scale"; pointerId: number; key: string; start: DOMPoint; orig: Layer; shift: number }
  | { kind: "stretch"; pointerId: number; key: string; axis: "x" | "y"; orig: Layer; shift: number }
  | { kind: "rotate"; pointerId: number; key: string; orig: Layer; shift: number }
  | { kind: "pinch"; key: string; orig: Layer; dist: number; angle: number; mid: { x: number; y: number } };

const MIN = 6;

/** A layer scaled by `f` about its centre. */
function scaled(l: Layer, f: number): Layer {
  if (l.type === "text") return { ...l, size: Math.min(400, Math.max(MIN, l.size * f)) };
  const w = Math.max(MIN, l.w * f), h = Math.max(MIN, l.h * f);
  return { ...l, w, h };
}

export default function DesignStage({
  doc, side, idPrefix, interactive = false, update, selectedId = null, onSelect, onRequestEdit,
  svgClassName, lockTouch = false, warnIds = [], svgRef, ...look
}: DesignStageProps) {
  useFontVersion();
  const product = look.product;
  const area = printArea(product, side, doc.mode);
  const full = doc.mode === "full";
  const seams = wrapsFor(product, doc.mode);
  const { paint, defs } = full
    ? panelPaints(`${idPrefix}-fill`, doc.fills, seams && doc.continuous !== false ? { L: seams.L, D: seams.D, top: seams.top, height: seams.height } : null)
    : { paint: undefined, defs: [] };
  const items = layersOnView(doc, side, product);
  const layers = items.filter((i) => !i.ghost).map((i) => i.layer);
  // The selected layer as drawn on this view — its own, or the part that wrapped round to here.
  const selItem = items.find((i) => i.layer.id === selectedId && !i.ghost) ?? items.find((i) => i.layer.id === selectedId) ?? null;
  const selected = selItem?.layer ?? null;
  const selShift = selItem?.shift ?? 0;

  const overlayRef = useRef<SVGGElement>(null);
  const [upx, setUpx] = useState(1);
  const [guides, setGuides] = useState({ v: false, h: false, angle: null as number | null, seams: false });
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const live = useRef({ doc, area, selected, product });
  const upxRef = useRef(upx);
  useLayoutEffect(() => {
    live.current = { doc, area, selected, product };
    upxRef.current = upx;
  });

  // Units per screen pixel, so the handles keep their size whatever the zoom.
  useLayoutEffect(() => {
    const g = overlayRef.current;
    const svg = g?.ownerSVGElement;
    if (!g || !svg) return;
    const measure = () => {
      const m = g.getScreenCTM();
      if (m && m.a > 0) setUpx(1 / m.a);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [interactive, side]);

  const toLocal = useCallback((clientX: number, clientY: number): DOMPoint => {
    const g = overlayRef.current;
    const m = g?.getScreenCTM();
    if (!m) return new DOMPoint(clientX, clientY);
    return new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
  }, []);

  const commit = useCallback((l: Layer, key: string) => {
    update?.(setLayer(place(l, live.current.product, live.current.doc.mode)), key);
  }, [update]);

  // Pointer moves and releases are followed on the window, so a drag that leaves the stage still ends.
  useEffect(() => {
    if (!interactive) return;
    const move = (e: PointerEvent) => {
      if (pointers.current.has(e.pointerId)) {
        const p = toLocal(e.clientX, e.clientY);
        pointers.current.set(e.pointerId, { x: p.x, y: p.y });
      }
      const g = gesture.current;
      if (!g) return;
      if (g.kind === "pinch") {
        const pts = [...pointers.current.values()];
        if (pts.length < 2) return;
        const [a, b] = pts;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const s = scaled(g.orig, dist / Math.max(1, g.dist));
        commit({ ...s, x: g.orig.x + mid.x - g.mid.x, y: g.orig.y + mid.y - g.mid.y, rotation: g.orig.rotation + angle - g.angle }, g.key);
        e.preventDefault();
        return;
      }
      if (e.pointerId !== g.pointerId) return;
      e.preventDefault();
      const p = toLocal(e.clientX, e.clientY);
      const o = g.orig;
      const ox = o.x + g.shift;
      const a = live.current.area;
      const wrapping = !!wrapsFor(live.current.product, live.current.doc.mode);
      if (g.kind === "move") {
        // Positions are worked out where the layer is drawn (x + shift), then handed back.
        let x = ox + p.x - g.start.x, y = o.y + p.y - g.start.y;
        const snap = 8 * upxRef.current;
        const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
        const v = Math.abs(x - cx) < snap, h = Math.abs(y - cy) < snap;
        if (v) x = cx;
        if (h) y = cy;
        setGuides({ v, h, angle: null, seams: wrapping });
        commit({ ...o, x: x - g.shift, y }, g.key);
      } else if (g.kind === "scale") {
        const d0 = Math.hypot(g.start.x - ox, g.start.y - o.y);
        const d1 = Math.hypot(p.x - ox, p.y - o.y);
        commit(scaled(o, d1 / Math.max(1, d0)), g.key);
      } else if (g.kind === "stretch" && o.type !== "text") {
        const r = (-o.rotation * Math.PI) / 180;
        const lx = (p.x - ox) * Math.cos(r) - (p.y - o.y) * Math.sin(r);
        const ly = (p.x - ox) * Math.sin(r) + (p.y - o.y) * Math.cos(r);
        commit(g.axis === "x" ? { ...o, w: Math.max(MIN, Math.abs(lx) * 2) } : { ...o, h: Math.max(MIN, Math.abs(ly) * 2) }, g.key);
      } else if (g.kind === "rotate") {
        let deg = (Math.atan2(p.y - o.y, p.x - ox) * 180) / Math.PI + 90;
        deg = ((deg % 360) + 360) % 360;
        const near = Math.round(deg / 45) * 45;
        if (Math.abs(deg - near) < 4) deg = near % 360;
        if (deg > 180) deg -= 360;
        setGuides({ v: false, h: false, angle: Math.round(deg), seams: false });
        commit({ ...o, rotation: deg }, g.key);
      }
    };
    const up = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      const g = gesture.current;
      if (!g) return;
      if (g.kind === "pinch" ? pointers.current.size < 2 : e.pointerId === g.pointerId) {
        gesture.current = null;
        setGuides({ v: false, h: false, angle: null, seams: false });
      }
    };
    // A finger lost to an app switch must not leave a phantom pinch behind.
    const drop = () => { pointers.current.clear(); gesture.current = null; };
    const onVis = () => { if (document.hidden) drop(); };
    window.addEventListener("blur", drop);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", drop);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [interactive, toLocal, commit]);

  // Belt and braces for browsers that ignore touch-action on SVG: no page scroll during a gesture.
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el || !interactive) return;
    const stop = (e: TouchEvent) => { if (gesture.current) e.preventDefault(); };
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  }, [interactive]);

  /** Every finger on the stage is tracked; the second one turns the gesture into a pinch. */
  const onDownCapture = (e: React.PointerEvent) => {
    if (!interactive) return;
    const p = toLocal(e.clientX, e.clientY);
    pointers.current.set(e.pointerId, { x: p.x, y: p.y });
    const sel = live.current.selected;
    if (pointers.current.size === 2 && sel) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        kind: "pinch", key: `g:${newId()}`, orig: sel,
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
      e.stopPropagation();
    }
  };

  const startOn = (e: React.PointerEvent, l: Layer, kind: "move" | "scale" | "rotate" | "x" | "y", shift = 0) => {
    e.stopPropagation();
    e.preventDefault();
    if (pointers.current.size > 1) return;
    onSelect?.(l.id);
    const key = `g:${newId()}`;
    const start = toLocal(e.clientX, e.clientY);
    gesture.current = kind === "move" ? { kind, pointerId: e.pointerId, key, start, orig: l, shift }
      : kind === "scale" ? { kind, pointerId: e.pointerId, key, start, orig: l, shift }
        : kind === "rotate" ? { kind, pointerId: e.pointerId, key, orig: l, shift }
          : { kind: "stretch", axis: kind, pointerId: e.pointerId, key, orig: l, shift };
  };

  const renderArt = (ctx: MockupContext): ReactNode => {
    const clip = `${idPrefix}-pa-${side}`;
    if (seams && ctx.body) {
      // Wrapping full print: body prints are cut at the side seams (their overflow is drawn on the
      // other view); sleeve prints are cut by the silhouette only.
      const bodyClip = `${idPrefix}-body-${side}`;
      return (
        <>
          <defs><clipPath id={bodyClip}><path d={ctx.body} /></clipPath></defs>
          {items.map(({ layer: l, shift, ghost }) => {
            const view = <LayerView layer={shift ? { ...l, x: l.x + shift } : l} idPrefix={`${idPrefix}${ghost ? `g${shift < 0 ? "m" : "p"}` : ""}`} />;
            return onBody(l, seams)
              ? <g key={`${l.id}${shift}`} clipPath={`url(#${bodyClip})`}>{view}</g>
              : <g key={`${l.id}${shift}`}>{view}</g>;
          })}
        </>
      );
    }
    const body = layers.map((l) => <LayerView key={l.id} layer={l} idPrefix={idPrefix} />);
    // A plain garment is printed inside its print area only; a full print reaches the whole silhouette.
    if (full && ctx.outline) return body;
    return (
      <>
        <defs><clipPath id={clip}><rect x={area.x} y={area.y} width={area.w} height={area.h} /></clipPath></defs>
        <g clipPath={`url(#${clip})`}>{body}</g>
      </>
    );
  };

  const overlay = (ctx: MockupContext): ReactNode => {
    if (!interactive) return <g ref={overlayRef} />;
    const hs = 6.5 * upx, hit = 22 * upx, sw = 1.4 * upx;
    return (
      <g ref={overlayRef} data-ui="1">
        {/* An empty tap deselects. */}
        <rect x={-50} y={-50} width={500} height={540} fill="transparent" pointerEvents="all"
          onPointerDown={() => { if (pointers.current.size <= 1) onSelect?.(null); }} />
        {full && ctx.outline
          ? <path d={ctx.outline} fill="none" stroke="#0d1f16" strokeOpacity="0.55" strokeWidth={sw} strokeDasharray={`${5 * upx} ${4 * upx}`} pointerEvents="none" />
          : <rect x={area.x} y={area.y} width={area.w} height={area.h} fill="none" stroke="#0d1f16" strokeOpacity="0.55"
              strokeWidth={sw} strokeDasharray={`${5 * upx} ${4 * upx}`} pointerEvents="none" rx={2 * upx} />}
        {/* The side seams of a wrapping full print: faint while editing, marked while dragging. */}
        {seams && [seams.L, seams.R].map((x) => (
          <g key={x} pointerEvents="none">
            <line x1={x} x2={x} y1={seams.underY} y2={seams.top + seams.height} stroke="#0d9488" strokeOpacity={guides.seams ? 1 : 0.4}
              strokeWidth={sw} strokeDasharray={`${2 * upx} ${3 * upx}`} />
            {guides.seams && <text x={x} y={seams.underY - 4 * upx} textAnchor="middle" fontSize={10 * upx} fill="#0d9488" fontFamily="sans-serif">
              {side === "front" ? (x === seams.R ? "→ back" : "back ←") : (x === seams.R ? "→ front" : "front ←")}
            </text>}
          </g>
        ))}
        {guides.v && <line x1={area.x + area.w / 2} x2={area.x + area.w / 2} y1={area.y} y2={area.y + area.h} stroke="#e11d48" strokeWidth={sw} pointerEvents="none" />}
        {guides.h && <line y1={area.y + area.h / 2} y2={area.y + area.h / 2} x1={area.x} x2={area.x + area.w} stroke="#e11d48" strokeWidth={sw} pointerEvents="none" />}

        {/* Touch targets of every layer, topmost last. */}
        {items.map(({ layer: l, shift, ghost }) => {
          const { w, h } = layerBox(l);
          const warn = !ghost && (warnIds.includes(l.id) || (!seams && outside(l, area)));
          return (
            <g key={`${l.id}${shift}`} transform={`translate(${l.x + shift} ${l.y}) rotate(${l.rotation})`}>
              <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="transparent" pointerEvents="all"
                stroke={warn ? "#e11d48" : "none"} strokeWidth={sw * 1.4} strokeDasharray={warn ? `${3 * upx} ${2 * upx}` : undefined}
                style={{ cursor: "move", touchAction: "none" }}
                onPointerDown={(e) => startOn(e, l, "move", shift)} />
            </g>
          );
        })}

        {selected && (() => {
          const { w, h } = layerBox(selected);
          const pad = 3 * upx;
          const W2 = w / 2 + pad, H2 = h / 2 + pad;
          const stretchable = selected.type === "shape" || (selected.type === "image" && !selected.lockRatio);
          const handle = (x: number, y: number, kind: "scale" | "x" | "y", cursor: string, label: string) => (
            <g key={`${kind}${x}${y}`} transform={`translate(${x} ${y})`} style={{ cursor, touchAction: "none" }}
              onPointerDown={(e) => startOn(e, selected, kind, selShift)} aria-label={label}>
              <circle r={hit} fill="transparent" pointerEvents="all" />
              {kind === "scale"
                ? <circle r={hs} fill="#fff" stroke="#0d1f16" strokeWidth={sw} />
                : <rect x={-hs * 0.7} y={-hs * 0.7} width={hs * 1.4} height={hs * 1.4} rx={hs * 0.3} fill="#d7ff00" stroke="#0d1f16" strokeWidth={sw} />}
            </g>
          );
          return (
            <g transform={`translate(${selected.x + selShift} ${selected.y}) rotate(${selected.rotation})`}>
              <rect x={-W2} y={-H2} width={W2 * 2} height={H2 * 2} fill="none" stroke="#0d1f16" strokeWidth={sw} pointerEvents="none" />
              <rect x={-W2} y={-H2} width={W2 * 2} height={H2 * 2} fill="none" stroke="#d7ff00" strokeWidth={sw} strokeDasharray={`${4 * upx} ${4 * upx}`} pointerEvents="none" />
              <line x1={0} y1={-H2} x2={0} y2={-H2 - 26 * upx} stroke="#0d1f16" strokeWidth={sw} pointerEvents="none" />
              <g transform={`translate(0 ${-H2 - 26 * upx})`} style={{ cursor: "grab", touchAction: "none" }}
                onPointerDown={(e) => startOn(e, selected, "rotate", selShift)} aria-label="Rotate">
                <circle r={hit} fill="transparent" pointerEvents="all" />
                <circle r={hs * 1.15} fill="#d7ff00" stroke="#0d1f16" strokeWidth={sw} />
                <path d={`M${-hs * 0.5},${-hs * 0.15} A${hs * 0.55},${hs * 0.55} 0 1 0 ${hs * 0.1},${-hs * 0.55}`} fill="none" stroke="#0d1f16" strokeWidth={sw} />
              </g>
              {handle(-W2, -H2, "scale", "nwse-resize", "Resize")}
              {handle(W2, -H2, "scale", "nesw-resize", "Resize")}
              {handle(W2, H2, "scale", "nwse-resize", "Resize")}
              {handle(-W2, H2, "scale", "nesw-resize", "Resize")}
              {stretchable && handle(W2, 0, "x", "ew-resize", "Stretch width")}
              {stretchable && handle(0, H2, "y", "ns-resize", "Stretch height")}
              {guides.angle !== null && (
                <text y={H2 + 18 * upx} textAnchor="middle" fontSize={12 * upx} fill="#0d1f16" fontFamily="sans-serif" pointerEvents="none">{guides.angle}°</text>
              )}
            </g>
          );
        })()}
      </g>
    );
  };

  const act = (fn: Parameters<Update>[0]) => update?.(fn);

  return (
    <div ref={wrap} className="relative h-full w-full" onPointerDownCapture={onDownCapture}
      style={lockTouch ? { touchAction: "none" } : undefined}>
      <ProductMockup
        {...look}
        side={side}
        showToggle={false}
        paint={paint}
        defs={defs.length ? defs : undefined}
        renderArt={renderArt}
        overlay={overlay}
        svgRef={svgRef}
        svgClassName={svgClassName}
      />

      {interactive && items.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit max-w-[90%] rounded-full bg-white/90 px-3 py-1.5 text-center text-xs font-body text-forest-900/70 shadow-sm">
          Upload your logo or add text to start
        </p>
      )}

      {interactive && selected && update && (
        <div className="absolute left-1.5 top-1.5 flex gap-1 rounded-lg bg-white/95 p-1 shadow-md" role="toolbar" aria-label="Selected element">
          <StageButton label="Duplicate" onClick={() => { const id = newId(); act(duplicateLayer(selected.id, id)); onSelect?.(id); }}><Copy className="h-4 w-4" /></StageButton>
          <StageButton label="Bring forward" onClick={() => act(reorder(selected.id, 1))}><ArrowUp className="h-4 w-4" /></StageButton>
          <StageButton label="Send backward" onClick={() => act(reorder(selected.id, -1))}><ArrowDown className="h-4 w-4" /></StageButton>
          <StageButton label="Delete" onClick={() => { act(removeLayer(selected.id)); onSelect?.(null); }} danger><Trash2 className="h-4 w-4" /></StageButton>
        </div>
      )}

      {!interactive && onRequestEdit && (
        <button type="button" onClick={onRequestEdit} aria-label="Edit the design"
          className="absolute inset-0 flex items-end justify-end p-2">
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#0d1f16] px-4 text-sm font-body font-medium text-[#d7ff00] shadow-md">
            <Pencil className="h-4 w-4" /> Edit design
          </span>
        </button>
      )}
    </div>
  );
}

function StageButton({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-md transition-colors ${danger ? "text-red-600 hover:bg-red-50" : "text-forest-900 hover:bg-forest-900/10"}`}>
      {children}
    </button>
  );
}
