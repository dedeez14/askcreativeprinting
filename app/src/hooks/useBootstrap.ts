import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingBootstrap } from '@/types/landing';

export const useBootstrap = () =>
  useQuery({
    queryKey: ['landing', 'bootstrap'],
    queryFn: () => apiGet<LandingBootstrap>('/bootstrap'),
  });
