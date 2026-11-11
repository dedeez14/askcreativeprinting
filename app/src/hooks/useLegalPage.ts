import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LegalKey, LegalPageData } from '@/lib/legal';

/**
 * One legal page from the ERP (Admin → Landing → Settings → Legal pages). An ERP without the endpoint, or an
 * unreachable one, leaves `data` undefined and the page renders its built-in default text.
 */
export const useLegalPage = (key: LegalKey) =>
  useQuery<LegalPageData>({
    queryKey: ['landing', 'legal', key],
    queryFn: () => apiGet<LegalPageData>(`/legal/${key}`),
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
