import ProductMockup from "./ProductMockup";

/**
 * The framed product preview (a flat front/back mockup, ProductMockup), shared by the Online Design
 * studio and the Get Quotation form.
 *
 * One component rather than three copies, so the customer sees the same model, the same framing and
 * the same hint wherever they are in the site — and so a change to the frame cannot drift between
 * the two pages. Everything it is given is optional except the product: the panel is meant to be
 * shown the moment a product is picked and to sharpen as the form is filled in.
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
  /** The line over the top-left of the panel — normally the product name. */
  caption?: string;
  /** The quieter second line: the collar, the category, the piece count. */
  sub?: string;
  /** Kept for the callers; the flat mockup does not spin. */
  autoRotate?: boolean;
  /** Taller panel for the design screen, shorter for the quotation form. */
  height?: string;
}

export default function StudioPreview({
  product, collar = "Round Neck", color = "#1d4ed8", secondaryColor, sleeve, fabric,
  artworkUrl, caption, sub, height = "h-[340px] md:h-[400px]",
}: StudioPreviewProps) {
  return (
    <div className="bg-off-white rounded-xl overflow-hidden relative border border-forest-900/10">
      <div className={`${height} w-full`}>
        <ProductMockup
          product={product}
          collar={collar}
          color={color}
          secondaryColor={secondaryColor}
          sleeve={sleeve}
          fabric={fabric}
          artworkUrl={artworkUrl}
        />
      </div>

      {caption && (
        <div className="absolute top-3 left-3 bg-white/85 backdrop-blur px-3 py-1.5 rounded-md pointer-events-none">
          <p className="text-xs font-body font-medium text-forest-900">{caption}</p>
          {sub && <p className="text-[11px] font-body text-forest-900/60">{sub}</p>}
        </div>
      )}

    </div>
  );
}
