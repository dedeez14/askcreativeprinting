import { useMutation } from '@tanstack/react-query';
import { apiPost, ApiError } from '@/lib/api';
import type { QuoteRequestPayload, QuoteRequestResponse } from '@/types/landing';

export const useQuoteRequest = () =>
  useMutation<QuoteRequestResponse, ApiError, QuoteRequestPayload>({
    mutationFn: (payload) => apiPost<QuoteRequestResponse, QuoteRequestPayload>('/quote-requests', payload),
  });
