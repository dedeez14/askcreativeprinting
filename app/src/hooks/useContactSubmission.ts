import { useMutation } from '@tanstack/react-query';
import { apiPost, ApiError } from '@/lib/api';
import type { ContactSubmissionPayload, ContactSubmissionResponse } from '@/types/landing';

export const useContactSubmission = () =>
  useMutation<ContactSubmissionResponse, ApiError, ContactSubmissionPayload>({
    mutationFn: (payload) => apiPost<ContactSubmissionResponse, ContactSubmissionPayload>('/contact-submissions', payload),
  });
