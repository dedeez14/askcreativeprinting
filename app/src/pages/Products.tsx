import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import SEOHead from "../components/SEOHead";
import { useProducts } from "../hooks/useProducts";
import type { LandingProduct } from "../types/landing";

function priceLabel(p: LandingProduct): string {
  const cur = p.price_currency === "MYR" ? "RM" : p.price_currency;
  const min = p.price_min ? Number(p.price_min) : null;
  const max = p.price_max ? Number(p.price_max) : null;
  if (min && max && max !== min) return `${cur} ${min} – ${cur} ${max}`;
  if (min) return `From ${cur} ${min}`;
  return "Request a quote";
}

export default function Products() {
  const { data: products, isLoading, isError } = useProducts();
  const [activeCat, setActiveCat] = useState<string>("all");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    (products ?? []).forEach((p) => {
      if (p.category?.slug) map.set(p.category.slug, p.category.name);
    });
    return Array.from(map, ([slug, name]) => ({ slug, name }));
  }, [products]);

  const visible = useMemo(
    () => (products ?? []).filter((p) => activeCat === "all" || p.category?.slug === activeCat),
    [products, activeCat]
  );

  return (
    <>
      <SEOHead
        title="Our Products | Custom Apparel, Printing & Premium Gifts — ASK Creative Sabah"
        description="Browse ASK Creative's product range: sublimation jerseys, custom apparel, T-shirt printing, embroidery, banners and premium gifts. See fabric, collar, size chart, MOQ and lead time, then request a quotation."
        keywords="custom apparel Sabah, sublimation jersey, jersey printing Kota Kinabalu, premium gifts Sabah, product catalogue"
        canonical="/products"
      />

      {/* Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
            Product Catalogue
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            Our Products
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[640px]">
            Explore our custom apparel, printing services and premium gifts — each with fabric,
            collar, size chart, minimum order quantity and lead time. Found what you need? Request a
            quotation in a few clicks.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              <button
                onClick={() => setActiveCat("all")}
                className={`px-4 py-2 rounded-md text-sm font-body transition-colors ${
                  activeCat === "all" ? "bg-[#0d1f16] text-white" : "bg-off-white text-forest-900/70 hover:bg-off-white/70"
                }`}
              >
                All Products
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setActiveCat(c.slug)}
                  className={`px-4 py-2 rounded-md text-sm font-body transition-colors ${
                    activeCat === c.slug ? "bg-[#0d1f16] text-white" : "bg-off-white text-forest-900/70 hover:bg-off-white/70"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-off-white animate-pulse aspect-[4/5]" />
              ))}
            </div>
          )}

          {isError && (
            <div className="text-center py-16">
              <p className="text-forest-900/60 font-body">
                We couldn't load products right now. Please try again or{" "}
                <Link to="/quotation" className="text-teal-500 underline">request a quotation</Link>.
              </p>
            </div>
          )}

          {!isLoading && !isError && visible.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-10 h-10 text-forest-900/30 mx-auto mb-3" />
              <p className="text-forest-900/60 font-body">No products in this category yet.</p>
            </div>
          )}

          {!isLoading && visible.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.slug}`}
                  className="group rounded-lg overflow-hidden bg-off-white border border-transparent hover:border-forest-900/10 transition-colors"
                >
                  <div className="aspect-[4/3] bg-forest-900/5 overflow-hidden">
                    {p.featured_image ? (
                      <img
                        src={p.featured_image}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-forest-900/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {p.category?.name && (
                      <p className="text-[#0d1f16]/50 text-[11px] font-body uppercase tracking-[0.08em] mb-1">
                        {p.category.name}
                      </p>
                    )}
                    <h3 className="font-display text-lg text-forest-900 uppercase leading-tight mb-2">
                      {p.name}
                    </h3>
                    {p.short_description && (
                      <p className="text-forest-900/60 text-sm font-body line-clamp-2 mb-3">
                        {p.short_description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-forest-900 text-sm font-body font-medium">{priceLabel(p)}</span>
                      <span className="text-teal-500 text-sm font-body inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        View <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                    {p.moq > 0 && (
                      <p className="text-forest-900/40 text-xs font-body mt-2">Min. order {p.moq} pcs</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
