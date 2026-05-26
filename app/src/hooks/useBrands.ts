import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingBrand } from '@/types/landing';

export const useBrands = () =>
  useQuery({
    queryKey: ['landing', 'brands'],
    queryFn: () => apiGet<LandingBrand[]>('/brands'),
  });
