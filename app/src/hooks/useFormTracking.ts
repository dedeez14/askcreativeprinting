import { useCallback, useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

/**
 * Funnel tracking for lead forms (brief B15 — enquiry source, conversion,
 * abandoned forms). Fires:
 *   - `form_start`     once, the first time the visitor interacts with the form.
 *   - `form_abandoned` if they leave (route change or tab close) after starting
 *     but before a successful submit — with the seconds spent on the form.
 * Conversion (`*_submitted`) events already fire from the submit mutation hooks.
 * No-op until an analytics tag is configured (admin settings), so it's inert by
 * default and never throws.
 */
export function useFormTracking(formName: string) {
  const started = useRef(false);
  const startedAt = useRef(0);
  const done = useRef(false);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    startedAt.current = Date.now();
    trackEvent('form_start', { form: formName });
  }, [formName]);

  const markSubmitted = useCallback(() => {
    done.current = true;
  }, []);

  useEffect(() => {
    const fire = () => {
      if (started.current && !done.current) {
        done.current = true; // fire at most once
        const seconds = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0;
        trackEvent('form_abandoned', { form: formName, seconds });
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
