/** 06 §15 p.4 — GET /settings `showroom` (admin-editable in the ERP). Absent on an older ERP. */
export interface LandingShowroom {
  enabled: boolean;
  title: string | null;
  address: string | null;
  opening_hours: Array<{ day: string; hours: string }> | null;
  map_url: string | null;
  note: string | null;
}

export interface LandingSettings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  logo_url: string | null;
  logo_light_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  analytics?: {
    ga_measurement_id: string | null;
    meta_pixel_id: string | null;
  };
  company_lat: number | null;
  company_lng: number | null;
  social: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    youtube?: string | null;
    linkedin?: string | null;
  };
  theme_colors: { primary?: string; accent?: string; dark?: string };
  cta: { title?: string; subtitle?: string; button_text?: string; button_url?: string };
  hero_stats: Array<{ value: string; label: string }>;
  navbar_menu: Array<{ label: string; url: string; type: string; visible: boolean }>;
  sales_team: Array<{ name: string; phone: string }>;
  trust_points: Array<{ icon: string; text: string }>;
  why_choose: Array<{ icon: string; title: string; desc: string }>;
  order_steps: Array<{ title: string; desc: string }>;
  production_images: Array<{ src: string; alt: string }>;
  contact_subjects: string[];
  operating_hours: Array<{ day: string; hours: string }>;
  showroom?: LandingShowroom | null;
  /** 06 B4 — the ERP Job Type master's website rows (absent on an older ERP: the form keeps its own list). */
  job_types?: Array<{ value: string; label: string }>;
  footer_links: Array<{ title: string; links: Array<{ label: string; url: string }> }>;
  section_labels?: Record<string, string>;
  visi_misi: {
    visi_title?: string;
    visi_content?: string | null;
    misi_title?: string;
    misi_items?: string[];
    visi_is_show?: boolean;
    misi_is_show?: boolean;
  };
}

export interface LandingHero {
  id: number;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_url: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface LandingFeature {
  id: number;
  icon: string | null;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface LandingTestimonial {
  id: number;
  name: string;
  role: string | null;
  company: string | null;
  message: string;
  photo_url: string | null;
  rating: number | null;
}

export interface LandingFaq {
  id: number;
  question: string;
  answer: string;
  category?: string | null;
  /** 06 §12 — product / SEO page slugs this answer is also shown on. */
  applies_to?: string[];
  sort_order: number;
}

export interface LandingBrand {
  id: number;
  name: string;
  logo_url: string | null;
  url: string | null;
  sort_order: number;
}

export interface LandingGallery {
  id: number;
  title: string | null;
  description: string | null;
  image_url: string | null;
  image_path?: string | null;
  category: string | null;
  /** 06 §10 — "product type, client type if allowed, quantity, printing method". */
  product_type?: string | null;
  client_type?: string | null;
  quantity?: number | null;
  printing_method?: string | null;
}

/** 06 §11 — one admin-managed SEO / service landing page. */
export interface LandingPage {
  slug: string;
  aliases: string[];
  title: string;
  excerpt: string | null;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  image_url: string | null;
  starting_price: number | null;
  price_currency: string;
  product_slug: string | null;
  gallery_category: string | null;
  quotation_url: string;
  product?: LandingProduct | null;
  faqs?: LandingFaq[];
  gallery?: LandingGallery[];
}

/** 06 §5 — the read-only estimate of POST /estimate. Never a quotation. */
export interface PriceEstimate {
  product: { id: number; slug: string; name: string };
  total_qty: number;
  currency: string;
  unit_price_min: number | null;
  unit_price_max: number | null;
  total_min: number | null;
  total_max: number | null;
  tier: string | null;
  custom_pricing: boolean;
  moq: number;
  below_moq: boolean;
  moq_message: string | null;
  priced: boolean;
  disclaimer: string;
}

export interface LandingAbout {
  visi_misi: LandingSettings['visi_misi'];
  hero_stats: LandingSettings['hero_stats'];
  section_labels?: Record<string, string>;
}

export interface LandingBootstrap {
  settings: LandingSettings;
  heroes: LandingHero[];
  features: LandingFeature[];
  about: LandingAbout;
  brands: LandingBrand[];
}

export interface ContactSubmissionPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string | null;
  message: string;
  website: string;
  _t: number;
}

export interface QuoteRequestPayload {
  name: string;
  email: string;
  phone?: string;
  product_snapshot: Record<string, unknown>;
  notes?: string;
  website: string;
  _t: number;
}

export interface ContactSubmissionResponse {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export interface QuoteRequestResponse {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

// ─────────────── Phase 1+2 — public catalogue + enquiry ───────────────

export interface LandingProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  product_count: number;
  sort_order: number;
}

export interface LandingProductOptionItem { code: string; name: string }
export interface LandingProductOptions {
  size_chart?: string[];
  fabric_options?: LandingProductOptionItem[];
  collar_options?: LandingProductOptionItem[];
  sleeve_options?: LandingProductOptionItem[];
  finishing_options?: LandingProductOptionItem[];
  material_options?: LandingProductOptionItem[];
  nameset_supported?: boolean;
  [key: string]: unknown;
}

export interface LandingProduct {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  featured_image: string | null;
  moq: number;
  lead_time_days: number | null;
  price_min: string | null;
  price_max: string | null;
  price_currency: string;          // 'MYR'
  erp_job_type: string | null;
  is_featured: boolean;
  category: LandingProductCategory | null;
  category_slug: string | null;

  // detail-only fields
  description?: string | null;
  gallery_images?: string[];
  options?: LandingProductOptions;
  meta_title?: string | null;
  meta_description?: string | null;
}


// ─────────── Stage 4 — the ERP enquiry contract (06 B4/B10/B15) ───────────
// Field names, value lists and limits below are the ones the ERP validates in
// App\Http\Requests\Api\Landing\StoreEnquiryRequest — do not invent others.

/** App\Support\JobTypes::CATALOGUE — the only job types the ERP accepts from the website. */
// 06 B4 "… DESIGN_ONLY, and future types": the ERP may add codes (GET /settings → job_types), so any string is allowed.
export type ErpJobType = 'SUBLIMATION' | 'BANNER' | 'DTF_HEATPRESS' | 'DESIGN_ONLY' | 'OTHER' | (string & {});

/** 06 B4 "Priority should map to LOW/NORMAL/HIGH/URGENT". */
export type EnquiryPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type DeliveryMethod = 'pickup' | 'delivery' | 'courier';

/** What a file is for (06 B10 file naming ASK-[Enquiry]-[Customer]-[Product]-[FileType]-[Version]). */
export type UploadRole = 'logo' | 'artwork' | 'reference' | 'sizelist' | 'nameset';

/** The descriptor POST /uploads returns; it is handed straight back to the ERP. */
export interface UploadedFile {
  path: string;            // landing/uploads/YYYYMM/<random>-<slug>.<ext> — chosen by the ERP
  url: string;
  original_name: string;
  mime: string;
  ext: string;
  size: number;
}

/** One entry of `uploaded_files` on the enquiry (`role` is optional but drives the ASK name). */
export interface UploadedFileRef {
  path: string;
  original_name?: string;
  mime?: string;
  size?: number;
  role?: UploadRole;
}

export interface EnquiryNamesetEntry {
  name?: string;
  number?: string;
  size?: string;
  remark?: string;
}

export interface EnquiryPayload {
  // Customer — all four required by the ERP
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  // The three lines of the sales team's "Details Quotation" chat form — optional (17-Nov-2026)
  attn?: string;
  ic_tin_no?: string;
  trading_licence_no?: string;
  // The ERP WhatsApp chat this form was sent from (?chat= of the link, lib/chatRef)
  chat_ref?: string;

  // Product
  product_id?: number;              // a catalogue row, when the enquiry starts on a product page
  product_category?: string;
  product_name_snapshot?: string;
  product_type?: string;            // what the website calls the product when there is no catalogue row
  erp_job_type?: ErpJobType;

  // Design / specs → the designer's brief text
  design_details?: {
    design_concept?: string;
    main_color?: string;
    secondary_color?: string;
    collar_type?: string;
    fabric_type?: string;
    sleeve_type?: string;
    design_notes?: string;
    name_number_required?: string;
  };

  // Quantity — total and/or the size matrix (the ERP sums the matrix when total_qty is absent)
  total_qty?: number;
  size_breakdown?: Record<string, number>;

  // Nameset — rows typed in; a CSV/XLS/XLSX list uploaded with role 'nameset' is read server-side
  nameset_data?: EnquiryNamesetEntry[];

  // Deadline + delivery
  event_date?: string;              // YYYY-MM-DD
  delivery_date?: string;           // YYYY-MM-DD
  priority?: EnquiryPriority;
  delivery_method?: DeliveryMethod;
  delivery_address?: string;

  // Files already sent to POST /uploads (max 20)
  uploaded_files?: UploadedFileRef[];

  // 06 B15 — enquiry source / campaign
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  page_url?: string;

  // Anti-bot (kept): honeypot must stay empty, _t is the form-open epoch (min 3 s before submit)
  website: string;
  _t: number;

  notes?: string;
}

export interface EnquiryResponse {
  id: number;
  enquiry_no: string;
  name: string;
  email: string;
  phone: string;
  company_name: string | null;
  product_id: number | null;
  product_name: string | null;
  total_qty: number;
  size_breakdown: Record<string, number> | null;
  event_date: string | null;
  delivery_date: string | null;
  priority: string;
  status: string;
  assigned_sales: string | null;
  whatsapp_url?: string;
  /** Stage 4+: a link the customer can open to follow the enquiry (ERP /p/track/{token}). */
  tracking_url?: string | null;
  tracking_token?: string | null;
  created_at: string;
  /** 17-Nov-2026: what happened to the confirmation e-mail — promise it only when email_promised. */
  acknowledgement?: EnquiryAcknowledgement;
}

/**
 * The confirmation e-mail of an enquiry, as the ERP reports it in the submit reply.
 *   status          sent | queued | failed (the mail server refused it) | skipped (no address)
 *   email_promised  true only when it was sent, or is queued while the mail server is accepting mail
 *   retry_queued    the ERP will still try again by itself
 */
export interface EnquiryAcknowledgement {
  status: 'sent' | 'queued' | 'failed' | 'skipped';
  email_promised: boolean;
  retry_queued: boolean;
}

// ─────────── Stage 4 — Online Design Tool (doc 07, 06 B5) ───────────
// GET  /design-submissions/options  → DesignStudioOptions (admin-editable lists; the server
//                                     validates every submitted value against them)
// POST /design-submissions          → DesignSubmissionResponse

export interface DesignStudioOptionProduct {
  id: number;
  name: string;
  category: string;
  /** 06 §5 — the catalogue row that prices this product (null = no estimate for it). */
  product_slug?: string | null;
  moq?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  price_currency?: string;
  lead_time_days?: number | null;
}

export interface DesignStudioOptions {
  contract: string;
  enabled: boolean;
  categories: string[];
  collars: string[];
  fabrics: string[];
  sleeves: string[];
  sizes: string[];
  colors: string[];                  // empty = any #RRGGBB is accepted
  placements: string[];
  nameset_positions: string[];
  priorities: EnquiryPriority[];
  delivery_methods: DeliveryMethod[];
  min_quantity: number;
  max_quantity: number;
  products: DesignStudioOptionProduct[];
  /** 06 §5 "final price must remain subject to sales confirmation". */
  price_disclaimer?: string;
}

export interface DesignSubmissionPlacement {
  position: string;                  // one of options.placements
  artwork_index?: number;            // index into `artwork`
  note?: string;
}

export interface DesignSubmissionNameset {
  required?: boolean;
  position?: string;                 // one of options.nameset_positions
  number_style?: string;
  remark?: string;
  entries?: EnquiryNamesetEntry[];
}

export interface DesignSubmissionPayload {
  // Step 4 — contact
  name: string;
  email: string;
  phone: string;
  company_name?: string;

  // Step 1 — product
  category: string;
  product: string;

  // Step 2 — customise (main_color is required by the ERP)
  design: {
    design_concept?: string;
    main_color: string;
    secondary_color?: string;
    collar?: string;
    fabric?: string;
    sleeve?: string;
    design_notes?: string;
  };
  sizes: Record<string, number>;     // at least one size, each qty >= 1, total within the bounds
  placements?: DesignSubmissionPlacement[];
  nameset?: DesignSubmissionNameset;

  // Step 3 — artwork (and optionally the customer's own preview copy)
  artwork?: Array<{ path: string; original_name?: string }>;
  preview?: { path: string; original_name?: string };
  /**
   * The online editor's design (layers, fills, print areas — contract "ask-design-editor-v1") and the
   * PNG previews it rendered per side. The live ERP ignores these two keys on POST /design-submissions
   * (its rules do not list them yet) — the previews also travel in `preview` / `artwork` and a text
   * reading in design.design_notes. The legacy quote request stores both inside product_snapshot.design.
   */
  editor?: Record<string, unknown>;
  previews?: Array<{ side: 'front' | 'back'; path: string; original_name?: string; url?: string }>;

  // Step 4 — deadline + delivery
  event_date?: string;
  delivery_date?: string;
  priority?: EnquiryPriority;
  delivery_method?: DeliveryMethod;
  delivery_address?: string;
  notes?: string;

  // Anti-bot, same contract as the quotation form
  website: string;
  _t: number;
}

export interface DesignSubmissionResponse {
  enquiry_no: string;
  whatsapp_url?: string | null;
  tracking_url?: string | null;
  tracking_token?: string | null;
  total_qty: number;
  files: number;
  preview: boolean;
  summary: string;                   // the structured brief summary (06 B5)
}

// ─────────── Stage 4 — customer order tracking (06 B7/B8/B9/B14) ───────────
// GET /p/job-status/{token} — plain JSON, customer-facing fields ONLY.

export type JobStatusStepState = 'done' | 'current' | 'pending';

export interface JobStatusStep {
  key: string;
  label: string;
  state: JobStatusStepState;
}

export interface JobStatusResponse {
  job_number: string | null;
  job_title: string | null;
  cancelled: boolean;
  status: string | null;
  status_label: string | null;
  steps: JobStatusStep[];
  updated_at: string | null;
}
