import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, ArrowRight, MessageCircle, Upload, Package, Clock, Layers } from "lucide-react";
import SEOHead from "../components/SEOHead";
import FaqList from "../components/FaqList";
import { useProduct } from "../hooks/useProducts";
import { useSettings } from "../hooks/useSettings";
import type { LandingProduct, LandingProductOptionItem } from "../types/landing";

const FALLBACK_SALES_TEAM = [
  { name: "Mrs. Dayang", phone: "60102174774" },
  { name: "Mrs. Khalisah", phone: "60143584774" },
  { name: "Mrs. Michelle", phone: "60162164774" },
  { name: "Ms. Suhaznie", phone: "60146024474" },
  { name: "Ms. Fara", phone: "60102174750" },
];

function priceLabel(p: LandingProduct): string {
  const cur = p.price_currency === "MYR" ? "RM" : p.price_currency;
  const min = p.price_min ? Number(p.price_min) : null;
  const max = p.price_max ? Number(p.price_max) : null;
  if (min && max && max !== min) return `${cur} ${min} – ${cur} ${max}`;
  if (min) return `From ${cur} ${min}`;
  return "Request a quote";
}

function OptionChips({ label, items }: { label: string; items?: LandingProductOptionItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-5">
      <h4 className="text-forest-900 text-sm font-body font-medium mb-2">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={it.code ?? i} className="bg-off-white text-forest-900/70 text-sm font-body px-3 py-1.5 rounded-md">
            {it.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: settings } = useSettings();
  const salesTeam = settings?.sales_team && settings.sales_team.length > 0 ? settings.sales_team : FALLBACK_SALES_TEAM;
  const [activeImg, setActiveImg] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="bg-white pt-32 md:pt-40 pb-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="h-8 w-56 bg-off-white rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 aspect-video bg-off-white rounded-lg animate-pulse" />
            <div className="h-64 bg-off-white rounded-lg animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (isError || !product) {
    return (
      <section className="bg-white pt-32 md:pt-40 pb-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <Package className="w-12 h-12 text-forest-900/20 mx-auto mb-4" />
          <h1 className="font-display text-3xl text-forest-900 uppercase mb-3">Product not found</h1>
          <p className="text-forest-900/60 font-body mb-6">This product may have been moved or is no longer listed.</p>
          <Link to="/products" className="inline-flex items-center gap-2 text-teal-500 font-body">
            Browse all products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  const opts = product.options ?? {};
  const gallery = [product.featured_image, ...(product.gallery_images ?? [])].filter(Boolean) as string[];
  const heroImg = activeImg ?? gallery[0] ?? null;
  const waMsg = encodeURIComponent(`Hi ASK Creative, I'm interested in "${product.name}". Please share a quotation.`);
  const quoteHref = `/quotation?product=${encodeURIComponent(product.name)}`;

  return (
    <>
      <SEOHead
        title={product.meta_title || `${product.name} | ASK Creative Sabah`}
        description={product.meta_description || product.short_description || `Custom ${product.name} by ASK Creative — fabric, collar, size chart, MOQ and lead time. Request a quotation today.`}
        keywords={`${product.name}, ${product.category?.name ?? "custom apparel"} Sabah, jersey printing Kota Kinabalu`}
        canonical={`/products/${product.slug}`}
        ogImage={product.featured_image || undefined}
        ogType="product"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.short_description || product.description || product.name,
          image: gallery,
          category: product.category?.name,
          brand: { "@type": "Brand", name: "ASK Creative Sdn Bhd" },
          ...(product.price_min
            ? {
                offers: {
                  "@type": "AggregateOffer",
                  priceCurrency: product.price_currency || "MYR",
                  lowPrice: Number(product.price_min),
                  ...(product.price_max ? { highPrice: Number(product.price_max) } : {}),
                  availability: "https://schema.org/InStock",
                },
              }
            : {}),
        }}
      />

      {/* Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-12 md:pb-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
            <Link to="/products" className="hover:underline">Products</Link>
            {product.category?.name ? ` / ${product.category.name}` : ""}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            {product.name}
          </h1>
          {product.short_description && (
            <p className="text-white/50 text-lg font-body max-w-[640px]">{product.short_description}</p>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
            {/* Main */}
            <div className="lg:col-span-2">
              {/* Gallery */}
              {heroImg && (
                <div className="mb-8">
                  <img src={heroImg} alt={product.name} className="w-full rounded-lg object-cover aspect-video" />
                  {gallery.length > 1 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {gallery.map((g, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(g)}
                          className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                            heroImg === g ? "border-teal-500" : "border-transparent hover:border-forest-900/20"
                          }`}
                        >
                          <img src={g} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick facts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <div className="bg-off-white rounded-lg p-4">
                  <Package className="w-5 h-5 text-teal-500 mb-1.5" />
                  <p className="text-forest-900/50 text-xs font-body uppercase tracking-wide">Min. Order</p>
                  <p className="text-forest-900 font-body font-medium">{product.moq > 0 ? `${product.moq} pcs` : "Flexible"}</p>
                </div>
                <div className="bg-off-white rounded-lg p-4">
                  <Clock className="w-5 h-5 text-teal-500 mb-1.5" />
                  <p className="text-forest-900/50 text-xs font-body uppercase tracking-wide">Lead Time</p>
                  <p className="text-forest-900 font-body font-medium">
                    {product.lead_time_days ? `${product.lead_time_days} days` : "Ask sales"}
                  </p>
                </div>
                <div className="bg-off-white rounded-lg p-4">
                  <Layers className="w-5 h-5 text-teal-500 mb-1.5" />
                  <p className="text-forest-900/50 text-xs font-body uppercase tracking-wide">Est. Price</p>
                  <p className="text-forest-900 font-body font-medium">{priceLabel(product)}</p>
                </div>
              </div>

              {product.description && (
                <>
                  <h2 className="font-display text-2xl text-forest-900 uppercase mb-4">Description</h2>
                  <p className="text-forest-900/70 text-base font-body leading-relaxed mb-8 whitespace-pre-line">
                    {product.description}
                  </p>
                </>
              )}

              {/* Options / specs */}
              {(opts.fabric_options || opts.collar_options || opts.sleeve_options || opts.finishing_options || opts.material_options || (opts.size_chart && opts.size_chart.length > 0)) && (
                <>
                  <h2 className="font-display text-2xl text-forest-900 uppercase mb-5">Specifications</h2>
                  <OptionChips label="Fabric options" items={opts.fabric_options} />
                  <OptionChips label="Collar options" items={opts.collar_options} />
                  <OptionChips label="Sleeve options" items={opts.sleeve_options} />
                  <OptionChips label="Finishing options" items={opts.finishing_options} />
                  <OptionChips label="Material options" items={opts.material_options} />

                  {opts.size_chart && opts.size_chart.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-forest-900 text-sm font-body font-medium mb-2">Size chart</h4>
                      <div className="flex flex-wrap gap-2">
                        {opts.size_chart.map((s, i) => (
                          <span key={i} className="bg-[#0d1f16] text-white text-sm font-body px-3 py-1.5 rounded-md min-w-[44px] text-center">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {opts.nameset_supported && (
                    <p className="flex items-center gap-2 text-forest-900/70 text-sm font-body mt-4">
                      <Check className="w-4 h-4 text-teal-500" /> Custom name &amp; number (nameset) supported
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-off-white rounded-lg p-6 md:p-8">
                <p className="text-forest-900/50 text-xs font-body uppercase tracking-[0.1em] mb-1">Estimated price</p>
                <p className="font-display text-2xl text-forest-900 uppercase mb-1">{priceLabel(product)}</p>
                <p className="text-forest-900/50 text-xs font-body mb-5">Final price confirmed by our sales team.</p>

                <Link
                  to={quoteHref}
                  className="flex items-center justify-center gap-2 w-full bg-[#d7ff00] text-[#0d1f16] font-body font-medium px-5 py-3 rounded-md hover:brightness-95 transition mb-3"
                >
                  Request a Quotation <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/online-design"
                  className="flex items-center justify-center gap-2 w-full border border-forest-900/20 text-forest-900 font-body px-5 py-3 rounded-md hover:bg-white transition mb-4"
                >
                  Design It Online
                </Link>

                <p className="flex items-start gap-2 text-forest-900/50 text-xs font-body mb-5">
                  <Upload className="w-4 h-4 shrink-0 mt-0.5" />
                  Attach your logo, artwork, size list or nameset (Excel/CSV) in the quotation form.
                </p>

                <p className="text-forest-900 text-sm font-body font-medium mb-2">Chat with our sales team</p>
                <div className="space-y-2">
                  {salesTeam.map((s) => (
                    <a
                      key={s.phone}
                      href={`https://wa.me/${s.phone}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-forest-900/70 hover:text-teal-500 text-sm font-body transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> {s.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 06 §12 p.4 "FAQ content should be reusable across product pages and SEO pages" — the same
              admin FAQ store as the FAQ page and the SEO pages, scoped to this product. */}
          <div className="mt-16 max-w-[760px]">
            <FaqList forSlug={product.slug} />
          </div>
        </div>
      </section>
    </>
  );
}
