import { useMutation } from '@tanstack/react-query';
import { apiPost, ApiError } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import type { QuoteRequestPayload, QuoteRequestResponse } from '@/types/landing';

export const useQuoteRequest = () =>
  useMutation<QuoteRequestResponse, ApiError, QuoteRequestPayload>({
    mutationFn: (payload) => apiPost<QuoteRequestResponse, QuoteRequestPayload>('/quote-requests', payload),
    onSuccess: (res) => trackEvent('quote_submitted', { enquiry_no: (res as { enquiry_no?: string })?.enquiry_no }),
  });
