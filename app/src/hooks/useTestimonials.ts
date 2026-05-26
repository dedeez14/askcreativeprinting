import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { LandingTestimonial } from '@/types/landing';

export const useTestimonials = () =>
  useQuery({
    queryKey: ['landing', 'testimonials'],
    queryFn: () => apiGet<LandingTestimonial[]>('/testimonials'),
  });
