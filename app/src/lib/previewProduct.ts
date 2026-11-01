/*
 * Which mockup stands in for a product name.
 *
 * The Get Quotation form and the Online Design studio call the same things by different names —
 * "Sublimation Jersey" there, "Football Jersey" in the model set; "Banner / Bunting / Backdrop"
 * against a single "Banner" mesh. Rather than rename anything the customer or the ERP relies on,
 * this maps a product name onto the closest model, so a preview can be shown for every product in
 * the list instead of only for the handful whose names happen to match.
 *
 * An unknown name falls back to a tee, which is the right shape for most printed apparel, and
 * `null` is returned only for things that have no sensible 3D stand-in.
 */

/** Product keys ProductMockup knows how to draw. */
const MODELS = [
  "T-Shirt", "Polo Shirt", "Corporate Shirt", "Hoodie", "Windbreaker",
  "Football Jersey", "Basketball Jersey", "Baseball Jersey", "Running Singlet",
  "Cap", "Mug", "Lanyard", "Banner", "Bunting", "Sticker", "Premium Gift",
] as const;

export type PreviewModel = (typeof MODELS)[number];

/** Ordered: the first pattern that matches wins, so "running jersey" beats a bare "jersey". */
const RULES: Array<[RegExp, PreviewModel]> = [
  [/polo/i, "Polo Shirt"],
  [/corporate shirt|office shirt|formal shirt|uniform shirt/i, "Corporate Shirt"],
  [/hood|sweat/i, "Hoodie"],
  [/windbreaker|jacket|varsity|trackset|track suit/i, "Windbreaker"],
  [/basketball|singlet|tank/i, "Basketball Jersey"],
  [/running|marathon/i, "Running Singlet"],
  [/baseball/i, "Baseball Jersey"],
  [/jersey|football|futsal|soccer|sublimation/i, "Football Jersey"],
  [/cap|hat|snapback|bucket/i, "Cap"],
  [/mug|tumbler|bottle|flask/i, "Mug"],
  [/lanyard|id card|name tag|luggage tag|wristband/i, "Lanyard"],
  [/bunting/i, "Bunting"],
  [/banner|backdrop|large format|billboard|standee|roll ?up/i, "Banner"],
  [/sticker|decal|digital print|label/i, "Sticker"],
  [/medal|plaque|trophy|award|keychain|umbrella|bag|gift|premium/i, "Premium Gift"],
  [/t-?shirt|tee|silkscreen|heat ?press|embroider|dtf|apron|pants|shorts/i, "T-Shirt"],
];

export function previewProductFor(productType: string | null | undefined): PreviewModel | null {
  const name = (productType ?? "").trim();
  if (!name) return null;
  const exact = MODELS.find((m) => m.toLowerCase() === name.toLowerCase());
  if (exact) return exact;
  for (const [re, model] of RULES) if (re.test(name)) return model;
  return "T-Shirt";
}
