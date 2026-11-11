import type { ReactNode } from "react";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { useSalesWhatsApp } from "../hooks/useSalesWhatsApp";

/**
 * The docked bar at the foot of the two order forms (Online Design, Get Quotation): what the order
 * adds up to so far, and the ONE thing to do next.
 *
 * It is `sticky`, not `fixed`: it rides along the bottom of the screen while the form is in view and
 * comes to rest at the end of the form, so it never sits on the footer and it never hides the last
 * field — the space it covers is always reachable by scrolling. It also carries the WhatsApp button,
 * which replaces the site's floating bubble on these pages (that bubble and the "Get Quotation" pill
 * sat on top of the product cards and size boxes on a phone).
 */
export interface OrderBarProps {
  /** First line — the product, the piece count. */
  title: ReactNode;
  /** Second line — the estimate in RM, or what is still missing. */
  detail?: ReactNode;
  /** Shown when there is a step to go back to. */
  onBack?: () => void;
  backLabel?: string;
  /** The primary action. A `form` id turns it into that form's submit button. */
  action: { label: ReactNode; onClick?: () => void; form?: string; busy?: boolean; icon?: ReactNode };
  whatsappText?: string;
  /** Negative margins that let the bar reach the edges of the card or page it is in. */
  bleed?: string;
}

export default function OrderBar({
  title, detail, onBack, backLabel = "Back", action, whatsappText, bleed = "-mx-5 md:-mx-10 lg:mx-0",
}: OrderBarProps) {
  const sales = useSalesWhatsApp();

  return (
    <div className={`sticky bottom-0 lg:bottom-4 z-30 mt-10 ${bleed}`} data-order-bar>
      <div className="bg-[#0d1f16] text-white lg:rounded-xl shadow-[0_-10px_30px_-12px_rgba(13,31,22,0.45)] px-3 sm:px-5 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:py-3 flex items-center gap-2 sm:gap-3">
        {onBack && (
          <button type="button" onClick={onBack} aria-label={backLabel}
            className="shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center gap-1 rounded-lg border border-white/20 px-2 sm:px-3 text-sm font-body text-white/85 hover:border-white/50 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /><span className="hidden sm:inline">{backLabel}</span>
          </button>
        )}
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="text-sm font-body font-medium text-white truncate">{title}</p>
          {detail && <p className="text-xs sm:text-[13px] font-body text-[#d7ff00] truncate">{detail}</p>}
        </div>
        <a href={sales.link(whatsappText)} target="_blank" rel="noopener noreferrer" aria-label="Ask us on WhatsApp"
          className="shrink-0 w-11 h-11 rounded-full bg-[#25D366] inline-flex items-center justify-center hover:brightness-95 transition">
          <MessageCircle className="w-5 h-5 text-white fill-white" />
        </a>
        <button type={action.form ? "submit" : "button"} form={action.form} onClick={action.onClick} disabled={action.busy}
          className="shrink-0 min-h-11 inline-flex items-center gap-1.5 rounded-lg bg-[#d7ff00] px-4 sm:px-5 text-sm font-body font-semibold text-[#0d1f16] hover:bg-[#e5ff4d] transition-colors disabled:opacity-60 disabled:cursor-wait">
          {action.label}{action.icon}
        </button>
      </div>
    </div>
  );
}
