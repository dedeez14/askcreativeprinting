import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ProductMockup from "./ProductMockup";
import { isGarment } from "../lib/garments";
import { previewProductFor } from "../lib/previewProduct";

/**
 * The framed product preview (a flat front/back mockup, ProductMockup), shared by the Online Design
 * studio and the Get Quotation form.
 *
 * One component rather than three copies, so the customer sees the same model, the same framing and
 * the same hint wherever they are in the site — and so a change to the frame cannot drift between
 * the two pages. Everything it is given is optional except the product: the panel is meant to be
 * shown the moment a product is picked and to sharpen as the form is filled in.
 *
 * The product name and the Front / Back switch sit in a bar ABOVE the drawing, not on top of it: on a
 * phone the old overlay labels covered the collar and the hem of the garment they described.
 */
export interface StudioPreviewProps {
  product: string;
  collar?: string;
  color?: string;
  secondaryColor?: string;
  sleeve?: string;
  fabric?: string;
  size?: string;
  artworkUrl?: string;
  /** The first line of the bar — normally the product name. */
  caption?: string;
  /** The quieter second line: the collar, the category, the piece count. */
  sub?: string;
  /** Kept for the callers; the flat mockup does not spin. */
  autoRotate?: boolean;
  /** Height classes of the drawing area. */
  height?: string;
  /** Controlled Front / Back (the studio flips to the back when "Back" is ticked as a print position). */
  side?: "front" | "back";
  onSideChange?: (side: "front" | "back") => void;
  /** Which side carries the artwork (see ProductMockup). */
  artOn?: { front: boolean; back: boolean };
  /**
   * Below the lg breakpoint the preview can fold down to its bar, so a customer on a phone can keep
   * it pinned at the top while typing without it taking half the screen.
   */
  collapsible?: boolean;
}

export default function StudioPreview({
  product, collar = "Round Neck", color = "#1d4ed8", secondaryColor, sleeve, fabric,
  artworkUrl, caption, sub, height = "h-[340px] md:h-[400px]", side: sideProp, onSideChange, artOn,
  collapsible = false,
}: StudioPreviewProps) {
  const [ownSide, setOwnSide] = useState<"front" | "back">("front");
  const [folded, setFolded] = useState(false);
  const side = sideProp ?? ownSide;
  const setSide = (s: "front" | "back") => (onSideChange ? onSideChange(s) : setOwnSide(s));
  // Garments have a back to turn to (the mockup draws both sides); a mug or a banner does not.
  const flips = isGarment(previewProductFor(product) ?? "T-Shirt");

  return (
    <div className="bg-off-white rounded-xl overflow-hidden border border-forest-900/10" data-studio-preview>
      <div className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 border-b border-forest-900/[0.07] bg-white/70">
        <div className="min-w-0 flex-1">
          {caption && <p className="text-sm font-body font-medium text-forest-900 truncate">{caption}</p>}
          {sub && <p className="text-xs font-body text-forest-900/60 truncate">{sub}</p>}
        </div>
        {flips && !(collapsible && folded) && (
          <div className="flex shrink-0 rounded-lg bg-forest-900/[0.06] p-0.5" role="group" aria-label="View">
            {(["front", "back"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSide(s)} aria-pressed={side === s}
                className={`min-h-11 min-w-[3.5rem] px-3 text-sm font-body rounded-md capitalize transition-colors ${side === s ? "bg-forest-900 text-white" : "text-forest-900/70 hover:text-forest-900"}`}>
                {s}
              </button>
            ))}
          </div>
        )}
        {collapsible && (
          <button type="button" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}
            aria-label={folded ? "Show the preview" : "Hide the preview"}
            className="lg:hidden shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center gap-1 rounded-md px-2 text-sm font-body text-forest-900/70 hover:text-forest-900">
            {folded ? <>Show <ChevronDown className="w-4 h-4" /></> : <ChevronUp className="w-5 h-5" />}
          </button>
        )}
      </div>
      <div className={`${height} w-full ${collapsible && folded ? "hidden lg:block" : ""}`}>
        <ProductMockup
          product={product}
          collar={collar}
          color={color}
          secondaryColor={secondaryColor}
          sleeve={sleeve}
          fabric={fabric}
          artworkUrl={artworkUrl}
          side={side}
          showToggle={false}
          artOn={artOn}
        />
      </div>
    </div>
  );
}
