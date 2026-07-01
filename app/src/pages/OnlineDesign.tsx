import { useState, useRef, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shirt, Trophy, HardHat, StickyNote, Wine, Award, FileText,
  Gift, Tag, Sticker, Briefcase, Crown, Star, Heart,
  Package, ShoppingBag, Image as ImageIcon,
  Check, ChevronRight, ChevronLeft, Upload, Palette, Type, Ruler,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/SEOHead";
import { useQuoteRequest } from "../hooks/useQuoteRequest";
import { useFormTracking } from "../hooks/useFormTracking";
import { useDesignStudio } from "../hooks/useDesignStudio";

const ICONS: Record<string, LucideIcon> = {
  Shirt, Trophy, HardHat, StickyNote, Wine, Award, FileText,
  Gift, Tag, Sticker, Briefcase, Crown, Star, Heart,
  Package, ShoppingBag, Image: ImageIcon,
};
const iconFor = (name: string): LucideIcon => ICONS[name] ?? Shirt;

export default function OnlineDesign() {
  const { data: studio, isPending, error } = useDesignStudio();

  const [step, setStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [collar, setCollar] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(30);
  const [submitted, setSubmitted] = useState(false);

  const [contact, setContact] = useState({
    name: "", email: "", phone: "", company: "", delivery_date: "",
  });
  const formOpenedAt = useRef(Math.floor(Date.now() / 1000));
  const mutation = useQuoteRequest();
  const track = useFormTracking("online_design");

  // Funnel start = first real engagement (a product is chosen).
  useEffect(() => {
    if (selectedProduct) track.start();
  }, [selectedProduct, track]);

  // Initialize defaults the first time studio data lands
  useMemo(() => {
    if (!studio) return;
    if (!activeCategory && studio.categories[0]) setActiveCategory(studio.categories[0]);
    if (!collar && studio.collar_options[0])     setCollar(studio.collar_options[0]);
    if (!size && studio.sizes[0])                setSize(studio.sizes[0]);
    if (!color && studio.colors[0])              setColor(studio.colors[0]);
    if (quantity === 30 && studio.default_quantity) setQuantity(studio.default_quantity);
  }, [studio]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProducts = useMemo(
    () => (studio?.products ?? []).filter((p) => p.category === activeCategory),
    [studio, activeCategory]
  );

  const handleSubmit = () => {
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) {
      toast.error("Name, email and phone are required.");
      return;
    }
    if (!selectedProduct) {
      toast.error("Please choose a product first.");
      return;
    }
    mutation.mutate({
      name: contact.name.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
      product_snapshot: {
        source: "online_design_studio",
        product: selectedProduct,
        category: activeCategory,
        color, collar, size, quantity,
        company: contact.company.trim() || null,
        delivery_date: contact.delivery_date || null,
      },
      notes: `Design Studio submission — ${selectedProduct} (${activeCategory})`,
      website: "",
      _t: formOpenedAt.current,
    }, {
      onSuccess: () => { track.markSubmitted(); setSubmitted(true); toast.success("Design submitted! Sales team will follow up."); },
      onError: (err: any) => {
        if (err?.status === 429) toast.error("Terlalu banyak permintaan, coba lagi sebentar.");
        else if (err?.status === 422) toast.error(err?.message ?? "Periksa kembali isian Anda.");
        else toast.error("Server bermasalah, coba lagi.");
      },
    });
  };

  // ── Loading / error states ───────────────────────────────────────────
  if (isPending) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#d7ff00] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-forest-900/60 font-body">Loading design studio...</p>
        </div>
      </section>
    );
  }
  if (error || !studio) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-forest-900 font-body mb-2">Design studio unavailable.</p>
          <p className="text-forest-900/60 text-sm">Please refresh the page or contact us via WhatsApp.</p>
        </div>
      </section>
    );
  }
  if (!studio.enabled) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-forest-900 font-body">Design studio is currently offline.</p>
        </div>
      </section>
    );
  }

  const heroEyebrow    = studio.hero.eyebrow    ?? "Design Tool";
  const heroHeading    = studio.hero.heading    ?? "Design Your Custom Product Online";
  const heroSubheading = studio.hero.subheading ?? "Choose a product, upload your artwork, customize the design, and submit for quotation.";
  const waNumber = studio.whatsapp_number ?? "60102174774";

  return (
    <>
      <SEOHead
        title="Online Design Tool | Design Custom Jerseys & Products with ASK Creative"
        description="Design your custom jersey, apparel, banner, mug, lanyard or corporate gift online. Upload artwork, add names and numbers, choose quantity and submit for quotation."
        keywords="online design tool, custom jersey design, design your own jersey, online printing tool"
        canonical="/online-design"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">{heroEyebrow}</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">{heroHeading}</h1>
          <p className="text-white/50 text-lg font-body max-w-[640px] mx-auto">{heroSubheading}</p>
        </div>
      </section>

      {/* Step Wizard */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-[960px] mx-auto px-5 md:px-10">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-10 md:mb-14">
            {["Choose Product", "Customize", "Upload Design", "Submit"].map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-medium ${step > i + 1 ? "bg-teal-500 text-white" : step === i + 1 ? "bg-[#d7ff00] text-[#0d1f16]" : "bg-forest-900/10 text-forest-900/40"}`}>
                    {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs font-body mt-2 hidden md:block text-forest-900/60">{label}</span>
                </div>
                {i < 3 && <div className={`h-0.5 flex-1 mx-2 md:mx-4 ${step > i + 1 ? "bg-teal-500" : "bg-forest-900/10"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Choose Product */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl text-forest-900 uppercase mb-6">Choose Your Product</h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {studio.categories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-md text-sm font-body font-medium transition-colors ${activeCategory === cat ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/70 hover:bg-forest-900/10"}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const Icon = iconFor(product.icon);
                  return (
                    <button key={product.id} onClick={() => setSelectedProduct(product.name)}
                      className={`flex flex-col items-center gap-3 p-5 rounded-lg border transition-all ${selectedProduct === product.name ? "border-[#d7ff00] bg-[#d7ff00]/5" : "border-forest-900/10 hover:border-forest-900/30"}`}>
                      {product.image_url
                        ? <img src={product.image_url} alt={product.name} className="w-8 h-8 object-contain" />
                        : <Icon className="w-8 h-8 text-forest-900/70" />}
                      <span className="text-sm font-body text-forest-900">{product.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => selectedProduct && setStep(2)} disabled={!selectedProduct}
                  className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Customize */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl text-forest-900 uppercase mb-6">Customize Your Product</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-off-white rounded-lg p-8 flex items-center justify-center">
                  <div className="w-48 h-56 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: color }}>
                    <div className="text-center">
                      <Shirt className="w-16 h-16 mx-auto mb-2" style={{ color: color === "#ffffff" || color === "#d7ff00" ? "#0d1f16" : "#ffffff", opacity: 0.3 }} />
                      <p className="text-xs font-body" style={{ color: color === "#ffffff" || color === "#d7ff00" ? "#0d1f16" : "#ffffff", opacity: 0.5 }}>{selectedProduct}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-body font-medium text-forest-900 mb-2 flex items-center gap-2"><Palette className="w-4 h-4" /> Colour</label>
                    <div className="flex flex-wrap gap-2">
                      {studio.colors.map((c) => (
                        <button key={c} onClick={() => setColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-forest-900 scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-body font-medium text-forest-900 mb-2 flex items-center gap-2"><Type className="w-4 h-4" /> Collar Type</label>
                    <div className="flex flex-wrap gap-2">
                      {studio.collar_options.map((c) => (
                        <button key={c} onClick={() => setCollar(c)}
                          className={`px-3 py-1.5 rounded-md text-sm font-body transition-colors ${collar === c ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/70"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-body font-medium text-forest-900 mb-2 flex items-center gap-2"><Ruler className="w-4 h-4" /> Size</label>
                    <div className="flex flex-wrap gap-2">
                      {studio.sizes.map((s) => (
                        <button key={s} onClick={() => setSize(s)}
                          className={`w-10 h-10 rounded-md text-sm font-body font-medium transition-colors ${size === s ? "bg-forest-900 text-white" : "bg-off-white text-forest-900/70"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-body font-medium text-forest-900 mb-2">
                      Quantity: <span className="text-teal-600">{quantity}</span>
                    </label>
                    <input type="range"
                      min={studio.min_quantity}
                      max={studio.max_quantity}
                      step={10}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full accent-teal-500" />
                    <div className="flex justify-between text-xs text-forest-900/40 mt-1"><span>{studio.min_quantity}</span><span>{studio.max_quantity}</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(1)} className="border border-forest-900/20 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => setStep(3)} className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors flex items-center gap-2">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* Step 3: Upload Design */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-2xl text-forest-900 uppercase mb-6">Upload Your Design</h2>
              <div className="border-2 border-dashed border-forest-900/20 hover:border-[#d7ff00] rounded-lg p-12 text-center transition-colors cursor-pointer mb-6">
                <Upload className="w-10 h-10 text-forest-900/30 mx-auto mb-4" />
                <p className="text-forest-900 text-base font-body font-medium mb-2">Drop your files here or click to browse</p>
                <p className="text-forest-900/50 text-sm font-body">AI, EPS, PDF, PSD, PNG, JPG up to 50MB</p>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Team / Company Name" className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500" />
                <textarea rows={3} placeholder="Player names, numbers, sponsor logos, special remarks..." className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500 resize-none" />
              </div>
              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(2)} className="border border-forest-900/20 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => setStep(4)} className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors flex items-center gap-2">Next <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* Step 4: Submit */}
          {step === 4 && (
            <div>
              {!submitted ? (
                <>
                  <h2 className="font-display text-2xl text-forest-900 uppercase mb-6">Review & Submit</h2>
                  <div className="bg-off-white rounded-lg p-6 mb-6">
                    <h3 className="text-forest-900 text-base font-body font-medium mb-4">Order Summary</h3>
                    <div className="space-y-2 text-sm font-body">
                      <div className="flex justify-between"><span className="text-forest-900/60">Product:</span><span className="text-forest-900 font-medium">{selectedProduct}</span></div>
                      <div className="flex justify-between"><span className="text-forest-900/60">Colour:</span><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} /></div></div>
                      <div className="flex justify-between"><span className="text-forest-900/60">Collar:</span><span className="text-forest-900">{collar}</span></div>
                      <div className="flex justify-between"><span className="text-forest-900/60">Size:</span><span className="text-forest-900">{size}</span></div>
                      <div className="flex justify-between"><span className="text-forest-900/60">Quantity:</span><span className="text-forest-900">{quantity} pieces</span></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <input type="text" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Your Name *" required className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500" />
                    <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="Email Address *" required className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500" />
                    <input type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="Phone Number *" required className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500" />
                    <input type="text" value={contact.company} onChange={(e) => setContact({ ...contact, company: e.target.value })} placeholder="Company (optional)" className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body placeholder:text-forest-900/40 focus:outline-none focus:border-teal-500" />
                    <input type="date" value={contact.delivery_date} onChange={(e) => setContact({ ...contact, delivery_date: e.target.value })} placeholder="Delivery Date" className="w-full px-4 py-3 rounded-md border border-forest-900/15 text-forest-900 text-sm font-body focus:outline-none focus:border-teal-500" />
                  </div>
                  <div className="mt-8 flex justify-between">
                    <button onClick={() => setStep(3)} className="border border-forest-900/20 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                    <button onClick={handleSubmit} disabled={mutation.isPending} className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                      {mutation.isPending ? "Submitting..." : "Submit for Quotation"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-8 h-8 text-white" /></div>
                  <h3 className="font-display text-2xl text-forest-900 uppercase mb-3">Thank You!</h3>
                  <p className="text-forest-900/70 text-base font-body max-w-[480px] mx-auto mb-8">Our sales team will contact you within 24 hours with your quotation. For urgent enquiries, please WhatsApp us directly.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#128C7E] transition-colors">WhatsApp Our Team</a>
                    <Link to="/" className="border border-forest-900/20 text-forest-900 px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-forest-900/5 transition-colors">Back to Home</Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
