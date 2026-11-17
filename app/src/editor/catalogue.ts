import { ERP_ORIGIN } from "../lib/api";
import { sameOriginMedia } from "../lib/media";
import type { DesignDoc, FillSpec, Layer, PanelId } from "./types";

/**
 * The Design Catalogue (client, 17-Nov-2026: "di online design bisa ditambahkan design catalog dari ask dan bisa di
 * modifikasi sesuai user berdasarkan catalogue tersebut"): ready designs ASK publishes in the ERP (Website → Design
 * Catalogue). A customer starts from one and customises it; the job is then a ready design — no design fee, free
 * revisions.
 *
 * How a design gets there: an ASK admin opens this studio with ?catalogue=1, designs, and presses "Export for
 * catalogue". The browser saves the design file below and a preview PNG; the admin uploads both in the ERP, which
 * re-checks the file and copies its pictures to public storage. Nothing here talks to the ERP with credentials.
 */

export const CATALOGUE_FORMAT = "ask-design-catalogue-v1";

/** The design file ("Export for catalogue") and the `design` the ERP serves back for an item. */
export interface CatalogueDesign {
  format: typeof CATALOGUE_FORMAT;
  product: string;
  colors?: { main?: string; secondary?: string };
  collar?: string;
  sleeve?: string;
  fabric?: string;
  doc: DesignDoc;
}

/** One item of GET /design-catalogue (the list carries no `design`; GET /design-catalogue/{id} does). */
export interface CatalogueItem {
  id: number;
  name: string;
  category: string | null;
  tags: string[];
  description: string | null;
  product_id: number | null;
  product: string | null;
  preview_url: string | null;
  design?: CatalogueDesign;
}

/** What the studio keeps of the item a design started from (sent with the enquiry as catalogue_item_id). */
export interface CatalogueRef { id: number; name: string }

/**
 * The editor document of a catalogue item, ready to edit: pictures read through this site's /erp-media pass-through
 * (the editor draws them on a canvas, which needs a same-origin source), no upload list of its own.
 */
export function docFromCatalogue(design: CatalogueDesign): DesignDoc {
  const d = design.doc;
  const media = (src: string) => sameOriginMedia(src) ?? src;
  const layers = (Array.isArray(d.layers) ? d.layers : []).map((l) =>
    (l.type === "image" ? { ...l, src: media(l.src), path: undefined } : l) as Layer);
  const fills = Object.fromEntries(
    Object.entries(d.fills && !Array.isArray(d.fills) ? d.fills : {}).map(([panel, f]) => [
      panel,
      f && f.kind === "image" ? { ...f, src: media(f.src), path: undefined } : f,
    ]),
  ) as Partial<Record<PanelId, FillSpec>>;
  return { v: 1, mode: d.mode === "full" ? "full" : "simple", layers, fills, continuous: d.continuous, assets: [] };
}

/** /erp-media/<path> (this site's pass-through) back to the ERP's own /storage/<path> URL the ERP recognises. */
const erpUrl = (src: string): string =>
  src.startsWith("/erp-media/") ? `${ERP_ORIGIN}/storage/${src.slice("/erp-media/".length)}` : src;

/**
 * The design file of "Export for catalogue". Pictures keep their upload `path` (the ERP copies the file from there);
 * a picture that came from the catalogue itself keeps its ERP URL instead.
 */
export function catalogueExport(doc: DesignDoc, ctx: {
  product: string; main: string; secondary?: string; collar?: string; sleeve?: string; fabric?: string;
}): CatalogueDesign {
  const layers = doc.layers.map((l) => (l.type === "image" ? { ...l, src: erpUrl(l.src) } : l));
  const fills = Object.fromEntries(Object.entries(doc.fills).map(([panel, f]) => [
    panel, f && f.kind === "image" ? { ...f, src: erpUrl(f.src) } : f,
  ])) as Partial<Record<PanelId, FillSpec>>;
  return {
    format: CATALOGUE_FORMAT,
    product: ctx.product,
    colors: { main: ctx.main, secondary: ctx.secondary || undefined },
    collar: ctx.collar || undefined,
    sleeve: ctx.sleeve || undefined,
    fabric: ctx.fabric || undefined,
    doc: { ...doc, layers, fills, assets: [] },
  };
}

/** Save a file from the browser (the export's .json and .png). */
export function saveFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
