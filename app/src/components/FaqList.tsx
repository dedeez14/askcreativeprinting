import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useFaqs } from "../hooks/useFaqs";
import type { LandingFaq } from "../types/landing";

interface FaqListProps {
  /** Product or SEO page slug — the ERP returns the answers that belong on that page. */
  forSlug?: string;
  /** Already-loaded answers (the SEO page endpoint ships them with the page). */
  items?: LandingFaq[];
  heading?: string;
  max?: number;
}

/**
 * 06 §12 p.4 — "FAQ content should be reusable across product pages and SEO pages."
 *
 * One component, one FAQ store (the ERP's landing_faqs, admin-managed): the FAQ page, every product
 * page and every SEO page show from it, so an answer is written once. `forSlug` asks the ERP for the
 * answers pinned to that page (landing_faqs.applies_to), its FAQ group, or the general list.
 */
export default function FaqList({ forSlug, items, heading = "Frequently Asked Questions", max = 6 }: FaqListProps) {
  const [open, setOpen] = useState<number | null>(0);
  const query = useFaqs(items ? undefined : forSlug);
  const faqs = (items && items.length > 0 ? items : query.data ?? []).slice(0, max);

  if (faqs.length === 0) return null;

  return (
    <div data-faq-list={forSlug ?? "general"}>
      <h3 className="font-display text-xl text-forest-900 uppercase mb-4">{heading}</h3>
      <div className="divide-y divide-forest-900/10 border-t border-b border-forest-900/10">
        {faqs.map((faq, i) => (
          <div key={faq.id ?? i}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 text-left py-4"
              aria-expanded={open === i}
            >
              <span className="text-forest-900 text-base font-body font-medium">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-forest-900/50 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            {open === i && (
              <p className="text-forest-900/70 text-sm font-body leading-relaxed pb-4">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
