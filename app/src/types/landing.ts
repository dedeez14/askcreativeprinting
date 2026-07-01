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
  category: string | null;
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

export interface EnquiryNamesetEntry { name?: string; number?: string; size?: string }

export interface EnquiryPayload {
  // Customer
  name: string;
  email: string;
  phone: string;
  company_name?: string;

  // Product reference
  product_id?: number;
  product_category?: string;
  product_name_snapshot?: string;
  erp_job_type?: string;

  // Spec
  design_details?: {
    design_concept?: string;
    main_color?: string;
    secondary_color?: string;
    collar_type?: string;
    fabric_type?: string;
    sleeve_type?: string;
    design_notes?: string;
  };
  total_qty?: number;
  size_breakdown?: Record<string, number>;
  nameset_data?: EnquiryNamesetEntry[];

  // Deadline + delivery
  event_date?: string;        // YYYY-MM-DD
  delivery_date?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  delivery_method?: 'pickup' | 'delivery' | 'courier';
  delivery_address?: string;

  // Uploaded design files (already POST'd to /uploads — server returns these descriptors)
  uploaded_files?: Array<{
    path: string;
    original_name: string;
    mime: string;
    size: number;
  }>;

  // Anti-bot
  website: string;            // honeypot — must be empty
  _t: number;                 // form-open epoch (seconds)

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
  created_at: string;
}
