import { useQuery } from '@tanstack/react-query';
import { apiGetEnvelope } from '@/lib/api';
import type { LandingGallery } from '@/types/landing';

/**
 * 06 §10 p.4 — the portfolio. `meta.categories` carries the client's eight categories (plus any extra
 * the admin uses), so the filter tabs are the categories the brief names whether or not an entry
 * exists in each one yet.
 */
export const useGallery = () =>
  useQuery({
    queryKey: ['landing', 'gallery'],
    queryFn: () => apiGetEnvelope<LandingGallery[], { categories?: string[] }>('/gallery'),
    select: (res) => ({ items: res.data, categories: res.meta?.categories ?? [] }),
  });
