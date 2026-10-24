import { useMutation } from '@tanstack/react-query';
import { apiPost, ApiError, isMissingEndpoint } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { enquiryToQuoteRequest } from '@/lib/legacyQuote';
import type { EnquiryPayload, EnquiryResponse, QuoteRequestPayload, QuoteRequestResponse } from '@/types/landing';

/**
 * POST /enquiries — the complete 06 B4 quotation request (customer, product + ERP job type,
 * design, size matrix, nameset, deadline, delivery, uploaded files, campaign source).
 *
 * Fallback: an ERP that does not serve /enquiries yet answers 404/405. The same submission is
 * then sent to the legacy POST /quote-requests with everything packed into `product_snapshot`,
 * so a visitor never loses a quotation request while the ERP promotion is pending.
 */
export const useEnquiry = () =>
  useMutation<EnquiryResponse, ApiError, EnquiryPayload>({
    mutationFn: async (payload) => {
      try {
        return await apiPost<EnquiryResponse, EnquiryPayload>('/enquiries', payload);
      } catch (err) {
        if (!isMissingEndpoint(err)) throw err;
        const legacy = await apiPost<QuoteRequestResponse, QuoteRequestPayload>(
          '/quote-requests',
          enquiryToQuoteRequest(payload),
        );
        // The legacy endpoint has no enquiry number of its own in its response shape.
        return { ...(legacy as unknown as EnquiryResponse), enquiry_no: (legacy as { enquiry_no?: string }).enquiry_no ?? '' };
      }
    },
    onSuccess: (res) => trackEvent('enquiry_submitted', { enquiry_no: res?.enquiry_no }),
  });

