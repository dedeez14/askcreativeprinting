import { previewProductFor, type PreviewModel } from "../lib/previewProduct";

/**
 * A line-art silhouette of the product itself.
 *
 * The ERP sends one coarse icon per category, so every jersey arrived as the same trophy and the
 * picker was a wall of identical tiles — a customer could not tell a singlet from a long-sleeve
 * shirt without reading. These are drawn from the same name→shape mapping the 3D preview uses, so
 * the tile and the model always agree, and they need no asset, no licence and no download.
 *
 * A product that has a real photo in the ERP master (`image_url`) should show that instead; this is
 * what gets drawn until one exists.
 */
export interface ProductGlyphProps {
  product: string;
  className?: string;
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** 24×24, drawn on the same optical grid so a row of tiles reads evenly. */
const PATHS: Record<PreviewModel, React.ReactNode> = {
  "T-Shirt": (
    <>
      <path d="M8.5 3.2 4 5.6l1.6 3.6 1.9-.8V20.8h9V8.4l1.9.8L20 5.6l-4.5-2.4" />
      <path d="M8.5 3.2a3.5 3.5 0 0 0 7 0" />
    </>
  ),
  "Polo Shirt": (
    <>
      <path d="M8.6 3.4 4 5.8l1.6 3.6 1.9-.8V20.8h9V8.6l1.9.8L20 5.8l-4.6-2.4" />
      <path d="M9.6 3.4 12 6.6l2.4-3.2" />
      <path d="M12 6.6v4.2" />
    </>
  ),
  "Corporate Shirt": (
    <>
      <path d="M8.6 3.4 4.4 5.6v14.9h15.2V5.6L15.4 3.4" />
      <path d="M9.4 3.4 12 6.8l2.6-3.4" />
      <path d="M12 6.8v13.7" />
      <path d="M4.4 9.4h2.6M17 9.4h2.6" />
    </>
  ),
  Hoodie: (
    <>
      <path d="M8.4 4.4 4 6.8l1.7 3.8 1.8-.8v10.8h9V9.8l1.8.8L20 6.8l-4.4-2.4" />
      <path d="M8.4 4.4a3.6 3.6 0 0 1 7.2 0c0 1.6-1.6 2.8-3.6 2.8S8.4 6 8.4 4.4Z" />
      <path d="M10.6 12.6h2.8" />
    </>
  ),
  Windbreaker: (
    <>
      <path d="M8.6 3.4 4.2 5.8v14.7h15.6V5.8L15.4 3.4" />
      <path d="M12 3.8v16.7" />
      <path d="M8.6 3.4 12 6.2l3.4-2.8" />
      <path d="M14.4 12.2h3" />
    </>
  ),
  "Football Jersey": (
    <>
      <path d="M8.5 3.2 4 5.6l1.6 3.6 1.9-.8V20.8h9V8.4l1.9.8L20 5.6l-4.5-2.4" />
      <path d="M8.5 3.2a3.5 3.5 0 0 0 7 0" />
      <path d="M10.2 11.6h3.6M10.2 14.4h3.6" />
    </>
  ),
  "Basketball Jersey": (
    <>
      <path d="M9 3.4 6.6 5v15.8h10.8V5L15 3.4" />
      <path d="M9 3.4a3 3 0 0 0 6 0" />
      <path d="M12 9.4v5.4" />
    </>
  ),
  "Baseball Jersey": (
    <>
      <path d="M8.6 3.4 4 5.8l1.6 3.6 1.9-.8v12.2h9V8.6l1.9.8L20 5.8l-4.6-2.4" />
      <path d="M12 3.6v17.2" />
      <path d="M9.6 7.4h.9M9.6 11h.9M9.6 14.6h.9" />
    </>
  ),
  "Running Singlet": (
    <>
      <path d="M9.4 3.4 7.2 5.2v15.4h9.6V5.2l-2.2-1.8" />
      <path d="M9.4 3.4a2.6 2.6 0 0 0 5.2 0" />
      <path d="M12 8.8v6" />
    </>
  ),
  Cap: (
    <>
      <path d="M4.6 14.4a7.4 7.4 0 0 1 14.8 0" />
      <path d="M4.6 14.4h15.6a1.6 1.6 0 0 1 0 3.2H4.6a1.6 1.6 0 0 1 0-3.2Z" />
      <path d="M12 7v7.4" />
    </>
  ),
  Mug: (
    <>
      <path d="M5 5.6h11v12.8H5z" />
      <path d="M16 8.4h2.4a2.6 2.6 0 0 1 0 5.2H16" />
      <path d="M8 9.2h5" />
    </>
  ),
  Lanyard: (
    <>
      <path d="M12 3.6 7.6 11M12 3.6 16.4 11" />
      <path d="M9.6 11h4.8v8.6H9.6z" />
      <path d="M11.2 14.2h1.6" />
    </>
  ),
  Banner: (
    <>
      <path d="M5.4 4.2h13.2v12.4H5.4z" />
      <path d="M4.4 4.2h15.2M4.4 16.6h15.2" />
      <path d="M8.4 8h7.2M8.4 11.4h4.6" />
    </>
  ),
  Bunting: (
    <>
      <path d="M3.6 6h16.8" />
      <path d="m6 6 2.4 5.4L10.8 6M10.8 6l2.4 5.4L15.6 6M15.6 6 18 11.4 20.4 6" />
    </>
  ),
  Sticker: (
    <>
      <path d="M12 3.8a8.2 8.2 0 1 1 0 16.4 8.2 8.2 0 0 1 0-16.4Z" />
      <path d="M15.6 20.2a8.2 8.2 0 0 0 4.6-4.6h-3a1.6 1.6 0 0 0-1.6 1.6z" />
      <path d="M9.4 9.6h5.2M9.4 13h3.4" />
    </>
  ),
  "Premium Gift": (
    <>
      <path d="M4.4 9.4h15.2v10.4H4.4z" />
      <path d="M3.6 6.2h16.8v3.2H3.6z" />
      <path d="M12 6.2v13.6" />
      <path d="M12 6.2C10.6 4 9.4 3.4 8.4 3.8c-1.2.5-1 2.4 3.6 2.4ZM12 6.2c1.4-2.2 2.6-2.8 3.6-2.4 1.2.5 1 2.4-3.6 2.4Z" />
    </>
  ),
};

export default function ProductGlyph({ product, className = "w-9 h-9" }: ProductGlyphProps) {
  const model = previewProductFor(product) ?? "T-Shirt";
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={product} {...STROKE}>
      {PATHS[model]}
    </svg>
  );
}
