import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGet, apiPost, ApiError, isMissingEndpoint } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { ENQUIRY_V2 } from '@/lib/features';
import { useDesignStudio, type DesignStudioData } from '@/hooks/useDesignStudio';
import { designToQuoteRequest } from '@/lib/legacyQuote';
import type {
  DesignStudioOptions,
  DesignSubmissionPayload,
  DesignSubmissionResponse,
  QuoteRequestPayload,
  QuoteRequestResponse,
} from '@/types/landing';

/**
 * Doc 07 — the Online Design Tool contract.
 *
 *   GET  /design-submissions/options  the admin-editable lists the server validates against
 *   POST /design-submissions          one finished 4-step configuration
 *
 * Both are Stage 4. Until the ERP promotion ships, /design-submissions/options answers 404 and
 * the lists are derived from the older GET /design-studio payload (which the live ERP serves),
 * topped up with the ERP's own defaults for the lists it does not expose yet. The submit then
 * falls back to the legacy POST /quote-requests, so a design is never lost.
 */

/** App\Services\Landing\DesignStudioService defaults — used only where the ERP sends no list. */
const DEFAULTS = {
  categories: ['Apparel', 'Jerseys', 'Promotional', 'Others'],
  sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  collars: ['Round Neck', 'V-Neck', 'Rib Collar', 'Polo Collar', 'Mandarin Collar', 'Hoodie'],
  fabrics: ['Microfiber', 'Dry-Fit Polyester', 'Cotton', 'Honeycomb', 'Interlock'],
  sleeves: ['Short Sleeve', 'Long Sleeve', 'Sleeveless', 'Raglan'],
  placements: ['front', 'back', 'left_sleeve', 'right_sleeve', 'collar', 'pocket', 'custom'],
  nameset_positions: ['back_only', 'front_only', 'sleeve', 'custom'],
} as const;

const list = (value: string[] | undefined | null, fallback: readonly string[]): string[] => {
  const clean = (value ?? []).map((v) => String(v).trim()).filter((v) => v !== '');
  return clean.length > 0 ? clean : [...fallback];
};

/** The option lists as they can be read from the older /design-studio payload. */
export function optionsFromStudio(studio: DesignStudioData): DesignStudioOptions {
  return {
    contract: 'design-studio-v1',
    enabled: studio.enabled,
    categories: list(studio.categories, DEFAULTS.categories),
    collars: list(studio.collar_options, DEFAULTS.collars),
    fabrics: list(studio.fabric_options, DEFAULTS.fabrics),
    sleeves: list(studio.sleeve_options, DEFAULTS.sleeves),
    sizes: list(studio.sizes, DEFAULTS.sizes),
    colors: studio.colors ?? [],
    placements: list(studio.placements, DEFAULTS.placements),
    nameset_positions: [...DEFAULTS.nameset_positions],
    priorities: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    delivery_methods: ['pickup', 'delivery', 'courier'],
    min_quantity: studio.min_quantity || 10,
    max_quantity: studio.max_quantity || 500,
    products: (studio.products ?? []).map((p) => ({ id: p.id, name: p.name, category: p.category })),
  };
}

/** GET /design-submissions/options — undefined (not an error) on an ERP without Stage 4. */
export const useDesignSubmissionOptions = () =>
  useQuery<DesignStudioOptions | null>({
    queryKey: ['landing', 'design-submissions', 'options'],
    enabled: ENQUIRY_V2,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      try {
        return await apiGet<DesignStudioOptions>('/design-submissions/options');
      } catch (err) {
        if (isMissingEndpoint(err)) return null;
        throw err;
      }
    },
  });

export interface DesignToolConfig {
  /** Presentation (hero, product icons/images, WhatsApp number) — the /design-studio payload. */
  studio?: DesignStudioData;
  /** The lists every submitted value is validated against. */
  options?: DesignStudioOptions;
  /** True when POST /design-submissions is available and should be used. */
  canSubmitV2: boolean;
  isPending: boolean;
  error: unknown;
}

/** One hook for the whole design tool: presentation + validated option lists. */
export function useDesignToolConfig(): DesignToolConfig {
  const studio = useDesignStudio();
  const options = useDesignSubmissionOptions();

  const erpOptions = options.data ?? undefined;
  return {
    studio: studio.data,
    options: erpOptions ?? (studio.data ? optionsFromStudio(studio.data) : undefined),
    canSubmitV2: ENQUIRY_V2 && !!erpOptions,
    isPending: studio.isPending || (ENQUIRY_V2 && options.isPending),
    error: studio.error,
  };
}

/** POST /design-submissions, falling back to the legacy quote request on an older ERP. */
export const useDesignSubmission = () =>
  useMutation<DesignSubmissionResponse, ApiError, DesignSubmissionPayload>({
    mutationFn: async (payload) => {
      try {
        return await apiPost<DesignSubmissionResponse, DesignSubmissionPayload>('/design-submissions', payload);
      } catch (err) {
        if (!isMissingEndpoint(err)) throw err;
        const legacy = await apiPost<QuoteRequestResponse, QuoteRequestPayload>(
          '/quote-requests',
          designToQuoteRequest(payload),
        );
        return {
          enquiry_no: (legacy as { enquiry_no?: string }).enquiry_no ?? '',
          total_qty: Object.values(payload.sizes ?? {}).reduce((a, b) => a + Number(b || 0), 0),
          files: payload.artwork?.length ?? 0,
          preview: !!payload.preview,
          summary: '',
        };
      }
    },
    onSuccess: (res) => trackEvent('design_submitted', { enquiry_no: res?.enquiry_no }),
  });

