import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingHero } from '@/types/landing';

export const useHeroes = () =>
  useQuery({
    queryKey: ['landing', 'heroes'],
    queryFn: () => apiGet<LandingHero[]>('/heroes'),
  });
