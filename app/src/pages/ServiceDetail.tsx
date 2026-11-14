import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Check, ArrowRight, Send, Loader2 } from "lucide-react";
import { getServiceBySlug, getRelatedServices } from "../data/services";
import SEOHead from "../components/SEOHead";
import FaqList from "../components/FaqList";
import { useSettings } from "../hooks/useSettings";
import { usePage } from "../hooks/usePages";
import { useQuoteRequest } from "../hooks/useQuoteRequest";
import { formatMoney } from "../lib/format";
import { withBase } from "../lib/paths";

const FALLBACK_SALES_TEAM = [
  { name: "Mrs. Dayang", phone: "60102174774" },
  { name: "Mrs. Khalisah", phone: "60143584774" },
  { name: "Mrs. Michelle", phone: "60162164774" },
  { name: "Ms. Suhaznie", phone: "60146024474" },
  { name: "Ms. Fara", phone: "60102174750" },
];

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: settings } = useSettings();
  const salesTeam = (settings?.sales_team && settings.sales_team.length > 0) ? settings.sales_team : FALLBACK_SALES_TEAM;

  /**
   * 06 §11 p.4 + §9 p.4 — the page comes from the ERP CMS (GET /pages/{slug}), which also resolves the
   * slugs this site published earlier. src/data/services.ts is the offline fallback only.
   */
  const { data: page, isLoading: pageLoading } = usePage(slug);
  const fallback = getServiceBySlug(slug || "");

  const quote = useQuoteRequest();
  const [sent, setSent] = useState(false);

  if (!page && !fallback && !pageLoading) {
    return <Navigate to="/services" replace />;
  }
  if (!page && !fallback) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-forest-900/40" />
      </div>
    );
  }

  // One shape for the view, whichever source answered.
  const service = {
    slug: page?.slug ?? fallback!.slug,
    title: page?.title ?? fallback!.title,
    shortTitle: fallback?.shortTitle ?? page!.title,
    metaTitle: page?.meta_title ?? fallback?.metaTitle ?? page!.title,
    metaDescription: page?.meta_description ?? fallback?.metaDescription ?? page?.excerpt ?? "",
    description: page?.excerpt ?? fallback?.description ?? "",
    longDescription: page?.content ?? fallback?.longDescription ?? "",
    features: fallback?.features ?? [],
    image: page?.image_url ?? page?.product?.featured_image ?? fallback?.image ?? withBase("/images/real-printer-jersey.jpg"),
    products: fallback?.products,
  };

  // 06 §11 p.4 "Each SEO page should include … starting price …" — RM, from the catalogue price range
  // the admin maintains, never a quotation (06 §5 "final price … subject to sales confirmation").
  const startingPrice = page?.starting_price ?? page?.product?.price_min ?? null;
  const moq = page?.product?.moq ?? null;
  const leadTime = page?.product?.lead_time_days ?? null;

  const submitQuotation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    quote.mutate(
      {
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
        notes: String(form.get("notes") ?? "") || undefined,
        product_snapshot: { service: service.slug, service_title: service.title, source_page: `/services/${service.slug}` },
        website: String(form.get("website") ?? ""),
        _t: Date.now(),
      },
      { onSuccess: () => setSent(true) },
    );
  };

  const relatedServices = getRelatedServices(service.slug);

  return (
    <>
      <SEOHead
        title={service.metaTitle}
        description={service.metaDescription}
        keywords={`${service.shortTitle} Sabah, ${service.shortTitle} Kota Kinabalu, custom printing Sabah`}
        canonical={`/services/${service.slug}`}
        ogImage={service.image}
        ogType="product"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: service.shortTitle,
          name: service.title,
          description: service.longDescription || service.description,
          provider: {
            "@type": "LocalBusiness",
            name: "ASK Creative Sdn Bhd",
            url: "https://askcreativeprinting.com",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Kota Kinabalu",
              addressRegion: "Sabah",
              addressCountry: "MY",
            },
          },
          areaServed: { "@type": "State", name: "Sabah, Malaysia" },
          url: `https://askcreativeprinting.com/services/${service.slug}`,
        }}
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
            {service.shortTitle}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            {service.title}
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[640px]">{service.description}</p>
          {/* 06 §11 p.4 — starting price, MOQ and lead time of this service. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6" data-service-facts>
            {startingPrice !== null && (
              <p className="text-[#d7ff00] text-base font-body" data-starting-price>
                From <span className="font-display text-2xl">{formatMoney(startingPrice)}</span> per piece
              </p>
            )}
            {moq !== null && <p className="text-white/50 text-sm font-body">Minimum order {moq} pcs</p>}
            {leadTime !== null && <p className="text-white/50 text-sm font-body">Lead time about {leadTime} days</p>}
          </div>
          {startingPrice !== null && (
            <p className="text-white/40 text-xs font-body mt-2">
              Indicative only — your final price in RM is confirmed by our sales team.
            </p>
          )}
        </div>
      </section>

      {/* Service Details */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl md:text-3xl text-forest-900 uppercase mb-6">
                What We Offer
              </h2>
              <div className="text-forest-900/70 text-base font-body leading-relaxed mb-6 whitespace-pre-line">
                {service.longDescription}
              </div>

              <div className="mb-8">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full rounded-lg object-cover aspect-video"
                />
              </div>

              <h3 className="font-display text-xl text-forest-900 uppercase mb-4">
                Key Features
              </h3>
              <ul className="space-y-3 mb-8">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <span className="text-forest-900/70 text-base font-body">{feature}</span>
                  </li>
                ))}
              </ul>

              {service.products && (
                <>
                  <h3 className="font-display text-xl text-forest-900 uppercase mb-4">
                    Products Available
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {service.products.map((product, i) => (
                      <span
                        key={i}
                        className="bg-off-white text-forest-900/70 text-sm font-body px-3 py-1.5 rounded-md"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* 06 §11 p.4 "Each SEO page should include … FAQ" — from the one admin FAQ store (§12). */}
              <div className="mt-10">
                <FaqList forSlug={service.slug} items={page?.faqs} />
              </div>

              {/* 06 §11 p.4 "product photos" — the past work of this service (§10 portfolio). */}
              {page?.gallery && page.gallery.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-display text-xl text-forest-900 uppercase mb-4">Our Work</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {page.gallery.slice(0, 6).map((item) => (
                      <figure key={item.id} className="overflow-hidden rounded-lg">
                        <img
                          src={item.image_url ?? item.image_path ?? ""}
                          alt={item.title ?? service.title}
                          className="w-full aspect-[4/3] object-cover"
                          loading="lazy"
                        />
                        <figcaption className="text-forest-900/60 text-xs font-body mt-2">
                          {item.title}
                          {item.quantity ? ` · ${item.quantity} pcs` : ""}
                          {item.printing_method ? ` · ${item.printing_method}` : ""}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-off-white rounded-lg p-6 md:p-8">
                <h3 className="text-forest-900 text-xl font-body font-medium mb-5">
                  Request a Quotation
                </h3>
                {/* 06 §11 p.4 "Each SEO page should include … quotation form". It used to discard
                    everything typed into it (onSubmit preventDefault, no request); it now reaches the
                    ERP enquiry inbox like every other form on the site, and the reply carries the
                    enquiry number (06 §5 "Customer should receive an enquiry number"). */}
                {sent ? (
                  <div className="bg-white border border-teal-500/30 rounded-md p-5" data-quote-sent>
                    <p className="text-forest-900 text-sm font-body font-medium mb-1">Thank you — we have your request.</p>
                    <p className="text-forest-900/60 text-sm font-body">
                      Our sales team will come back to you with a price confirmation in RM.
                    </p>
                    <Link to="/quotation" className="text-teal-600 text-sm font-body underline mt-3 inline-block">
                      Need to send sizes or artwork? Use the full quotation form
                    </Link>
                  </div>
                ) : (
                <form className="space-y-4" onSubmit={submitQuotation}>
                  {/* honeypot — bots fill this; real visitors never see it */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
                         style={{ position: "absolute", left: "-9999px" }} />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Your Name *"
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Email Address *"
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone / WhatsApp Number"
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500"
                  />
                  <textarea
                    rows={4}
                    name="notes"
                    placeholder="Tell us about your project — quantity, sizes, deadline..."
                    className="w-full px-4 py-3 rounded-md border border-forest-900/15 bg-white text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500 resize-none"
                  />
                  {quote.isError && (
                    <p className="text-red-600 text-sm font-body">
                      {quote.error?.message || "We could not send your request. Please try WhatsApp below."}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={quote.isPending}
                    className="w-full bg-[#d7ff00] text-[#0d1f16] px-5 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {quote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {quote.isPending ? "Sending..." : "Get Quotation"}
                  </button>
                </form>
                )}

                <div className="mt-6 pt-6 border-t border-forest-900/10">
                  <p className="text-forest-900/60 text-sm font-body mb-3">Or WhatsApp us:</p>
                  <div className="flex flex-wrap gap-2">
                    {salesTeam.map((member) => (
                      <a
                        key={member.phone}
                        href={`https://wa.me/${member.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-body text-forest-900/60 hover:text-teal-600 transition-colors border border-forest-900/15 hover:border-teal-500/30 rounded px-2 py-1"
                      >
                        {member.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="bg-off-white py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <h3 className="font-display text-2xl text-forest-900 uppercase mb-8">Related Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedServices.map((svc) => (
              <Link
                key={svc.slug}
                to={`/services/${svc.slug}`}
                className="group block bg-white rounded-lg overflow-hidden border border-forest-900/10 hover:shadow-md transition-all"
              >
                <img
                  src={svc.image}
                  alt={svc.title}
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="p-5">
                  <h4 className="text-forest-900 text-base font-body font-medium mb-1">{svc.shortTitle}</h4>
                  <p className="text-forest-900/60 text-sm font-body line-clamp-2">{svc.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-forest-900 py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-white uppercase leading-tight mb-2">
              Ready to Get Started?
            </h3>
            <p className="text-white/50 text-base font-body">Contact our team for a custom quotation.</p>
          </div>
          <Link
            to="/quotation"
            className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors flex items-center gap-2 shrink-0"
          >
            Get Quotation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
