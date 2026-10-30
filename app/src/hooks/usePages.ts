import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingPage } from '@/types/landing';

/**
 * 06 §11 p.4 "Create SEO landing pages for …" + §9 p.4 "Admin panel should manage … SEO content".
 *
 * The service / SEO pages used to be a hardcoded array in this repo (src/data/services.ts), so the
 * client needed a developer and a rebuild to add a keyword page or fix a price. They now come from the
 * ERP CMS. src/data/services.ts stays as the offline fallback for an ERP that does not serve them yet.
 */
export const usePages = () =>
  useQuery<LandingPage[]>({
    queryKey: ['landing', 'pages'],
    queryFn: () => apiGet<LandingPage[]>('/pages'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

/** One page with its starting price, FAQ and portfolio entries. Legacy slugs resolve server-side. */
export const usePage = (slug: string | undefined) =>
  useQuery<LandingPage>({
    queryKey: ['landing', 'page', slug],
    queryFn: () => apiGet<LandingPage>(`/pages/${encodeURIComponent(slug as string)}`),
    enabled: !!slug,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
