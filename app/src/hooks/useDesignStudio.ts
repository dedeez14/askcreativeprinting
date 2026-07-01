import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export interface DesignStudioProduct {
  id: number;
  name: string;
  category: string;
  icon: string;
  image_url: string | null;
  description: string | null;
}

export interface DesignStudioData {
  enabled: boolean;
  hero: {
    eyebrow: string | null;
    heading: string | null;
    subheading: string | null;
  };
  categories: string[];
  collar_options: string[];
  sizes: string[];
  colors: string[];
  whatsapp_number: string | null;
  min_quantity: number;
  max_quantity: number;
  default_quantity: number;
  products: DesignStudioProduct[];
}

export const useDesignStudio = () =>
  useQuery({
    queryKey: ['landing', 'design-studio'],
    queryFn: () => apiGet<DesignStudioData>('/design-studio'),
    staleTime: 5 * 60 * 1000,
  });
