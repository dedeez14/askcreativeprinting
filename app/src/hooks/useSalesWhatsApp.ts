import { useSettings } from './useSettings';

/**
 * 06 §6 p.3 / §9 p.4 — the WhatsApp number a CTA opens comes from the admin's sales team
 * (GET /settings → sales_team, maintained in the ERP), not from a constant in this repo. Changing a
 * sales person must not need a developer.
 *
 * The constant below is the last-resort fallback for a first paint or an unreachable API; it is the
 * same first number the footer has always shown.
 */
export const FALLBACK_SALES_PHONE = '60102174774';

export function useSalesWhatsApp(): { phone: string; name: string | null; link: (text?: string) => string } {
  const { data: settings } = useSettings();
  const first = settings?.sales_team?.[0];
  const phone = (first?.phone || FALLBACK_SALES_PHONE).replace(/[^0-9]/g, '');

  return {
    phone,
    name: first?.name ?? null,
    link: (text?: string) => `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`,
  };
}
