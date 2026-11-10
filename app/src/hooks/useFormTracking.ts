import { useCallback, useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import { API_BASE } from '@/lib/api';
import { captureAttribution } from '@/lib/attribution';
import { ENQUIRY_V2 } from '@/lib/features';

const SESSION_KEY = 'ask_form_session';

/** A random id for this browser session (sessionStorage, best effort — falls back to a per-page id). */
let memorySession = '';
function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
  } catch {
    /* storage blocked */
  }
  if (!memorySession) {
    memorySession =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
  try {
    sessionStorage.setItem(SESSION_KEY, memorySession);
  } catch {
    /* storage blocked */
  }
  return memorySession;
}

/**
 * 06 B15 — report the funnel to the ERP (POST /form-events) so abandoned quotation forms and campaign
 * performance show up in sales reporting. Only when ENQUIRY_V2 is on (the endpoint is new). A
 * text/plain body keeps it a CORS "simple" request (no preflight); every failure is swallowed — tracking
 * must never affect the visitor.
 */
function reportToErp(form: string, event: 'start' | 'abandon' | 'submit', seconds?: number): void {
  if (!ENQUIRY_V2 || typeof window === 'undefined') return;
  try {
    const attribution = captureAttribution();
    const body = JSON.stringify({
      form,
      event,
      session_id: sessionId(),
      ...(seconds !== undefined ? { seconds } : {}),
      page: window.location.pathname,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
    });
    const url = `${API_BASE}/form-events`;
    const type = 'text/plain;charset=UTF-8';
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      if (navigator.sendBeacon(url, new Blob([body], { type }))) return;
    }
    void fetch(url, { method: 'POST', keepalive: true, headers: { 'Content-Type': type }, body }).catch(() => undefined);
  } catch {
    /* tracking is best-effort */
  }
}

/**
 * Funnel tracking for lead forms (brief B15 — enquiry source, conversion,
 * abandoned forms). Fires:
 *   - `form_start`     once, the first time the visitor interacts with the form.
 *   - `form_abandoned` if they leave (route change or tab close) after starting
 *     but before a successful submit — with the seconds spent on the form.
 * Conversion (`*_submitted`) events already fire from the submit mutation hooks; markSubmitted adds the
 * ERP `submit` event. With VITE_ENQUIRY_V2 on, start / abandon / submit are also sent to the ERP's
 * POST /form-events (see reportToErp).
 * No-op until an analytics tag is configured (admin settings), so it's inert by
 * default and never throws.
 */
export function useFormTracking(formName: string) {
  const started = useRef(false);
  const startedAt = useRef(0);
  const done = useRef(false);
  const reportedSubmit = useRef(false);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    startedAt.current = Date.now();
    trackEvent('form_start', { form: formName });
    reportToErp(formName, 'start');
  }, [formName]);

  const markSubmitted = useCallback(() => {
    done.current = true;
    if (reportedSubmit.current) return;
    reportedSubmit.current = true;
    const seconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : undefined;
    reportToErp(formName, 'submit', seconds);
  }, [formName]);

  useEffect(() => {
    const fire = () => {
      if (started.current && !done.current) {
        done.current = true; // fire at most once
        const seconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
        trackEvent('form_abandoned', { form: formName, seconds });
        reportToErp(formName, 'abandon', seconds);
      }
    };
    window.addEventListener('beforeunload', fire);
    return () => {
      window.removeEventListener('beforeunload', fire);
      fire(); // also fires when navigating away (component unmount)
    };
  }, [formName]);

  return { start, markSubmitted };
}
