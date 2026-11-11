import { MessageCircle } from "lucide-react";
import { useSalesWhatsApp } from "../hooks/useSalesWhatsApp";
import {
  buildEnquiryWhatsAppText,
  enquiryWhatsAppHref,
  submissionLink,
  type EnquiryWhatsAppInput,
  type EnquiryWhatsAppResponse,
} from "../lib/enquiryWhatsApp";

/**
 * 06 §6 p.3 — after a successful submit, one tap sends the enquiry to the sales team on WhatsApp with
 * the enquiry ID, customer, product, quantity, deadline and submission link already typed.
 */
export default function EnquiryWhatsAppCta({
  input,
  response,
}: {
  input: Omit<EnquiryWhatsAppInput, "submissionUrl">;
  response?: EnquiryWhatsAppResponse | null;
}) {
  const sales = useSalesWhatsApp();
  const text = buildEnquiryWhatsAppText({
    ...input,
    submissionUrl: submissionLink(response, typeof window === "undefined" ? "" : window.location.origin),
  });
  const href = enquiryWhatsAppHref(response, text, sales.link);

  return (
    <div className="max-w-[480px] mx-auto mb-8 rounded-lg border border-[#25D366]/40 bg-[#25D366]/5 p-5" data-enquiry-whatsapp>
      <p className="text-forest-900 text-sm font-body mb-3">
        Want a faster reply? Send your enquiry details straight to our sales team.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white px-5 py-3.5 rounded-md text-sm font-body font-medium hover:brightness-95 transition"
      >
        <MessageCircle className="w-5 h-5" />
        Send this enquiry to our sales team on WhatsApp
      </a>
    </div>
  );
}
