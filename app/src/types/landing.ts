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
  subject?: string;
  message: string;
  website: string;
  _t: number;
}

export interface QuoteRequestPayload {
  name: string;
  email: string;
  phone?: string;
  product_snapshot: {
    name: string;
    color: string;
    sizes: Record<string, number>;
    qty: number;
    price_estimate: number;
    design_image_url?: string;
  };
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
