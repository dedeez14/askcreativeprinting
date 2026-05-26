import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingAbout } from '@/types/landing';

export const useAbout = () =>
  useQuery({
    queryKey: ['landing', 'about'],
    queryFn: () => apiGet<LandingAbout>('/about'),
  });
