import { useMutation } from '@tanstack/react-query';
import { apiPost, ApiError } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import type { EnquiryPayload, EnquiryResponse } from '@/types/landing';

export const useEnquiry = () =>
  useMutation<EnquiryResponse, ApiError, EnquiryPayload>({
    mutationFn: (payload) => apiPost<EnquiryResponse, EnquiryPayload>('/enquiries', payload),
    onSuccess: (res) => trackEvent('enquiry_submitted', { enquiry_no: (res as { enquiry_no?: string })?.enquiry_no }),
  });
