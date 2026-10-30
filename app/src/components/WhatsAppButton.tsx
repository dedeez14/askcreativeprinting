import { MessageCircle } from "lucide-react";
import { useSalesWhatsApp } from "../hooks/useSalesWhatsApp";

/**
 * Superseded by StickyCtas (06 §2 p.3 needs a quotation button beside it on mobile); kept for any
 * page that mounts the bubble on its own. The number is the admin's sales number (06 §9), not a
 * constant in this file.
 */
export default function WhatsAppButton() {
  const sales = useSalesWhatsApp();

  return (
    <a
      href={sales.link()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/40 hover:scale-110 transition-transform duration-200 animate-pulse-subtle"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
    </a>
  );
}
