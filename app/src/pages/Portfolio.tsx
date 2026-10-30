import { useState, useMemo } from "react";
import SEOHead from "../components/SEOHead";
import { useGallery } from "../hooks/useGallery";

/**
 * 06 §10 p.4 — "Each portfolio entry should include product type, client type if allowed, quantity,
 * printing method, and short description." The entries come from the ERP CMS (Admin → Landing →
 * Gallery), where those fields are now part of the form; these fallbacks are the offline copy.
 */
const FALLBACK_ITEMS = [
  { image: "/images/real-jersey-design.jpg", category: "Sublimation Jersey", title: "Custom SUBLAB Volleyball Jersey #10" },
  { image: "/images/real-jersey-showroom.jpg", category: "Sublimation Jersey", title: "Jersey Showroom Collection" },
  { image: "/images/real-jersey-rack.jpg", category: "Custom Jersey", title: "SUBLAB Basketball Jersey #23" },
  { image: "/images/real-embroidery-close.jpg", category: "Embroidery", title: "SEWMEX Logo Embroidery" },
  { image: "/images/real-screen-print.jpg", category: "T-Shirt Printing", title: "Screen Printing Production Line" },
  { image: "/images/real-heat-press.jpg", category: "Sublimation Printing", title: "Heat Transfer Calendering" },
];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: apiGallery } = useGallery();

  const portfolioItems = useMemo(() => {
    if (apiGallery && apiGallery.items.length > 0) {
      return apiGallery.items.map((g) => ({
        image: g.image_path?.startsWith("/") ? g.image_path : (g.image_url || g.image_path || ""),
        category: g.category || "General",
        title: g.title ?? "",
        description: g.description ?? null,
        productType: g.product_type ?? null,
        clientType: g.client_type ?? null,
        quantity: g.quantity ?? null,
        printingMethod: g.printing_method ?? null,
      }));
    }
    return FALLBACK_ITEMS.map((i) => ({
      ...i, description: null, productType: null, clientType: null, quantity: null, printingMethod: null,
    }));
  }, [apiGallery]);

  /**
   * 06 §10 p.4 — the eight categories the brief names come from the API's own list, so each of them is
   * offered even before the first entry is uploaded into it; a category only an entry uses is added.
   */
  const categories = useMemo(() => {
    const fromApi = apiGallery?.categories ?? [];
    const used = portfolioItems.map((i) => i.category);
    const all = fromApi.length > 0 ? [...fromApi, ...used] : used;
    return ["All", ...Array.from(new Set(all))];
  }, [apiGallery, portfolioItems]);

  const filtered = activeCategory === "All"
    ? portfolioItems
    : portfolioItems.filter((item) => item.category === activeCategory);

  return (
    <>
      <SEOHead
        title="Our Portfolio | Custom Printing Work by ASK Creative Sabah"
        description="Explore our custom printing work across jerseys, apparel, banners, embroidery and premium gifts. View our portfolio of projects for clients across Sabah."
        keywords="portfolio, custom printing work, jersey design, corporate apparel, banner printing, ASK Creative portfolio"
        canonical="/portfolio"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            Our Portfolio
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[640px] mx-auto">
            Explore our custom printing work across jerseys, apparel, banners, embroidery and premium gifts.
          </p>
        </div>
      </section>

      {/* Filter + Gallery */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-md text-sm font-body font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-forest-900 text-white"
                    : "border border-forest-900/15 text-forest-900/70 hover:bg-forest-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="overflow-hidden rounded-lg relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <span className="text-white text-sm font-body font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      View Details
                    </span>
                  </div>
                </div>
                <p className="text-teal-600 text-xs font-body uppercase tracking-wider mt-3">{item.category}</p>
                <p className="text-forest-900 text-base font-body font-medium mt-1">{item.title}</p>
                {/* 06 §10 p.4 — product type, client type (when allowed), quantity, printing method. */}
                {(item.productType || item.clientType || item.quantity || item.printingMethod) && (
                  <p className="text-forest-900/50 text-xs font-body mt-1" data-entry-facts>
                    {[
                      item.productType,
                      item.clientType,
                      item.quantity ? `${item.quantity} pcs` : null,
                      item.printingMethod,
                    ].filter(Boolean).join(" · ")}
                  </p>
                )}
                {item.description && (
                  <p className="text-forest-900/60 text-sm font-body mt-1 line-clamp-2">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-off-white py-16 md:py-20">
        <div className="max-w-[720px] mx-auto px-5 md:px-10 text-center">
          <h3 className="font-display text-2xl md:text-3xl text-forest-900 uppercase mb-6">
            Have a Project in Mind?
          </h3>
          <a
            href="/quotation"
            className="inline-block bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors"
          >
            Request a Quotation
          </a>
        </div>
      </section>
    </>
  );
}
