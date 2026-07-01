import { useState, useMemo } from "react";
import SEOHead from "../components/SEOHead";
import { useBrands } from "../hooks/useBrands";

const FALLBACK_CLIENTS = [
  { name: "PETRA", category: "Corporate" },
  { name: "JKR Sabah", category: "Government" },
  { name: "SEDCO", category: "Government" },
  { name: "Sabah Football Club", category: "Sports" },
  { name: "UMS", category: "Education" },
  { name: "UiTM", category: "Education" },
  { name: "SME Bank", category: "Corporate" },
  { name: "Sawit Kinabalu", category: "Corporate" },
  { name: "SESB", category: "Government" },
  { name: "Etiqa", category: "Corporate" },
  { name: "Politeknik Malaysia", category: "Education" },
  { name: "Bank Rakyat", category: "Corporate" },
  { name: "Sasa Rice", category: "Corporate" },
  { name: "Sabah Tourism", category: "Government" },
  { name: "Nexus Golf Resort", category: "Corporate" },
  { name: "Royal Sabah Turf Club", category: "Sports" },
];

export default function Clients() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: brands } = useBrands();

  // Map API brands → {name, category} shape. Use `description` field as category.
  // Fallback to hardcoded if API empty/loading/error.
  const clients = useMemo(() => {
    if (brands && brands.length > 0) {
      return brands.map((b: any) => ({
        name: b.name,
        category: b.description || "Corporate",
      }));
    }
    return FALLBACK_CLIENTS;
  }, [brands]);

  // Categories derived from data (with "All" prefix)
  const categories = useMemo(() => {
    const set = new Set<string>(clients.map(c => c.category));
    return ["All", ...Array.from(set).sort()];
  }, [clients]);

  const filtered = activeCategory === "All"
    ? clients
    : clients.filter((c) => c.category === activeCategory);

  return (
    <>
      <SEOHead
        title="Our Clients | Organizations Trusted by ASK Creative Sabah"
        description="Proud to serve organizations across Sabah including government agencies, corporations, schools, and sports teams. See our client list."
        keywords="ASK Creative clients, printing clients Sabah, corporate clients Kota Kinabalu, government printing contracts"
        canonical="/clients"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            Our Clients
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[560px] mx-auto">
            Proud to serve organizations across Sabah and beyond.
          </p>
        </div>
      </section>

      {/* Client Grid */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          {/* Filter */}
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

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((client, i) => (
              <div
                key={i}
                className="flex items-center justify-center h-24 border border-forest-900/15 rounded-lg hover:border-forest-900 hover:bg-forest-50 transition-all duration-200"
              >
                <span className="text-forest-900/70 text-sm font-body font-medium uppercase tracking-wider">
                  {client.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-off-white py-16 md:py-20">
        <div className="max-w-[720px] mx-auto px-5 md:px-10 text-center">
          <h3 className="font-display text-2xl md:text-3xl text-forest-900 uppercase mb-6">
            Join Our Growing List of Clients
          </h3>
          <p className="text-forest-900/60 text-base font-body mb-8">
            Whether you are a government agency, corporation, school, or sports team — we are ready to serve your printing needs.
          </p>
          <a
            href="/quotation"
            className="inline-block bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors"
          >
            Get a Quotation
          </a>
        </div>
      </section>
    </>
  );
}
