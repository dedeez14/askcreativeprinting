/**
 * Which Design Studio products are wearable garments.
 *
 * Kept in its own tiny module (not inside the lazy-loaded 3D component) so the
 * Online Design page can decide whether to show Collar Type / Size controls
 * without pulling in the heavy three.js chunk.
 */
export const GARMENT_PRODUCTS = [
  "T-Shirt",
  "Polo Shirt",
  "Corporate Shirt",
  "Hoodie",
  "Windbreaker",
  "Football Jersey",
  "Basketball Jersey",
  "Baseball Jersey",
  "Running Singlet",
] as const;

const SET = new Set<string>(GARMENT_PRODUCTS);

/** True when collar/size options are meaningful for this product. */
export const isGarment = (product?: string | null): boolean =>
  !!product && SET.has(product);

/** Products that have sizes but no collar (headwear). */
export const hasSizeOnly = (product?: string | null): boolean => product === "Cap";
