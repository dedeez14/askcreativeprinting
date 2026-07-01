import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export interface LandingBlog {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  image_path: string | null;
  category: string | null;
  tags: string[];
  is_featured: boolean;
  published_at: string | null;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
}

export const useBlogs = (category?: string) =>
  useQuery({
    queryKey: ['landing', 'blogs', category ?? 'all'],
    queryFn: () => apiGet<LandingBlog[]>('/blogs' + (category ? `?category=${encodeURIComponent(category)}` : '')),
  });

export const useBlog = (slug: string | undefined) =>
  useQuery({
    queryKey: ['landing', 'blog', slug],
    queryFn: () => apiGet<LandingBlog>(`/blogs/${slug}`),
    enabled: !!slug,
  });
