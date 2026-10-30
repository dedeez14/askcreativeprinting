import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingFaq } from '@/types/landing';

/**
 * 06 §12 p.4 — the FAQ. With `forSlug` the ERP returns the answers of that product or SEO page
 * ("FAQ content should be reusable across product pages and SEO pages"), so one FAQ store feeds the
 * FAQ page, every product page and every SEO page.
 */
export const useFaqs = (forSlug?: string) =>
  useQuery({
    queryKey: ['landing', 'faqs', forSlug ?? 'all'],
    queryFn: () => apiGet<LandingFaq[]>(forSlug ? `/faqs?for=${encodeURIComponent(forSlug)}` : '/faqs'),
  });
