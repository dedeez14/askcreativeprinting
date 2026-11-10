/**
 * 06 §6 p.3 — "Every WhatsApp message should include enquiry ID, customer name, product, quantity,
 * deadline, and website submission link."
 *
 * Pure helpers (no React, no window access except an explicit `origin` argument) so the message and
 * the link choice can be unit-tested. Used by the success screens of the Quotation form and the
 * Online Design tool.
 */

export interface EnquiryWhatsAppInput {
  enquiryNo?: string | null;
  customerName: string;
  company?: string | null;
  product?: string | null;
  totalQty?: number | null;
  /** yyyy-mm-dd — the event / match date the customer gave. */
  eventDate?: string | null;
  /** yyyy-mm-dd — the date the customer needs the order by. */
  neededBy?: string | null;
  /** A real link the customer can open to see the submission. Omitted from the message when absent. */
  submissionUrl?: string | null;
}

/** The fields of POST /enquiries and /design-submissions responses this module reads. */
export interface EnquiryWhatsAppResponse {
  whatsapp_url?: string | null;
  tracking_url?: string | null;
  tracking_token?: string | null;
}

/** yyyy-mm-dd -> dd/mm/yyyy; anything else is returned trimmed, or '' when empty. */
export function displayDate(value?: string | null): string {
  const v = (value ?? '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
}

/** Event date and/or needed-by date as one line; "Not decided" when the customer gave neither. */
export function deadlineText(eventDate?: string | null, neededBy?: string | null): string {
  const parts: string[] = [];
  const event = displayDate(eventDate);
  const needed = displayDate(neededBy);
  if (event) parts.push(`Event date ${event}`);
  if (needed) parts.push(`needed by ${needed}`);
  if (parts.length === 0) return 'Not decided';
  const text = parts.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The prefilled WhatsApp message. Every requested field has its own line. */
export function buildEnquiryWhatsAppText(input: EnquiryWhatsAppInput): string {
  const name = input.customerName.trim();
  const company = (input.company ?? '').trim();
  const qty = input.totalQty && input.totalQty > 0 ? String(input.totalQty) : 'Not stated';
  const lines = [
    'Hi ASK Creative, I have just submitted an enquiry on your website.',
    '',
    `Enquiry ID: ${(input.enquiryNo ?? '').trim() || 'Not issued yet'}`,
    `Name: ${company ? `${name} (${company})` : name}`,
    `Product: ${(input.product ?? '').trim() || 'Not stated'}`,
    `Quantity: ${qty}`,
    `Deadline: ${deadlineText(input.eventDate, input.neededBy)}`,
  ];
  const link = (input.submissionUrl ?? '').trim();
  if (link) lines.push(`Submission link: ${link}`);
  return lines.join('\n');
}

/**
 * The real, openable link to the submission, or undefined (the message then simply has no link line —
 * a made-up link is worse than none). `tracking_url` is what the ERP returns; a bare `tracking_token`
 * is opened through this site's own /track?code= page.
 */
export function submissionLink(response: EnquiryWhatsAppResponse | null | undefined, origin: string): string | undefined {
  const url = (response?.tracking_url ?? '').trim();
  if (url) return url;
  const token = (response?.tracking_token ?? '').trim();
  if (token && origin) return `${origin.replace(/\/+$/, '')}/track?code=${encodeURIComponent(token)}`;
  return undefined;
}

/**
 * The wa.me link to open. The ERP's routed `whatsapp_url` wins (it is the assigned sales person's
 * number); when it already carries ?text= it is used as is, otherwise the message is appended.
 * Without it, `fallbackLink` (useSalesWhatsApp().link) builds the link from the admin's first sales number.
 */
export function enquiryWhatsAppHref(
  response: EnquiryWhatsAppResponse | null | undefined,
  text: string,
  fallbackLink: (text?: string) => string,
): string {
  const routed = (response?.whatsapp_url ?? '').trim();
  if (!routed) return fallbackLink(text);
  if (/[?&]text=/.test(routed)) return routed;
  return `${routed}${routed.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;
}
