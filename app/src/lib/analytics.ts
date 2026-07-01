/**
 * Google Analytics 4 + Meta (Facebook) Pixel — IDs are ADMIN-EDITABLE.
 *
 * The ASK Creative admin enters the IDs in the ERP Landing → Settings form
 * ("Analytics & Tracking"); they arrive via GET /api/landing/v1/settings as
 * settings.analytics.{ga_measurement_id, meta_pixel_id}. The app calls
 * initAnalytics(gaId, pixelId) once settings load. Env vars
 * (VITE_GA_MEASUREMENT_ID / VITE_META_PIXEL_ID) act only as an optional
 * fallback for local/dev. If an ID is empty, that tag never loads — no fake
 * IDs, no console noise. Each tag is loaded at most once, whenever its ID
 * first becomes available (so calling this before + after settings load is safe).
 */

const ENV_GA = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || undefined;
const ENV_PIXEL = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim() || undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: any;
    _fbq?: unknown;
  }
}

let gaLoaded = false;
let pixelLoaded = false;

/**
 * Load GA4 + Meta Pixel tags for whichever IDs are provided (admin settings
 * first, env fallback). Idempotent per tag — safe to call repeatedly.
 */
export function initAnalytics(gaId?: string | null, pixelId?: string | null): void {
  if (typeof window === 'undefined') return;

  const ga = (gaId ?? ENV_GA ?? undefined) || undefined;
  const pixel = (pixelId ?? ENV_PIXEL ?? undefined) || undefined;

  if (ga && !gaLoaded) {
    gaLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function gtag() { window.dataLayer!.push(arguments); };
    window.gtag('js', new Date());
    // SPA: page_view is sent manually on each route change.
    window.gtag('config', ga, { send_page_view: false });
    // Count the current page now (init typically happens just after first paint).
    trackPageView(window.location.pathname);
  }

  if (pixel && !pixelLoaded) {
    pixelLoaded = true;
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
    window.fbq('init', pixel);
    window.fbq('track', 'PageView');
  }
}

/** Fire a SPA page-view (call on every route change). No-op until a tag is loaded. */
export function trackPageView(path: string): void {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: document.title });
  }
  if (window.fbq) {
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
  if (window.gtag) window.gtag('event', name, params);
  if (window.fbq) {
    const std = PIXEL_STD[name];
    if (std) window.fbq('track', std, params);
    else window.fbq('trackCustom', name, params);
  }
}
