import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingSettings } from '@/types/landing';

export const useSettings = () =>
  useQuery({
    queryKey: ['landing', 'settings'],
    queryFn: () => apiGet<LandingSettings>('/settings'),
  });
