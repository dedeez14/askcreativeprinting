/**
 * What a form tells the visitor when the ERP refuses or never receives a submission.
 *
 * A failed send must never be silent: the visitor has typed a long form and needs to know it did not
 * arrive, that what they typed is still on the page, and what to do next. Shared by the Quotation form
 * and the Online Design tool so both say the same thing for the same answer.
 */
import { ApiError } from './api';

export function submitErrorMessage(err: unknown): string {
  const status = err instanceof ApiError ? err.status : (err as { status?: number } | null)?.status;
  const message = err instanceof ApiError ? err.message : undefined;

  // fetch() itself failed: offline, or the browser blocked the call.
  if (!status) return 'We could not reach our server. Please check your connection and send again.';
  if (status === 422) return message || 'Please check your details and try again.';
  if (status === 429) return 'Too many requests. Please wait a minute and send again.';
  // Anything else is the server's problem, not the visitor's details. The code helps our team trace it.
  return `Our server did not accept the request (error ${status}). Please send again in a moment, or message us on WhatsApp.`;
}
