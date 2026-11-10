import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PackageSearch, ArrowRight, MessageCircle, Check, Loader2, ExternalLink } from "lucide-react";
import SEOHead from "../components/SEOHead";
import { useSettings } from "../hooks/useSettings";
import { useJobStatus } from "../hooks/useJobStatus";
import { ERP_ORIGIN } from "../lib/api";
import { ENQUIRY_V2 } from "../lib/features";
import { formatDateTime } from "../lib/format";

const FALLBACK_SALES = "60102174774";

/** Accepts a raw token OR a full portal link and returns the token. */
function extractToken(input: string): string {
  const raw = input.trim();
  const m = raw.match(/\/p\/(?:track|job|approval|artwork|job-status)\/([^/?#]+)/i);
  return (m ? m[1] : raw).replace(/[^A-Za-z0-9._-]/g, "");
}

const portalUrl = (token: string) => `${ERP_ORIGIN}/p/track/${encodeURIComponent(token)}`;

/**
 * 06 B7 "Production Tracking for Customers" + B14: the page reads the ERP's customer status
 * feed (GET /p/job-status/{token}) and shows the simplified milestones only. Internal costing,
 * commission, wastage, payroll, staff names and internal notes are not in that response and are
 * never displayed here.
 *
 * Until the ERP serves that feed (VITE_ENQUIRY_V2=1 + the ERP promotion), the page keeps doing
 * what it does today: it opens the ERP tracking page for the token.
 */
export default function Track() {
  // /track?code=… — the link the WhatsApp enquiry message carries pre-fills (and runs) the lookup.
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get("code") ?? "";
  const [code, setCode] = useState(urlCode);
  const [token, setToken] = useState<string | null>(() => {
    const first = extractToken(urlCode);
    return ENQUIRY_V2 && first.length >= 6 ? first : null;
  });
  const [error, setError] = useState<string | null>(null);
  const { data: settings } = useSettings();
  const sales = settings?.sales_team?.[0]?.phone || FALLBACK_SALES;

  const status = useJobStatus(token);

  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !urlCode) return;
    autoRan.current = true;
    const next = extractToken(urlCode);
    // With the status feed on, the lookup already started from the initial state above.
    if (!ENQUIRY_V2 && next.length >= 6) window.location.href = portalUrl(next);
  }, [urlCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = extractToken(code);
    if (next.length < 6) {
      setError("Please enter the full tracking code or link you received from ASK Creative.");
      return;
    }
    setError(null);
    // Without the ERP status feed, open the ERP tracking page as before.
    if (!ENQUIRY_V2) {
      window.location.href = portalUrl(next);
      return;
    }
    setToken(next);
  };

  // The feed is missing or unreachable on this ERP — fall back to its own tracking page.
  const unavailable = ENQUIRY_V2 && !!token && status.isError;

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
              <label className="sr-only" htmlFor="track-code">Tracking code or link</label>
              <input
                id="track-code"
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(null); setToken(null); }}
                placeholder="e.g. fpyJhi4IlWlB…  or paste the tracking link"
                className="w-full rounded-md border border-forest-900/15 bg-white px-4 py-3 text-forest-900 font-body focus:outline-none focus:border-teal-500 [color-scheme:light]"
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

          {/* Simplified customer status (06 B7) */}
          {ENQUIRY_V2 && token && (
            <div className="mt-6">
              {status.isPending && (
                <div className="flex items-center gap-3 rounded-lg border border-forest-900/10 bg-white px-5 py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-forest-900/40" />
                  <p className="text-forest-900/60 text-sm font-body">Looking up your order…</p>
                </div>
              )}

              {unavailable && (
                <div className="rounded-lg border border-forest-900/10 bg-white px-5 py-4">
                  <p className="text-forest-900 text-sm font-body mb-3">
                    We could not load the status here. Open your tracking page instead:
                  </p>
                  <a
                    href={portalUrl(token)}
                    className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-body"
                  >
                    Open my tracking page <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {status.data && (
                <div className="rounded-lg border border-forest-900/10 bg-white p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                    <h3 className="font-display text-xl text-forest-900 uppercase leading-tight">
                      {status.data.job_title || "Your order"}
                    </h3>
                    {status.data.job_number && (
                      <span className="text-forest-900/50 text-sm font-body">{status.data.job_number}</span>
                    )}
                  </div>

                  {status.data.cancelled ? (
                    <p className="text-red-600 text-sm font-body mt-2">
                      This order has been cancelled. Please contact our sales team if that is unexpected.
                    </p>
                  ) : (
                    <>
                      <p className="text-teal-600 text-sm font-body font-medium mb-5">
                        {status.data.status_label ?? "In progress"}
                      </p>
                      <ol className="space-y-3">
                        {status.data.steps.map((step) => (
                          <li key={step.key} className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                step.state === "done"
                                  ? "bg-teal-500 text-white"
                                  : step.state === "current"
                                    ? "bg-[#d7ff00] text-[#0d1f16]"
                                    : "bg-forest-900/10 text-forest-900/40"
                              }`}
                            >
                              {step.state === "done" ? <Check className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </span>
                            <span
                              className={`text-sm font-body ${
                                step.state === "pending" ? "text-forest-900/40" : "text-forest-900"
                              } ${step.state === "current" ? "font-medium" : ""}`}
                            >
                              {step.label}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}

                  <div className="mt-6 pt-4 border-t border-forest-900/10 flex flex-wrap items-center justify-between gap-3">
                    {status.data.updated_at && (
                      <p className="text-forest-900/40 text-xs font-body">
                        Last updated {formatDateTime(status.data.updated_at)}
                      </p>
                    )}
                    <a
                      href={portalUrl(token)}
                      className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-body"
                    >
                      Full order page <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-forest-900/40 text-xs font-body text-center mt-5">
            You'll only ever see your own order's simplified status — no internal or pricing details.
          </p>
        </div>
      </section>
    </>
  );
}
