import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { services as fallbackServices } from "../data/services";
import { useFeatures } from "../hooks/useFeatures";
import { usePages } from "../hooks/usePages";
import { formatMoney } from "../lib/format";
import SEOHead from "../components/SEOHead";
import { withBase } from "../lib/paths";

export default function Services() {
  const { data: apiFeatures } = useFeatures();
  const { data: pages } = usePages();

  /**
   * 06 §11 p.4 — the SEO / service pages come from the ERP CMS (GET /pages), so the client can add a
   * keyword page or change a starting price without a developer (§9 p.4). The ERP's own list wins; a
   * feature list, then src/data/services.ts, keep the page working on an older ERP.
   */
  const services = useMemo(() => {
    if (pages && pages.length > 0) {
      return pages.map((p) => ({
        slug: p.slug,
        title: p.title,
        shortTitle: p.title,
        description: p.excerpt ?? "",
        image: p.image_url ?? p.product?.featured_image ?? withBase("/images/real-printer-jersey.jpg"),
        startingPrice: p.starting_price,
      }));
    }
    if (apiFeatures && apiFeatures.length > 0) {
      return apiFeatures.map((f: any) => {
        const slug = (f.link_url || "").replace(/^\/services\//, "") || f.title.toLowerCase().replace(/\s+/g, "-");
        return {
          slug,
          title: f.title,
          shortTitle: f.title,
          description: f.description || "",
          image: f.image_path?.startsWith("/") ? f.image_path : (f.image_url || withBase("/images/real-printer-jersey.jpg")),
        };
      });
    }
    return fallbackServices;
  }, [pages, apiFeatures]);

  return (
    <>
      <SEOHead
        title="Printing, Custom Apparel & Corporate Merchandise Services in Sabah"
        description="Explore ASK Creative's printing services including sublimation jersey printing, custom apparel, T-shirt printing, embroidery, digital printing, banners, premium gifts and corporate merchandise in Sabah."
        keywords="printing services Sabah, sublimation printing, custom jersey, custom apparel, embroidery Kota Kinabalu, digital printing, banner printing, premium gifts Sabah"
        canonical="/services"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">Our Services</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            Printing, Custom Apparel & Corporate Merchandise Services in Sabah
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[680px] mx-auto">
            ASK Creative provides a wide range of custom printing and production services for businesses, teams, schools, events and organizations.
          </p>
        </div>
      </section>

      {/* Service Cards */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => (
              <Link
                key={service.slug}
                to={`/services/${service.slug}`}
                className="group block bg-white rounded-lg overflow-hidden border border-forest-900/10 hover:border-forest-900/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="overflow-hidden">
                  <img loading="lazy" decoding="async"
                    src={service.image}
                    alt={service.title}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="font-display text-2xl text-forest-900 uppercase mb-3">{service.shortTitle}</h3>
                  <p className="text-forest-900/70 text-base font-body leading-relaxed mb-4">{service.description}</p>
                  {/* 06 §11 p.4 — starting price on the service page and in its card. */}
                  {(service as { startingPrice?: number | null }).startingPrice != null && (
                    <p className="text-forest-900 text-sm font-body font-medium mb-4" data-starting-price>
                      From {formatMoney((service as { startingPrice?: number | null }).startingPrice)} per piece
                      <span className="text-forest-900/50"> · final price confirmed by sales</span>
                    </p>
                  )}
                  <span className="text-forest-900 text-sm font-body font-medium flex items-center gap-1 group-hover:text-teal-600 transition-colors">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-off-white py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-forest-900 uppercase leading-tight mb-2">
              Ready to Start Your Project?
            </h3>
            <p className="text-forest-900/60 text-base font-body">Request a free quotation from our team today.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/quotation"
              className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors text-center"
            >
              Get Quotation
            </Link>
            <Link
              to="/contact"
              className="border border-forest-900 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900 hover:text-white transition-colors text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
