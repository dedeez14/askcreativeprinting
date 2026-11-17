import type {
  DesignSubmissionPayload,
  EnquiryPayload,
  QuoteRequestPayload,
} from '@/types/landing';

/**
 * The v1 path: POST /quote-requests, used while the ERP does not serve the Stage 4 endpoints.
 *
 * That endpoint validates `product_snapshot` against a FIXED key whitelist
 * (App\Http\Requests\Api\Landing\StoreQuoteRequestRequest: array:name,product_type,product,
 * category,color,collar,size,sizes,size_breakdown,qty,quantity,company,deadline,delivery_date,
 * source,price_estimate,design_image_url,design) — any other top-level key is a 422. `size_breakdown`
 * must be a STRING there, and `design` has no shape of its own.
 *
 * So everything the Stage 4 contract carries and v1 has no column for travels inside `design`:
 * sales still receives the complete request, and nothing a visitor typed is lost.
 */

const SNAPSHOT_SIZE_LIMIT = 2000;

/** "S=5, M=10, L=10" — the human-readable breakdown v1 stores as a string. */
function sizeSummary(sizes?: Record<string, number>): string | undefined {
  if (!sizes) return undefined;
  const entries = Object.entries(sizes).filter(([, q]) => Number(q) > 0);
  if (entries.length === 0) return undefined;
  return entries.map(([size, qty]) => `${size}=${qty}`).join(', ').slice(0, SNAPSHOT_SIZE_LIMIT);
}

/** Drop the undefined values so the snapshot carries only keys with a value. */
const compact = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && v !== null));

/** The complete B4 enquiry as the legacy quote request can carry it. */
export function enquiryToQuoteRequest(payload: EnquiryPayload): QuoteRequestPayload {
  return {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    notes: payload.notes,
    product_snapshot: compact({
      source: 'quotation_form',
      product_type: payload.product_type ?? payload.product_name_snapshot,
      category: payload.product_category,
      company: payload.company_name,
      color: payload.design_details?.main_color,
      collar: payload.design_details?.collar_type,
      sizes: payload.size_breakdown,
      size_breakdown: sizeSummary(payload.size_breakdown),
      quantity: payload.total_qty,
      deadline: payload.event_date,
      delivery_date: payload.delivery_date,
      // Everything the v1 snapshot has no key for.
      design: compact({
        erp_job_type: payload.erp_job_type,
        product_id: payload.product_id,
        design_details: payload.design_details,
        nameset_data: payload.nameset_data,
        priority: payload.priority,
        delivery_method: payload.delivery_method,
        delivery_address: payload.delivery_address,
        uploaded_files: payload.uploaded_files,
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
        page_url: payload.page_url,
        attn: payload.attn,
        ic_tin_no: payload.ic_tin_no,
        trading_licence_no: payload.trading_licence_no,
        chat_ref: payload.chat_ref,
      }),
    }),
    website: payload.website,
    _t: payload._t,
  };
}

/** One finished design-tool configuration as the legacy quote request can carry it. */
export function designToQuoteRequest(payload: DesignSubmissionPayload): QuoteRequestPayload {
  const total = Object.values(payload.sizes ?? {}).reduce((a, b) => a + Number(b || 0), 0);
  return {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    notes: payload.notes,
    product_snapshot: compact({
      source: 'online_design_studio',
      product: payload.product,
      category: payload.category,
      company: payload.company_name,
      color: payload.design?.main_color,
      collar: payload.design?.collar,
      sizes: payload.sizes,
      size_breakdown: sizeSummary(payload.sizes),
      quantity: total > 0 ? total : undefined,
      deadline: payload.event_date,
      delivery_date: payload.delivery_date,
      // The rendered front (or only) side of an online-editor design — a link the inbox can open.
      design_image_url: payload.previews?.[0]?.url && payload.previews[0].url.length <= 1000 ? payload.previews[0].url : undefined,
      design: compact({
        design: payload.design,
        editor: payload.editor,
        previews: payload.previews?.map(({ side, path, original_name }) => ({ side, path, original_name })),
        placements: payload.placements,
        nameset: payload.nameset,
        artwork: payload.artwork,
        preview: payload.preview,
        priority: payload.priority,
        delivery_method: payload.delivery_method,
        delivery_address: payload.delivery_address,
      }),
    }),
    website: payload.website,
    _t: payload._t,
  };
}
