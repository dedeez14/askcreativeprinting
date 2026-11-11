import { useEffect, useId, useRef, useState } from "react";
import { Check, Pipette, X } from "lucide-react";

/**
 * One colour control used everywhere a customer chooses a product colour — the Online Design
 * studio and the Get Quotation form.
 *
 * It is a picker, not a text field (user, 31-Oct-2026: "untuk main color dan secondary color
 * harusnya color picker"). Three ways in, because customers arrive with different certainty:
 *   • the swatches the ERP offers for this product — one tap, and the name is a real stock colour;
 *   • the eyedropper tile — the browser's own colour wheel, for a club colour that is not stocked;
 *   • the hex box — for a customer who was given an exact code by their own designer.
 * Whatever is chosen is one hex string, so the preview, the enquiry and the ERP all read the same
 * value and the sales team never has to guess what "dark blue" meant.
 */
export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  /** Stock swatches from the ERP; the control still works with none. */
  swatches?: string[];
  /** An optional colour (a secondary) can be cleared back to "no second colour". */
  clearable?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  /** The page's own label class, so this control reads as part of the form around it. */
  labelClassName?: string;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Readable tick colour on top of the swatch, so a tick on white is still visible. */
function tickOn(hex: string): string {
  if (!HEX.test(hex)) return "#0d1f16";
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  // Rec. 709 luma: the eye weights green most, and a mid-green needs dark ink on it.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6 ? "#0d1f16" : "#ffffff";
}

const DEFAULT_LABEL = "text-sm font-body font-medium text-forest-900 flex items-center gap-2";

export default function ColorPicker({
  label, value, onChange, swatches = [], clearable = false, hint, icon,
  labelClassName = DEFAULT_LABEL,
}: ColorPickerProps) {
  const id = useId();
  const nativeRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);

  // The hex box follows the swatches and the wheel, but never fights what is being typed.
  useEffect(() => { setDraft(value); }, [value]);

  const commit = (text: string) => {
    const next = text.startsWith("#") ? text : `#${text}`;
    if (HEX.test(next)) onChange(next.toLowerCase());
  };

  const chosen = HEX.test(value) ? value.toLowerCase() : "";
  const offList = chosen !== "" && !swatches.some((s) => s.toLowerCase() === chosen);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <label htmlFor={`${id}-hex`} className={labelClassName}>
          {icon}{label}
        </label>
        {clearable && chosen !== "" && (
          <button type="button" onClick={() => onChange("")}
            className="-my-3 inline-flex min-h-11 items-center gap-1 px-2 text-sm font-body text-forest-900/60 hover:text-red-600 transition-colors">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {swatches.map((c) => {
          const on = c.toLowerCase() === chosen;
          return (
            <button key={c} type="button" onClick={() => onChange(c.toLowerCase())}
              aria-label={`${label}: ${c}`} aria-pressed={on} title={c}
              className={`w-11 h-11 rounded-full border transition-transform hover:scale-105 flex items-center justify-center
                ${on ? "border-forest-900 ring-2 ring-forest-900/15 scale-105" : "border-forest-900/15"}`}
              style={{ backgroundColor: c }}>
              {on && <Check className="w-4 h-4" strokeWidth={3} style={{ color: tickOn(c) }} />}
            </button>
          );
        })}

        {/* The browser's colour wheel, behind a tile that shows what it currently holds. */}
        <button type="button" onClick={() => nativeRef.current?.click()}
          aria-label={`${label}: pick any colour`} title="Pick any colour"
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition-transform hover:scale-105
            ${offList ? "border-forest-900 ring-2 ring-forest-900/15 scale-105" : "border-dashed border-forest-900/30"}`}
          style={offList ? { backgroundColor: chosen } : { background: "conic-gradient(#ef4444,#f59e0b,#d7ff00,#10b981,#06b6d4,#3b82f6,#8b5cf6,#ef4444)" }}>
          <Pipette className="w-4 h-4" style={{ color: offList ? tickOn(chosen) : "#0d1f16" }} />
        </button>
        <input ref={nativeRef} type="color" tabIndex={-1} aria-hidden="true"
          value={chosen || "#1d4ed8"} onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="sr-only absolute w-0 h-0 opacity-0 pointer-events-none" />

        <input id={`${id}-hex`} value={draft} onChange={(e) => { setDraft(e.target.value); commit(e.target.value); }}
          onBlur={() => setDraft(value)} placeholder="#1d4ed8" spellCheck={false} maxLength={7}
          aria-label={`${label}: colour code`}
          className="w-28 h-11 px-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-base md:text-sm font-body
            placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500 [color-scheme:light]" />
      </div>

      {hint && <p className="text-xs font-body text-forest-900/50 mt-2">{hint}</p>}
    </div>
  );
}
