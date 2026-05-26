import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingFaq } from '@/types/landing';

export const useFaqs = () =>
  useQuery({
    queryKey: ['landing', 'faqs'],
    queryFn: () => apiGet<LandingFaq[]>('/faqs'),
  });
