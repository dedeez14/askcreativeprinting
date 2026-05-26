import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingGallery } from '@/types/landing';

export const useGallery = () =>
  useQuery({
    queryKey: ['landing', 'gallery'],
    queryFn: () => apiGet<LandingGallery[]>('/gallery'),
  });
