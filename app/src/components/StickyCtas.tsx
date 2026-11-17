import { Link, useLocation } from "react-router-dom";
import { MessageCircle, FileText, Phone } from "lucide-react";
import { useSalesWhatsApp } from "../hooks/useSalesWhatsApp";
import { useSettings } from "../hooks/useSettings";

/**
 * 06 §2 p.3 — "Sticky WhatsApp and quotation buttons should be visible on mobile" and §13 p.3
 * "Mobile requirements: … sticky WhatsApp button … one-click call/WhatsApp, and clear CTA after every
 * section."
 *
 * Both buttons, pinned, phone-first: the quotation CTA sits beside WhatsApp at phone width (where most
 * visitors arrive from WhatsApp, Instagram or Google) and collapses to the WhatsApp bubble alone on a
 * wide screen, where the header already carries "Get Quotation".
 *
 * The WhatsApp number is the admin's first sales number (06 §9), never a constant in this file.
 *
 * Not on the two order forms (Online Design, Get Quotation): there the floating pair sat on top of the
 * product cards, the size boxes and the submit button on a phone, and "Get Quotation" pointed away from
 * the form the customer was already filling in. Those pages carry their own docked action bar, with
 * WhatsApp in it, so the button is still one tap away.
 */
const OWN_ACTION_BAR = ["/online-design", "/quotation"];

export default function StickyCtas() {
  const sales = useSalesWhatsApp();
  const { pathname } = useLocation();
  // One-click call (06 §13 p.3) — the office line from settings, same fallback as the header and footer.
  const { data: settings } = useSettings();
  const callNumber = (settings?.contact_phone || "088 205 423").replace(/[^0-9+]/g, "");

  if (OWN_ACTION_BAR.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <aside aria-label="Quick contact" className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3" data-sticky-ctas>
      {/* Quotation — phone and tablet widths only */}
      <Link
        to="/quotation"
        className="lg:hidden flex items-center gap-2 bg-[#d7ff00] text-[#0d1f16] rounded-full pl-4 pr-5 py-3 shadow-lg shadow-black/20 font-body text-sm font-medium hover:brightness-95 transition"
        data-sticky-quotation
      >
        <FileText className="w-5 h-5" />
        Get Quotation
      </Link>

      {/* Call — phone and tablet widths only (the header carries the number on desktop) */}
      <a
        href={`tel:${callNumber}`}
        className="lg:hidden w-12 h-12 bg-forest-900 border border-[#d7ff00]/60 rounded-full flex items-center justify-center shadow-lg shadow-black/20 hover:brightness-110 transition"
        aria-label="Call us"
        data-sticky-call
      >
        <Phone className="w-5 h-5 text-[#d7ff00]" />
      </a>

      <a
        href={sales.link("Hi ASK Creative, I would like to ask about custom printing.")}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/40 hover:scale-110 transition-transform duration-200 animate-pulse-subtle"
        aria-label="Chat on WhatsApp"
        data-sticky-whatsapp
      >
        <MessageCircle className="w-7 h-7 text-white fill-white" />
      </a>
    </aside>
  );
}
