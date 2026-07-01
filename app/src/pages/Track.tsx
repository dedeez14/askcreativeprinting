import { useState } from "react";
import { PackageSearch, ArrowRight, MessageCircle } from "lucide-react";
import SEOHead from "../components/SEOHead";
import { useSettings } from "../hooks/useSettings";

const FALLBACK_SALES = "60102174774";

// Derive the ERP portal origin from the configured API base so the tracking
// link always points at the same backend the site talks to.
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "https://erp.askcreativeprinting.com/api/landing/v1";
const ERP_ORIGIN = (() => {
  try { return new URL(API_BASE).origin; } catch { return "https://erp.askcreativeprinting.com"; }
})();

/** Accepts a raw token OR a full portal link and returns the token. */
function extractToken(input: string): string {
  const raw = input.trim();
  const m = raw.match(/\/p\/(?:track|job|approval|artwork)\/([^/?#]+)/i);
  return (m ? m[1] : raw).replace(/[^A-Za-z0-9._-]/g, "");
}

export default function Track() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data: settings } = useSettings();
  const sales = settings?.sales_team?.[0]?.phone || FALLBACK_SALES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = extractToken(code);
    if (token.length < 6) {
      setError("Please enter the full tracking code or link you received from ASK Creative.");
      return;
    }
    // Open the ERP customer tracking portal for this order.
    window.location.href = `${ERP_ORIGIN}/p/track/${encodeURIComponent(token)}`;
  };

  return (
    <>
      <SEOHead
        title="Track Your Order | ASK Creative Sabah"
        description="Track your ASK Creative order status — design, approval, production and delivery. Enter the tracking code or link we sent you via WhatsApp or email."
        keywords="track order ASK Creative, order status, production tracking Kota Kinabalu"
        canonical="/track"
      />

      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">Order Status</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            Track Your Order
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[640px]">
            Follow your job from design and approval through production to delivery. Enter the
            tracking code or link ASK Creative sent you.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[640px] mx-auto px-5 md:px-10">
          <div className="bg-off-white rounded-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-lg bg-[#0d1f16] flex items-center justify-center shrink-0">
                <PackageSearch className="w-5 h-5 text-[#d7ff00]" />
              </div>
              <div>
                <h2 className="font-display text-xl text-forest-900 uppercase leading-tight">Enter tracking code</h2>
                <p className="text-forest-900/50 text-sm font-body">Sent to you via WhatsApp or email.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(null); }}
                placeholder="e.g. fpyJhi4IlWlB…  or paste the tracking link"
                className="w-full rounded-md border border-forest-900/15 bg-white px-4 py-3 text-forest-900 font-body focus:outline-none focus:border-teal-500"
                autoFocus
              />
              {error && <p className="text-red-600 text-sm font-body">{error}</p>}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full bg-[#d7ff00] text-[#0d1f16] font-body font-medium px-5 py-3 rounded-md hover:brightness-95 transition"
              >
                Track Order <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-forest-900/10">
              <p className="text-forest-900/60 text-sm font-body mb-2">
                Lost your code, or the link expired?
              </p>
              <a
                href={`https://wa.me/${sales}?text=${encodeURIComponent("Hi ASK Creative, I'd like to check my order status.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-teal-500 hover:text-teal-600 text-sm font-body"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp our sales team
              </a>
            </div>
          </div>

          <p className="text-forest-900/40 text-xs font-body text-center mt-5">
            You'll only ever see your own order's simplified status — no internal or pricing details.
          </p>
        </div>
      </section>
    </>
  );
}
