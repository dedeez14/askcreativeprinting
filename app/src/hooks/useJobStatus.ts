import { useQuery } from '@tanstack/react-query';
import { fetchErpJson, ApiError } from '@/lib/api';
import { ENQUIRY_V2 } from '@/lib/features';
import type { JobStatusResponse } from '@/types/landing';

/**
 * 06 B7/B8/B9 + B14 — the customer's simplified order status.
 *
 * GET {ERP}/p/job-status/{token} returns the customer-facing fields only: job number, job
 * title, the 06 B7 status and the milestone steps (done / current / pending). Internal data —
 * cost, commission, wastage, payroll, staff names, internal notes, internal status codes — is
 * not part of the response and is never requested here.
 *
 * Stage 4: an ERP without this feed answers 404, and a cross-origin read it has not allowed
 * fails at the network layer. Both leave the Track page on its existing behaviour (open the
 * ERP tracking page), so the switch can be flipped before the ERP side is finished.
 */
export const useJobStatus = (token: string | null) =>
  useQuery<JobStatusResponse, ApiError>({
    queryKey: ['erp', 'job-status', token],
    enabled: ENQUIRY_V2 && !!token,
    retry: false,
    staleTime: 30 * 1000,
    queryFn: () => fetchErpJson<JobStatusResponse>(`/p/job-status/${encodeURIComponent(token as string)}`),
  });
