/**
 * Build-time feature switches.
 *
 * VITE_ENQUIRY_V2 — the Stage 4 ERP contract (06 B3/B4/B5/B6-B9/B10/B15).
 *
 * The live ERP (erp.askcreativeprinting.com) does NOT serve the Stage 4 endpoints yet:
 * POST /design-submissions, GET /design-submissions/options and GET /p/job-status/{token}
 * only exist once the ERP promotion ships. So this switch is OFF by default and the site keeps
 * the behaviour it has today:
 *
 *   OFF (default)  Quotation + Online Design Tool submit through POST /quote-requests;
 *                  Track My Order opens the ERP tracking page in a new document.
 *   ON             Quotation submits the complete B4 enquiry to POST /enquiries with its
 *                  uploaded files; the design tool submits to POST /design-submissions;
 *                  Track My Order reads GET /p/job-status/{token} and renders the simplified
 *                  customer status inline.
 *
 * Every v2 path ALSO degrades on its own: when an endpoint answers 404/405 (older ERP) the
 * caller falls back to the v1 request, so flipping the switch early cannot lose a submission.
 *
 * Turn it on at promotion time with VITE_ENQUIRY_V2=1 in the build environment.
 */
const truthy = (value: unknown): boolean =>
  value === true || value === '1' || value === 'true' || value === 'on';

export const ENQUIRY_V2 = truthy(import.meta.env.VITE_ENQUIRY_V2);
