import { useMutation, useQuery } from '@tanstack/react-query';
import { apiPost, ApiError, isMissingEndpoint } from '@/lib/api';
import type { PriceEstimate } from '@/types/landing';

export interface EstimatePayload {
  product_id?: number;
  product_slug?: string;
  studio_product_id?: number;
  total_qty?: number;
  size_breakdown?: Record<string, number>;
}

/**
 * 06 §5 p.3 "The Design Studio should guide customers through: … view estimated price" and "The system
 * should auto-calculate total quantity and estimated price, but final price must remain subject to
 * sales confirmation."
 *
 * The ERP returns a RANGE from the admin's published price range and its own quantity tiers, with the
 * sales-confirmation disclaimer in the body. It never returns a quotation, and nothing is stored.
 */
export const useEstimate = () =>
  useMutation<PriceEstimate, ApiError, EstimatePayload>({
    mutationFn: (payload) => apiPost<PriceEstimate, EstimatePayload>('/estimate', payload),
  });

/**
 * The same estimate as a cached read, for a live "estimated price" while the customer types the size
 * breakdown (06 §5 p.3 step "view estimated price"). Disabled until a product and a quantity exist, and
 * silent on an ERP that does not serve the endpoint yet — the tool then shows no price, never a guess.
 */
export const usePriceEstimate = (studioProductId?: number | null, totalQty?: number) =>
  useQuery<PriceEstimate | null>({
    queryKey: ['landing', 'estimate', studioProductId ?? 0, totalQty ?? 0],
    enabled: !!studioProductId && !!totalQty && totalQty > 0,
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        return await apiPost<PriceEstimate, EstimatePayload>('/estimate', {
          studio_product_id: studioProductId as number,
          total_qty: totalQty as number,
        });
      } catch (err) {
        if (isMissingEndpoint(err)) return null;
        throw err;
      }
    },
  });
