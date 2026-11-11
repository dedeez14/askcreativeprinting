import { DEFAULT_DATA_DELETION, DEFAULT_PRIVACY, DEFAULT_TERMS } from '@/content/legalDefaults';
import type { LandingSettings } from '@/types/landing';

export type LegalKey = 'privacy-policy' | 'terms-of-service' | 'data-deletion';

/** GET /legal/{key} — the ERP's version of a legal page (contact tokens already filled in). */
export interface LegalPageData {
  key: LegalKey;
  title: string;
  content: string;
  format: 'markdown';
  /** Y-m-d */
  updated_at: string;
  customised: boolean;
}

export interface LegalPageMeta {
  key: LegalKey;
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  defaultContent: string;
}

/** The date the default texts were written — same as the ERP's LegalPages::DEFAULT_UPDATED_AT. */
export const LEGAL_DEFAULT_UPDATED_AT = '2026-11-11';

export const LEGAL_PAGES: Record<LegalKey, LegalPageMeta> = {
  'privacy-policy': {
    key: 'privacy-policy',
    path: '/privacy-policy',
    title: 'Privacy Policy',
    seoTitle: 'Privacy Policy | ASK Creative Sdn Bhd',
    description:
      'How ASK Creative Sdn Bhd collects, uses and protects your personal data under the Malaysia Personal Data Protection Act 2010 (PDPA).',
    defaultContent: DEFAULT_PRIVACY,
  },
  'terms-of-service': {
    key: 'terms-of-service',
    path: '/terms-of-service',
    title: 'Terms of Service',
    seoTitle: 'Terms of Service | ASK Creative Sdn Bhd',
    description:
      'The terms for quotations, orders, artwork, proofs, payments, production, delivery and refunds at ASK Creative Sdn Bhd, Sabah, Malaysia.',
    defaultContent: DEFAULT_TERMS,
  },
  'data-deletion': {
    key: 'data-deletion',
    path: '/data-deletion',
    title: 'User Data Deletion',
    seoTitle: 'User Data Deletion | ASK Creative Sdn Bhd',
    description:
      'How to ask ASK Creative Sdn Bhd to delete your personal data, including data from WhatsApp messages, and what we must keep by law.',
    defaultContent: DEFAULT_DATA_DELETION,
  },
};

/** Same fallbacks as the footer — used when the settings have no contact detail. */
const CONTACT_FALLBACKS = {
  email: 'sales@askcreativeprinting.com',
  phone: '088 205 423',
  address: 'ASK Creative, No A6-1, Ground Floor, Block A, Kepayan Perdana, 88200 Kota Kinabalu, Sabah, Malaysia',
};

/** Fill {{email}} / {{phone}} / {{address}} in a default text from the site settings. */
export function fillLegalTokens(text: string, settings?: LandingSettings | null): string {
  const values: Record<string, string> = {
    email: settings?.contact_email?.trim() || CONTACT_FALLBACKS.email,
    phone: settings?.contact_phone?.trim() || CONTACT_FALLBACKS.phone,
    address: settings?.contact_address?.trim() || CONTACT_FALLBACKS.address,
  };
  return text.replace(/\{\{(email|phone|address)\}\}/g, (_, token: string) => values[token]);
}

/** "2026-11-11" → "11 November 2026" (no timezone shift). */
export function formatLegalDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month} ${m[1]}` : ymd;
}
