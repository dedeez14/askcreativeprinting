import { useId, useRef, useState, type ReactNode } from "react";
import {
  ImagePlus, Type, Shapes, Undo2, Redo2, Trash2, Copy, ArrowUp, ArrowDown, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Loader2, X, RotateCcw, Hash, UserRound, Layers, Lightbulb, Pipette,
} from "lucide-react";
import { sameOriginMedia } from "../lib/media";
import type { UploadedFile } from "../types/landing";
import { FONTS, ensureFont, fontFamily } from "./fonts";
import { fillPaint, PATTERNS, patternById } from "./patterns";
import { fullPrintAllowed, hasBack, printArea } from "./printAreas";
import {
  addLayer, duplicateLayer, imageRatio, makeImage, makeShape, makeText, newId, patchLayer,
  removeLayer, reorder, type Update,
} from "./state";
import type { DesignDoc, FillSpec, Layer, PanelId, ShapeId, Side, TextLayer } from "./types";

/**
 * The editor's controls: add pictures, text, names/numbers and shapes; edit the selected element;
 * the full-print panel fills (solid, gradient, pattern, picture); the list of layers.
 * The same panel serves the page (beside / under the garment) and the full-screen editor.
 */

const DEFAULT_PALETTE = ["#ffffff", "#0d1f16", "#000000", "#d7ff00", "#e11d48", "#f97316", "#facc15", "#16a34a", "#0ea5e9", "#1d4ed8", "#7c3aed", "#9ca3af"];
const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif,.svg";
const HINT_KEY = "ask-design:hint-seen";

const SHAPES: Array<{ id: ShapeId; label: string }> = [
  { id: "shield", label: "Shield" }, { id: "circle", label: "Circle" }, { id: "star", label: "Star" },
  { id: "rect", label: "Badge" }, { id: "stripe", label: "Stripe" }, { id: "triangle", label: "Triangle" }, { id: "diamond", label: "Diamond" },
];

const PANEL_LABEL: Record<PanelId, string> = { bodyFront: "Front", bodyBack: "Back", sleeves: "Sleeves", trim: "Collar & trims" };

export interface DesignToolsProps {
  doc: DesignDoc;
  update: Update;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  product: string;
  side: Side;
  setSide: (s: Side) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** The garment colours (the defaults of every new fill). */
  mainColor: string;
  secondaryColor?: string;
  palette?: string[];
  /** Whether the garment is drawn with sleeves (a sleeves panel to paint). */
  hasSleeves: boolean;
  /** Upload a picture to the ERP; the page adds it to the files sent with the enquiry. */
  uploadImage: (file: File) => Promise<UploadedFile | null>;
  /** Pictures already uploaded (for a picture fill or to place again). */
  images: UploadedFile[];
  /** The first name / number of the names list, shown in the placeholders. */
  sampleName: string;
  sampleNumber: string;
  /** "Name" / "Number" placeholders switch the names-and-numbers list on. */
  onNamePlaceholder: () => void;
  onStartOver: () => void;
  /** Compact = inside the full-screen editor's bottom sheet. */
  compact?: boolean;
}

const BTN = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-body transition-colors disabled:opacity-35";
const ON = "bg-forest-900 text-white";
const OFF = "bg-off-white text-forest-900/80 hover:bg-forest-900/10";
const LBL = "block text-xs font-body font-medium uppercase tracking-[0.08em] text-forest-900/60 mb-1.5";

function Slider({ label, value, min, max, step = 1, onChange, unit = "" }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className={LBL}>{label}</label>
        <span className="text-xs font-body text-forest-900/60 tabular-nums">{Math.round(value * 100) / 100}{unit}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full accent-[#0d1f16]" />
    </div>
  );
}

/** Swatches + the browser's colour wheel. */
export function MiniColor({ label, value, onChange, palette }: { label: string; value: string; onChange: (c: string) => void; palette: string[] }) {
  const wheel = useRef<HTMLInputElement>(null);
  const off = !palette.some((c) => c.toLowerCase() === value.toLowerCase());
  return (
    <div>
      <p className={LBL}>{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {palette.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} aria-label={`${label} ${c}`} aria-pressed={c.toLowerCase() === value.toLowerCase()}
            className={`h-11 w-11 rounded-full border ${c.toLowerCase() === value.toLowerCase() ? "border-forest-900 ring-2 ring-forest-900/25" : "border-forest-900/15"}`}
            style={{ backgroundColor: c }} />
        ))}
        <button type="button" onClick={() => wheel.current?.click()} aria-label={`${label}: any colour`} title="Any colour"
          className={`h-11 w-11 rounded-full border inline-flex items-center justify-center ${off ? "border-forest-900 ring-2 ring-forest-900/25" : "border-dashed border-forest-900/30"}`}
          style={off ? { backgroundColor: value } : { background: "conic-gradient(#ef4444,#f59e0b,#d7ff00,#10b981,#06b6d4,#3b82f6,#8b5cf6,#ef4444)" }}>
          <Pipette className="h-4 w-4 text-forest-900 mix-blend-difference" />
        </button>
        <input ref={wheel} type="color" tabIndex={-1} aria-hidden="true" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)} className="sr-only absolute h-0 w-0 opacity-0" />
      </div>
    </div>
  );
}

function Section({ title, icon, children, right }: { title: string; icon?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-lg border border-forest-900/10 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-body font-medium text-forest-900">{icon}{title}</h4>
        {right}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** A small square swatch of a fill (pattern picker, panel list). */
function FillSwatch({ fill, size = 44, id }: { fill: FillSpec; size?: number; id: string }) {
  const { def, paint } = fillPaint(id, fill.kind === "pattern" ? { ...fill, scale: 0.6, rotate: fill.rotate } : fill);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="block">
      {def && <defs>{def}</defs>}
      <rect width="48" height="48" fill={paint} />
    </svg>
  );
}

export default function DesignTools(props: DesignToolsProps) {
  const {
    doc, update, undo, redo, canUndo, canRedo, product, side, setSide, selectedId, onSelect,
    mainColor, secondaryColor, hasSleeves, uploadImage, images, sampleName, sampleNumber, onNamePlaceholder, onStartOver,
  } = props;
  const palette = [...new Set([...(props.palette ?? []), ...DEFAULT_PALETTE].map((c) => c.toLowerCase()))].slice(0, 11);
  const fileInput = useRef<HTMLInputElement>(null);
  const fillInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [panel, setPanel] = useState<PanelId>(side === "back" ? "bodyBack" : "bodyFront");
  const [hint, setHint] = useState(() => { try { return !localStorage.getItem(HINT_KEY); } catch { return true; } });
  const where = { product, side, mode: doc.mode };
  const selected = doc.layers.find((l) => l.id === selectedId) ?? null;
  const twoSided = hasBack(product);
  const canFull = fullPrintAllowed(product);
  const contrast = secondaryColor || (mainColor.toLowerCase() === "#ffffff" ? "#0d1f16" : "#ffffff");

  const add = (l: Layer) => { update(addLayer(l)); onSelect(l.id); };

  const pickImage = async (file: File | undefined, asFill = false) => {
    if (!file) return;
    setBusy(true);
    try {
      const up = await uploadImage(file);
      if (!up) return;
      const src = sameOriginMedia(up.url) ?? up.url;
      if (asFill) setFill(panel, { kind: "image", src, path: up.path, name: up.original_name, mode: "cover", scale: 1 });
      else add(makeImage(where, src, await imageRatio(src), { path: up.path, name: up.original_name }));
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
      if (fillInput.current) fillInput.current.value = "";
    }
  };

  const placeAgain = async (f: UploadedFile) => {
    const src = sameOriginMedia(f.url) ?? f.url;
    add(makeImage(where, src, await imageRatio(src), { path: f.path, name: f.original_name }));
  };

  const addText = (text: string, extra: Partial<TextLayer> = {}) => add(makeText(where, text, { color: contrast, ...extra }));

  const addBound = (bind: "name" | "number") => {
    onNamePlaceholder();
    // Names and numbers go on the back of a jersey unless the customer is designing a front-only product.
    const s: Side = twoSided ? "back" : side;
    if (s !== side) setSide(s);
    // Placed on the back print zone even in full print — the full zone's top is the collar.
    const a = printArea(product, s, "simple");
    const base = { product, side: s, mode: doc.mode };
    add(bind === "name"
      ? makeText(base, (sampleName || "PLAYER").toUpperCase(), { bind, color: contrast, size: 24, y: a.y + a.h * 0.16, x: a.x + a.w / 2, spacing: 6 })
      : makeText(base, sampleNumber || "10", { bind, color: contrast, size: 92, y: a.y + a.h * 0.46, x: a.x + a.w / 2, font: "graduate", strokeWidth: 4, strokeColor: "#0d1f16" }));
  };

  const set = (patch: Partial<Layer>, key: string) => selected && update(patchLayer(selected.id, patch), `${key}:${selected.id}`);

  const defaultFill = (kind: FillSpec["kind"]): FillSpec => {
    switch (kind) {
      case "solid": return { kind, color: mainColor };
      case "gradient": return { kind, colors: [mainColor, contrast], angle: 0 };
      case "pattern": return { kind, pattern: "stripes", colors: [mainColor, contrast, "#d7ff00"], scale: 1, rotate: 0 };
      case "image": {
        const img = images[0];
        const src = img ? sameOriginMedia(img.url) ?? img.url : "";
        return { kind, src, path: img?.path, name: img?.original_name, mode: "cover", scale: 1 };
      }
    }
  };
  const fill = doc.fills[panel];
  const setFill = (p: PanelId, f: FillSpec | undefined, key?: string) =>
    update((d) => {
      const fills = { ...d.fills };
      if (f) fills[p] = f; else delete fills[p];
      return { ...d, fills };
    }, key);
  const panels: PanelId[] = (["bodyFront", "bodyBack", "sleeves", "trim"] as PanelId[]).filter((p) => (p !== "sleeves" || hasSleeves) && (p !== "bodyBack" || twoSided));

  const sideLayers = doc.layers.filter((l) => l.side === side).slice().reverse();
  const describe = (l: Layer) => l.type === "text" ? `${l.bind ? (l.bind === "name" ? "Name: " : "Number: ") : "Text: "}${l.text.split("\n")[0] || "…"}`
    : l.type === "image" ? `Image: ${l.name ?? "picture"}` : `Shape: ${SHAPES.find((s) => s.id === l.shape)?.label ?? l.shape}`;

  return (
    <div className="space-y-3">
      {/* Side + history */}
      <div className="flex flex-wrap items-center gap-2">
        {twoSided && (
          <div className="flex rounded-lg bg-forest-900/[0.06] p-0.5" role="group" aria-label="Side to edit">
            {(["front", "back"] as const).map((s) => (
              <button key={s} type="button" onClick={() => { setSide(s); onSelect(null); }} aria-pressed={side === s}
                className={`min-h-11 min-w-[4.5rem] rounded-md px-3 text-sm font-body capitalize transition-colors ${side === s ? ON : "text-forest-900/70"}`}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto flex gap-1">
          <button type="button" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo" className={`${BTN} w-11 px-0 ${OFF}`}><Undo2 className="h-5 w-5" /></button>
          <button type="button" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo" className={`${BTN} w-11 px-0 ${OFF}`}><Redo2 className="h-5 w-5" /></button>
        </div>
      </div>

      {hint && (
        <div className="flex items-start gap-2 rounded-lg bg-[#d7ff00]/25 p-3 text-sm font-body text-forest-900">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="flex-1">
            Tap an element to select it. Drag to move, pull a corner to resize, the round handle rotates.
            On a phone, pinch with two fingers. Your design is saved on this device as you go.
          </p>
          <button type="button" aria-label="Hide the tip" onClick={() => { setHint(false); try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignore */ } }}
            className="-m-2 inline-flex h-11 w-11 shrink-0 items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
      )}

      {canFull && (
        <div>
          <p className={LBL}>Print style</p>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-forest-900/[0.06] p-0.5" role="group" aria-label="Print style">
            {([["simple", "Logo print", "Print on a plain garment"], ["full", "Full print", "Sublimation — colour the whole garment"]] as const).map(([m, label, sub]) => (
              <button key={m} type="button" aria-pressed={doc.mode === m}
                onClick={() => update((d) => ({ ...d, mode: m }))}
                className={`min-h-11 rounded-md px-2 py-1.5 text-left font-body transition-colors ${doc.mode === m ? ON : "text-forest-900/75"}`}>
                <span className="block text-sm font-medium">{label}</span>
                <span className={`block text-[11px] leading-tight ${doc.mode === m ? "text-white/70" : "text-forest-900/55"}`}>{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className={`${BTN} ${OFF} flex-col !gap-0.5 py-2`}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}<span>Image</span>
        </button>
        <button type="button" onClick={() => addText("YOUR TEAM")} className={`${BTN} ${OFF} flex-col !gap-0.5 py-2`}><Type className="h-5 w-5" /><span>Text</span></button>
        <button type="button" onClick={() => addBound("name")} className={`${BTN} ${OFF} flex-col !gap-0.5 py-2`}><UserRound className="h-5 w-5" /><span>Name</span></button>
        <button type="button" onClick={() => addBound("number")} className={`${BTN} ${OFF} flex-col !gap-0.5 py-2`}><Hash className="h-5 w-5" /><span>Number</span></button>
        <button type="button" onClick={() => setShapesOpen((o) => !o)} aria-expanded={shapesOpen} className={`${BTN} ${shapesOpen ? ON : OFF} flex-col !gap-0.5 py-2`}><Shapes className="h-5 w-5" /><span>Shape</span></button>
      </div>
      <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} className="hidden" aria-label="Upload an image" onChange={(e) => void pickImage(e.target.files?.[0])} />
      {shapesOpen && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Shapes">
          {SHAPES.map((s) => (
            <button key={s.id} type="button" className={`${BTN} ${OFF}`} onClick={() => { add(makeShape(where, s.id, contrast)); setShapesOpen(false); }}>{s.label}</button>
          ))}
        </div>
      )}
      {images.length > 0 && (
        <div>
          <p className={LBL}>Your uploads — tap to place again</p>
          <div className="flex flex-wrap gap-1.5">
            {images.map((f) => (
              <button key={f.path} type="button" onClick={() => void placeAgain(f)} aria-label={`Place ${f.original_name}`}
                className="h-12 w-12 overflow-hidden rounded-md border border-forest-900/15 bg-white p-0.5">
                <img src={sameOriginMedia(f.url)} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The selected element */}
      {selected && (
        <Section title={selected.type === "text" ? (selected.bind ? `${selected.bind === "name" ? "Name" : "Number"} placeholder` : "Text") : selected.type === "image" ? "Image" : "Shape"}
          right={
            <div className="flex gap-1">
              <button type="button" aria-label="Duplicate" title="Duplicate" className={`${BTN} w-11 px-0 ${OFF}`} onClick={() => { const id = newId(); update(duplicateLayer(selected.id, id)); onSelect(id); }}><Copy className="h-4 w-4" /></button>
              <button type="button" aria-label="Delete" title="Delete" className={`${BTN} w-11 px-0 bg-red-50 text-red-600 hover:bg-red-100`} onClick={() => { update(removeLayer(selected.id)); onSelect(null); }}><Trash2 className="h-4 w-4" /></button>
              <button type="button" aria-label="Done" title="Done" className={`${BTN} w-11 px-0 ${OFF}`} onClick={() => onSelect(null)}><X className="h-4 w-4" /></button>
            </div>
          }>
          {selected.type === "text" && (
            <TextControls t={selected} set={set} palette={palette} />
          )}
          {selected.type === "image" && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" checked={selected.lockRatio} className="h-5 w-5 accent-teal-500"
                onChange={(e) => set(e.target.checked ? { lockRatio: true, h: selected.w / selected.ratio } : { lockRatio: false }, "ratio")} />
              <span className="text-sm font-body text-forest-900">Keep proportions</span>
            </label>
          )}
          {selected.type === "shape" && (
            <>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Shape">
                {SHAPES.map((s) => (
                  <button key={s.id} type="button" aria-pressed={selected.shape === s.id} onClick={() => set({ shape: s.id }, "shape")}
                    className={`${BTN} ${selected.shape === s.id ? ON : OFF}`}>{s.label}</button>
                ))}
              </div>
              <MiniColor label="Colour" value={selected.color} onChange={(c) => set({ color: c }, "color")} palette={palette} />
              <Slider label="Outline" value={selected.strokeWidth} min={0} max={8} step={0.5} onChange={(v) => set({ strokeWidth: v }, "sw")} />
              {selected.strokeWidth > 0 && <MiniColor label="Outline colour" value={selected.strokeColor} onChange={(c) => set({ strokeColor: c }, "sc")} palette={palette} />}
            </>
          )}
          <Slider label="Rotation" value={Math.round(selected.rotation)} min={-180} max={180} onChange={(v) => set({ rotation: v }, "rot")} unit="°" />
          <Slider label="Opacity" value={Math.round((selected.opacity ?? 1) * 100)} min={10} max={100} onChange={(v) => set({ opacity: v / 100 }, "op")} unit="%" />
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={`${BTN} ${OFF}`} onClick={() => { const a = printArea(product, selected.side, doc.mode); set({ x: a.x + a.w / 2 }, "cx"); }}>Centre across</button>
            <button type="button" className={`${BTN} ${OFF}`} onClick={() => set({ rotation: 0 }, "r0")}><RotateCcw className="h-4 w-4" /> Straighten</button>
            <button type="button" className={`${BTN} ${OFF}`} onClick={() => update(reorder(selected.id, 1))}><ArrowUp className="h-4 w-4" /> Forward</button>
            <button type="button" className={`${BTN} ${OFF}`} onClick={() => update(reorder(selected.id, -1))}><ArrowDown className="h-4 w-4" /> Backward</button>
          </div>
        </Section>
      )}

      {/* Full print: panel fills */}
      {canFull && doc.mode === "full" && (
        <Section title="Garment colours & patterns">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Garment part">
            {panels.map((p) => (
              <button key={p} type="button" aria-pressed={panel === p} onClick={() => setPanel(p)}
                className={`${BTN} ${panel === p ? ON : OFF}`}>
                {doc.fills[p] && <span className="h-5 w-5 overflow-hidden rounded-full border border-white/40"><FillSwatch fill={doc.fills[p]!} size={20} id={`sw-${p}`} /></span>}
                {PANEL_LABEL[p]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-forest-900/[0.06] p-0.5" role="group" aria-label="Fill type">
            {(["solid", "gradient", "pattern", "image"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={(fill?.kind ?? "solid") === k}
                onClick={() => setFill(panel, k === "solid" && !fill ? undefined : (fill?.kind === k ? fill : defaultFill(k)))}
                className={`min-h-11 rounded-md text-sm font-body capitalize ${(fill?.kind ?? "solid") === k ? ON : "text-forest-900/75"}`}>
                {k === "image" ? "Picture" : k}
              </button>
            ))}
          </div>

          {(!fill || fill.kind === "solid") && (
            <MiniColor label={`${PANEL_LABEL[panel]} colour`} value={fill?.kind === "solid" ? fill.color : panel === "trim" ? (secondaryColor || mainColor) : mainColor}
              onChange={(c) => setFill(panel, { kind: "solid", color: c }, `fill:${panel}`)} palette={palette} />
          )}
          {fill?.kind === "gradient" && (
            <>
              {fill.colors.map((c, i) => (
                <MiniColor key={i} label={`Colour ${i + 1}`} value={c} palette={palette}
                  onChange={(v) => setFill(panel, { ...fill, colors: fill.colors.map((x, j) => (j === i ? v : x)) }, `fill:${panel}:${i}`)} />
              ))}
              <button type="button" className={`${BTN} ${OFF}`}
                onClick={() => setFill(panel, { ...fill, colors: fill.colors.length > 2 ? fill.colors.slice(0, 2) : [...fill.colors, "#d7ff00"] })}>
                {fill.colors.length > 2 ? "Use two colours" : "Add a third colour"}
              </button>
              <Slider label="Direction" value={fill.angle} min={0} max={360} step={5} onChange={(v) => setFill(panel, { ...fill, angle: v }, `fill:${panel}:a`)} unit="°" />
            </>
          )}
          {fill?.kind === "pattern" && (
            <>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6" role="group" aria-label="Pattern">
                {PATTERNS.map((p) => (
                  <button key={p.id} type="button" aria-pressed={fill.pattern === p.id} onClick={() => setFill(panel, { ...fill, pattern: p.id })}
                    className={`flex flex-col items-center gap-1 rounded-md p-1 text-[11px] font-body ${fill.pattern === p.id ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/75"}`}>
                    <span className="overflow-hidden rounded"><FillSwatch fill={{ ...fill, pattern: p.id }} size={44} id={`pt-${panel}-${p.id}`} /></span>
                    {p.label}
                  </button>
                ))}
              </div>
              {fill.colors.slice(0, patternById(fill.pattern).colors).map((c, i) => (
                <MiniColor key={i} label={i === 0 ? "Background" : i === 1 ? "Pattern colour" : "Accent"} value={c} palette={palette}
                  onChange={(v) => setFill(panel, { ...fill, colors: fill.colors.map((x, j) => (j === i ? v : x)) }, `fill:${panel}:${i}`)} />
              ))}
              <Slider label="Pattern size" value={fill.scale} min={0.3} max={4} step={0.1} onChange={(v) => setFill(panel, { ...fill, scale: v }, `fill:${panel}:s`)} unit="×" />
              <Slider label="Pattern angle" value={fill.rotate} min={0} max={180} step={5} onChange={(v) => setFill(panel, { ...fill, rotate: v }, `fill:${panel}:r`)} unit="°" />
            </>
          )}
          {fill?.kind === "image" && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {images.map((f) => {
                  const src = sameOriginMedia(f.url) ?? f.url;
                  return (
                    <button key={f.path} type="button" aria-pressed={fill.path === f.path} aria-label={`Use ${f.original_name}`}
                      onClick={() => setFill(panel, { ...fill, src, path: f.path, name: f.original_name })}
                      className={`h-12 w-12 overflow-hidden rounded-md border-2 bg-white p-0.5 ${fill.path === f.path ? "border-forest-900" : "border-forest-900/15"}`}>
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  );
                })}
                <button type="button" onClick={() => fillInput.current?.click()} disabled={busy} className={`${BTN} ${OFF}`}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Upload a background
                </button>
                <input ref={fillInput} type="file" accept={IMAGE_ACCEPT} className="hidden" aria-label="Upload a background picture" onChange={(e) => void pickImage(e.target.files?.[0], true)} />
              </div>
              {fill.src ? (
                <>
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-forest-900/[0.06] p-0.5" role="group" aria-label="Picture fit">
                    {(["cover", "tile"] as const).map((m) => (
                      <button key={m} type="button" aria-pressed={fill.mode === m} onClick={() => setFill(panel, { ...fill, mode: m, scale: 1 })}
                        className={`min-h-11 rounded-md text-sm font-body ${fill.mode === m ? ON : "text-forest-900/75"}`}>{m === "cover" ? "Fill the part" : "Repeat (tile)"}</button>
                    ))}
                  </div>
                  <Slider label={fill.mode === "cover" ? "Zoom" : "Tile size"} value={fill.scale} min={fill.mode === "cover" ? 1 : 0.3} max={fill.mode === "cover" ? 3 : 4} step={0.1}
                    onChange={(v) => setFill(panel, { ...fill, scale: v }, `fill:${panel}:s`)} unit="×" />
                </>
              ) : <p className="text-sm font-body text-forest-900/60">Upload a picture to use it as the background of this part.</p>}
            </>
          )}
          <div className="flex flex-wrap gap-1.5">
            {fill && (
              <button type="button" className={`${BTN} ${OFF}`}
                onClick={() => update((d) => ({
                  ...d,
                  // From a body part: the body and sleeves take it, the trims keep theirs. From the trims: everything.
                  fills: Object.fromEntries(panels.flatMap((p) => (p === "trim" && panel !== "trim" ? (d.fills.trim ? [[p, d.fills.trim]] : []) : [[p, fill]]))),
                }))}>
                Use on {panel === "trim" ? "all parts" : "front, back & sleeves"}
              </button>
            )}
            {fill && <button type="button" className={`${BTN} ${OFF}`} onClick={() => setFill(panel, undefined)}>Reset to garment colour</button>}
          </div>
        </Section>
      )}

      {/* Layers */}
      {sideLayers.length > 0 && (
        <Section title={`Layers on the ${side}`} icon={<Layers className="h-4 w-4" />}>
          <ul className="space-y-1">
            {sideLayers.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => onSelect(l.id)} aria-pressed={l.id === selectedId}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-body ${l.id === selectedId ? "bg-[#d7ff00]/40 text-forest-900" : "bg-off-white text-forest-900/80"}`}>
                  <span className="truncate">{describe(l)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={onStartOver} className={`${BTN} text-forest-900/60 hover:text-red-600`}>
          <RotateCcw className="h-4 w-4" /> Start over
        </button>
      </div>
    </div>
  );
}

function TextControls({ t, set, palette }: { t: TextLayer; set: (p: Partial<Layer>, key: string) => void; palette: string[] }) {
  const id = useId();
  return (
    <>
      <div>
        <label htmlFor={id} className={LBL}>{t.bind ? "Sample shown (each piece gets its own from your list)" : "Your text"}</label>
        <textarea id={id} rows={2} value={t.text} onChange={(e) => set({ text: e.target.value.slice(0, 120) }, "text")}
          className="w-full resize-none rounded-md border border-forest-900/15 bg-white px-3 py-2 text-base md:text-sm font-body text-forest-900 focus:border-teal-500 focus:outline-none" />
      </div>
      <div>
        <p className={LBL}>Font</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3" role="group" aria-label="Font">
          {FONTS.map((f) => (
            <button key={f.id} type="button" aria-pressed={t.font === f.id}
              onClick={() => { void ensureFont(f.id, t.bold, t.italic); set({ font: f.id }, "font"); }}
              className={`min-h-11 rounded-md px-2 py-1 text-left ${t.font === f.id ? ON : OFF}`}>
              <span className="block text-base leading-tight" style={{ fontFamily: t.font === f.id ? `${fontFamily(f.id)}, sans-serif` : undefined }}>{f.label}</span>
              <span className={`block text-[11px] font-body ${t.font === f.id ? "text-white/70" : "text-forest-900/55"}`}>{f.note}</span>
            </button>
          ))}
        </div>
      </div>
      <Slider label="Size" value={Math.round(t.size)} min={8} max={160} onChange={(v) => set({ size: v }, "size")} />
      <MiniColor label="Colour" value={t.color} onChange={(c) => set({ color: c }, "color")} palette={palette} />
      <div className="flex flex-wrap gap-1.5">
        <button type="button" aria-pressed={t.bold} aria-label="Bold" onClick={() => set({ bold: !t.bold }, "b")} className={`${BTN} w-11 px-0 ${t.bold ? ON : OFF}`}><Bold className="h-4 w-4" /></button>
        <button type="button" aria-pressed={t.italic} aria-label="Italic" onClick={() => set({ italic: !t.italic }, "i")} className={`${BTN} w-11 px-0 ${t.italic ? ON : OFF}`}><Italic className="h-4 w-4" /></button>
        <span className="w-2" />
        {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
          <button key={a} type="button" aria-pressed={t.align === a} aria-label={`Align ${a}`} onClick={() => set({ align: a }, "al")}
            className={`${BTN} w-11 px-0 ${t.align === a ? ON : OFF}`}><Icon className="h-4 w-4" /></button>
        ))}
      </div>
      <Slider label="Letter spacing" value={t.spacing} min={-10} max={60} onChange={(v) => set({ spacing: v }, "sp")} />
      <Slider label="Outline" value={t.strokeWidth} min={0} max={15} step={0.5} onChange={(v) => set({ strokeWidth: v }, "sw")} />
      {t.strokeWidth > 0 && <MiniColor label="Outline colour" value={t.strokeColor} onChange={(c) => set({ strokeColor: c }, "sc")} palette={palette} />}
      <Slider label="Curve" value={t.arc} min={-100} max={100} onChange={(v) => set({ arc: Math.abs(v) < 3 ? 0 : v }, "arc")} />
    </>
  );
}
