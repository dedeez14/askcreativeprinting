import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingProduct } from '@/types/landing';

/** Public product catalogue (list mode — light payload). Optional category / featured filters. */
export const useProducts = (category?: string, featured?: boolean) =>
  useQuery({
    queryKey: ['landing', 'products', category ?? 'all', featured ?? false],
    queryFn: () => {
      const p = new URLSearchParams();
      if (category) p.set('category', category);
      if (featured) p.set('featured', '1');
      const qs = p.toString();
      return apiGet<LandingProduct[]>(`/products${qs ? `?${qs}` : ''}`);
    },
    staleTime: 5 * 60 * 1000,
  });

/** Single product by slug (detail mode — includes description, gallery, options, meta). */
export const useProduct = (slug: string | undefined) =>
  useQuery({
    queryKey: ['landing', 'product', slug],
    queryFn: () => apiGet<LandingProduct>(`/products/${slug}`),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
