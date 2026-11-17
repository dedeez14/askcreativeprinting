import { useQuery } from '@tanstack/react-query';
import { apiGet, isMissingEndpoint } from '@/lib/api';
import type { CatalogueItem } from '@/editor/catalogue';

/**
 * GET /design-catalogue?product=<studio product name> — ASK's ready designs for the chosen product (active only, no
 * design documents). An ERP that does not serve the endpoint yet answers 404: the studio then simply shows no
 * catalogue, never an error.
 */
export const useDesignCatalogue = (product: string | null) =>
  useQuery<CatalogueItem[]>({
    queryKey: ['landing', 'design-catalogue', product],
    enabled: !!product,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      try {
        return await apiGet<CatalogueItem[]>(`/design-catalogue?product=${encodeURIComponent(product ?? '')}`);
      } catch (err) {
        if (isMissingEndpoint(err)) return [];
        throw err;
      }
    },
  });

/** GET /design-catalogue/{id} — one item with its design, loaded when the customer picks it. */
export const fetchCatalogueItem = (id: number) => apiGet<CatalogueItem>(`/design-catalogue/${id}`);
