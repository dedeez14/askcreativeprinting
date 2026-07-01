import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Send, Check, MessageCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/SEOHead";
import { useQuoteRequest } from "../hooks/useQuoteRequest";
import { useFormTracking } from "../hooks/useFormTracking";
import { useSettings } from "../hooks/useSettings";

const productTypes = [
  "Sublimation Jersey",
  "Custom Apparel",
  "T-Shirt",
  "Embroidery",
  "Digital Printing",
  "Banner/Bunting",
  "Premium Gifts",
  "Others",
];

const FALLBACK_SALES_TEAM = [
  { name: "Mrs. Dayang", phone: "60102174774" },
  { name: "Mrs. Khalisah", phone: "60143584774" },
  { name: "Mrs. Michelle", phone: "60162164774" },
  { name: "Ms. Suhaznie", phone: "60146024474" },
  { name: "Ms. Fara", phone: "60102174750" },
];

export default function Quotation() {
  const [submitted, setSubmitted] = useState(false);
  const formOpenedAt = useRef(Math.floor(Date.now() / 1000));
  const mutation = useQuoteRequest();
  const track = useFormTracking("quotation");
  const { data: settings } = useSettings();
  const salesTeam = (settings?.sales_team && settings.sales_team.length > 0) ? settings.sales_team : FALLBACK_SALES_TEAM;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const productType = String(fd.get("product_type") || "").trim();
    const qty = Number(fd.get("quantity") || 0);
    const sizeBreakdown = String(fd.get("size_breakdown") || "").trim();
    const deadline = String(fd.get("deadline") || "").trim();
    const company = String(fd.get("company") || "").trim();

    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      product_snapshot: {
        source: "quotation_form",
        product_type: productType,
        company,
        quantity: qty,
        deadline: deadline || null,
        size_breakdown: sizeBreakdown || null,
      },
      notes: String(fd.get("notes") || "").trim(),
      website: String(fd.get("website") || ""),
      _t: formOpenedAt.current,
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        track.markSubmitted();
        setSubmitted(true);
        toast.success("Quotation request submitted!");
      },
      onError: (err: any) => {
        if (err?.status === 429) toast.error("Terlalu banyak permintaan, coba lagi sebentar.");
        else if (err?.status === 422) toast.error(err?.message ?? "Periksa kembali isian Anda.");
        else toast.error("Server bermasalah, coba lagi.");
      },
    });
  };

  return (
    <>
      <SEOHead
        title="Get Your Free Quotation | ASK Creative Printing Sabah"
        description="Request a free quotation for custom printing, sublimation jerseys, apparel, embroidery, banners and premium gifts in Kota Kinabalu, Sabah."
        keywords="quotation, custom printing quote, jersey printing price, printing quotation Kota Kinabalu"
        canonical="/quotation"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            Get Your Free Quotation
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[600px] mx-auto">
            Fill in the details below and our sales team will prepare a quotation for you.
          </p>
        </div>
      </section>

      {/* Quotation Form */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[720px] mx-auto px-5 md:px-10">
          {!submitted ? (
            <div className="bg-white border border-forest-900/15 rounded-lg p-8 md:p-12">
              <form onSubmit={handleSubmit} onChange={track.start} className="space-y-5">
                {/* honeypot */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: "absolute", left: "-9999px" }}
                  aria-hidden="true"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <input
                    type="text"
                    name="name"
                    placeholder="Name *"
                    required
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    required
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone *"
                    required
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="text"
                    name="company"
                    placeholder="Company (optional)"
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <select
                  name="product_type"
                  required
                  className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">Select Product Type *</option>
                  {productTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity *"
                    required
                    min={1}
                    step={1}
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="date"
                    name="deadline"
                    placeholder="Deadline"
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body focus:outline-none focus:border-teal-500"
                  />
                </div>
                <input
                  type="text"
                  name="size_breakdown"
                  placeholder="Size breakdown (optional) e.g. S=5, M=10, L=10"
                  className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                />

                {/* File Upload (UI only — upload uses /uploads endpoint separately) */}
                <div className="border-2 border-dashed border-forest-900/15 hover:border-[#d7ff00] rounded-lg p-6 text-center transition-colors cursor-pointer">
                  <Upload className="w-6 h-6 text-forest-900/30 mx-auto mb-2" />
                  <p className="text-forest-900/60 text-sm font-body">
                    Upload your design or reference image (optional) — coming soon
                  </p>
                </div>

                <textarea
                  rows={4}
                  name="notes"
                  placeholder="Additional notes or requirements..."
                  className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-[#d7ff00] text-[#0d1f16] px-5 py-3.5 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {mutation.isPending ? "Submitting..." : "Request Quotation"}
                </button>
              </form>

              {/* WhatsApp Alternatives */}
              <div className="mt-8 pt-6 border-t border-forest-900/10 text-center">
                <p className="text-forest-900/60 text-sm font-body mb-3">Prefer WhatsApp? Message our sales team directly:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {salesTeam.map((member) => (
                    <a
                      key={member.phone}
                      href={`https://wa.me/${member.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-body text-[#25D366] hover:text-[#128C7E] transition-colors border border-[#25D366]/30 hover:border-[#128C7E] rounded-md px-3 py-1.5"
                    >
                      <MessageCircle className="w-3 h-3" />
                      {member.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-2xl text-forest-900 uppercase mb-3">
                Quotation Request Submitted
              </h3>
              <p className="text-forest-900/70 text-base font-body max-w-[480px] mx-auto mb-8">
                Thank you! Our sales team will review your request and get back to you within 24 hours.
              </p>
              <Link
                to="/"
                className="bg-forest-900 text-white px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
