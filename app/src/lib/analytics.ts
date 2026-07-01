/**
 * Env-driven analytics: Google Analytics 4 + Meta (Facebook) Pixel.
 *
 * IDs come from build-time env (no hard-coded / fake IDs):
 *   VITE_GA_MEASUREMENT_ID   e.g. G-XXXXXXXXXX
 *   VITE_META_PIXEL_ID       e.g. 1234567890
 * If an ID is unset, that tag is simply skipped — nothing loads, no console noise.
 * This keeps the site clean until ASK Creative provides its real tracking IDs.
 */

const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || undefined;
const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim() || undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: any;
    _fbq?: unknown;
  }
}

let initialised = false;

/** Loads GA4 + Meta Pixel tags once, only for IDs that are configured. */
export function initAnalytics(): void {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;

  if (GA_ID) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function gtag() { window.dataLayer!.push(arguments); };
    window.gtag('js', new Date());
    // SPA: page_view is sent manually on each route change (below).
    window.gtag('config', GA_ID, { send_page_view: false });
  }

  if (PIXEL_ID) {
    /* eslint-disable */
    // @ts-ignore — official Meta Pixel bootstrap snippet
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
}

/** Fire a SPA page-view (call on every route change). */
export function trackPageView(path: string): void {
  if (typeof window === 'undefined') return;
  if (GA_ID && window.gtag) {
    window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: document.title });
  }
  if (PIXEL_ID && window.fbq) {
    window.fbq('track', 'PageView');
  }
}

/** Standard-event mapping so Meta Pixel records conversions with native events. */
const PIXEL_STD: Record<string, string> = {
  quote_submitted: 'Lead',
  enquiry_submitted: 'Lead',
  design_submitted: 'Lead',
  contact_submitted: 'Contact',
};

/** Track a named event (conversions like quote_submitted, contact_submitted, …). */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  if (GA_ID && window.gtag) window.gtag('event', name, params);
  if (PIXEL_ID && window.fbq) {
    const std = PIXEL_STD[name];
    if (std) window.fbq('track', std, params);
    else window.fbq('trackCustom', name, params);
  }
}

export const analyticsEnabled = Boolean(GA_ID || PIXEL_ID);
