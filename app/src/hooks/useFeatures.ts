import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingFeature } from '@/types/landing';

export const useFeatures = () =>
  useQuery({
    queryKey: ['landing', 'features'],
    queryFn: () => apiGet<LandingFeature[]>('/features'),
  });
