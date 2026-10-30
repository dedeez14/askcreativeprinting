import { Loader2 } from "lucide-react";
import { usePriceEstimate } from "../hooks/useEstimate";
import { formatMoney } from "../lib/format";

interface PriceEstimateBoxProps {
  /** The design-tool product (doc 07 step 1). */
  studioProductId?: number | null;
  totalQty: number;
  /** Compact variant for the step-2 column. */
  compact?: boolean;
}

/**
 * 06 §5 p.3 — "The Design Studio should guide customers through: … enter size breakdown, upload files,
 * VIEW ESTIMATED PRICE, and submit to sales team" / "The system should auto-calculate total quantity
 * and estimated price, but final price must remain subject to sales confirmation."
 *
 * A RANGE in RM from the admin's published price range and the ERP's quantity tiers, with the
 * sales-confirmation sentence the ERP itself returns. Never a quotation, never a cost figure. When the
 * product has no price range configured, or the ERP has no estimate endpoint, nothing is shown.
 */
export default function PriceEstimateBox({ studioProductId, totalQty, compact }: PriceEstimateBoxProps) {
  const { data, isFetching } = usePriceEstimate(studioProductId, totalQty);

  if (!studioProductId || totalQty <= 0) return null;
  if (isFetching && !data) {
    return (
      <p className="text-xs font-body text-forest-900/50 flex items-center gap-2" data-estimate="loading">
        <Loader2 className="w-3 h-3 animate-spin" /> Calculating an estimate…
      </p>
    );
  }
  if (!data || !data.priced || data.total_min === null) return null;

  const range =
    data.total_max !== null && data.total_max > data.total_min
      ? `${formatMoney(data.total_min)} – ${formatMoney(data.total_max)}`
      : formatMoney(data.total_min);
  const unit =
    data.unit_price_max !== null && data.unit_price_min !== null && data.unit_price_max > data.unit_price_min
      ? `${formatMoney(data.unit_price_min)} – ${formatMoney(data.unit_price_max)}`
      : formatMoney(data.unit_price_min);

  return (
    <div
      className={`rounded-md border border-teal-500/30 bg-teal-50/50 ${compact ? "px-3 py-2" : "px-4 py-3"}`}
      data-estimate="ready"
      data-estimate-total-min={data.total_min ?? ""}
      data-estimate-total-max={data.total_max ?? ""}
    >
      <p className="text-sm font-body text-forest-900">
        Estimated price: <span className="font-medium text-teal-700" data-estimate-range>{range}</span>
        <span className="text-forest-900/60"> for {data.total_qty} pcs</span>
      </p>
      <p className="text-xs font-body text-forest-900/60 mt-1">
        About {unit} per piece{data.tier ? ` · quantity tier ${data.tier}` : ""}
      </p>
      {data.below_moq && data.moq_message && (
        <p className="text-xs font-body text-amber-700 mt-1" data-estimate-moq>{data.moq_message}</p>
      )}
      {data.custom_pricing && (
        <p className="text-xs font-body text-amber-700 mt-1">
          This quantity is priced individually — our sales team will confirm it.
        </p>
      )}
      <p className="text-xs font-body text-forest-900/50 mt-1" data-estimate-disclaimer>{data.disclaimer}</p>
    </div>
  );
}
