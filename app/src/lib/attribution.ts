/**
 * Where the enquiry came from (06 B15 "track enquiry source, product interest, … campaign
 * performance"). The campaign parameters arrive on the landing URL, but the visitor usually
 * submits from another page, so they are kept for the session and sent with the enquiry —
 * the ERP stores them on the enquiry (utm_source / utm_medium / utm_campaign / page_url) so
 * sales reporting can group by source.
 *
 * Nothing here identifies a person: campaign tags and the page URL only.
 */

const KEY = 'ask_attribution';

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

const clean = (value: string | null, max: number): string | undefined => {
  const v = (value ?? '').trim();
  return v === '' ? undefined : v.slice(0, max);
};

/** Read the campaign tags of the current URL, remembering the first ones seen this session. */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return {};

  let stored: Attribution = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Attribution;
  } catch {
    stored = {};
  }

  const q = new URLSearchParams(window.location.search);
  const fresh: Attribution = {
    utm_source: clean(q.get('utm_source'), 80),
    utm_medium: clean(q.get('utm_medium'), 80),
    utm_campaign: clean(q.get('utm_campaign'), 120),
  };

  const merged: Attribution = {
    utm_source: stored.utm_source ?? fresh.utm_source,
    utm_medium: stored.utm_medium ?? fresh.utm_medium,
    utm_campaign: stored.utm_campaign ?? fresh.utm_campaign,
  };

  if (fresh.utm_source || fresh.utm_medium || fresh.utm_campaign) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(merged));
    } catch {
      /* private mode / storage blocked — attribution is best-effort */
    }
  }

  return merged;
}

/** The campaign tags plus the page the visitor submitted from, ready to spread into a payload. */
export function attributionFields(): Attribution & { page_url?: string } {
  const a = captureAttribution();
  const page = typeof window === 'undefined' ? undefined : window.location.href.slice(0, 500);
  return { ...a, page_url: page };
}
