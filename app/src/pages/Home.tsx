import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Shirt,
  Factory,
  Users,
  Printer,
  Scissors,
  Workflow,
  PenTool,
  Image,
  Gift,
  Award,
  Layers,
  Building2,
  MessageCircle,
  Palette,
  Heart,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import { useFeatures } from "../hooks/useFeatures";
import { useGallery } from "../hooks/useGallery";
import { useBrands } from "../hooks/useBrands";
import { useSettings } from "../hooks/useSettings";
import { useSalesWhatsApp } from "../hooks/useSalesWhatsApp";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";

// Map icon name (from API) → Lucide component
const ICON_MAP: Record<string, any> = {
  Printer, Shirt, Workflow, Scissors, PenTool, Image, Gift,
  Vest: Shirt, Flag: Image,
  MapPin, Factory, Users, Award, Layers, Building2, MessageCircle, Palette, Heart,
};




/* ─── Trust Bar Data ─── */
const trustPoints = [
  { icon: MapPin, text: "Sabah-based printing & custom apparel company" },
  { icon: Shirt, text: "Specialist in sublimation jersey printing" },
  { icon: Factory, text: "In-house production & experienced team" },
  { icon: Users, text: "Trusted by companies, schools, teams & organizations" },
];

/* ─── Services Data ─── */
const servicesData = [
  { icon: Printer, title: "Sublimation Printing", desc: "Full sublimation printing for jerseys, pants, lanyards, flags, aprons, table cloths and more.", link: "/services/sublimation-printing-sabah" },
  { icon: Shirt, title: "Custom Jersey Printing", desc: "Custom jerseys for football teams, running events, school teams and corporate sports days.", link: "/services/custom-jersey-printing-sabah" },
  { icon: Workflow, title: "Custom Apparel", desc: "Corporate shirts, polo shirts, jackets, hoodies, windbreakers, uniforms and teamwear.", link: "/services/custom-apparel-sabah" },
  { icon: Scissors, title: "T-Shirt Printing", desc: "Silkscreen, heat press and vinyl printing for events, uniforms and campaigns.", link: "/services/t-shirt-printing-sabah" },
  { icon: PenTool, title: "Embroidery", desc: "Professional embroidery for company logos, uniforms, caps, jackets and patches.", link: "/services/embroidery-kota-kinabalu" },
  { icon: Image, title: "Digital Printing", desc: "Banners, buntings, backdrops, roll-ups, stickers and promotional materials.", link: "/services/digital-printing-kota-kinabalu" },
  { icon: Gift, title: "Premium Gifts", desc: "Mugs, medals, bags, umbrellas, plaques, keychains, wristbands and ID cards.", link: "/services/premium-gifts-sabah" },
];

/* ─── Gallery Data ─── */
const galleryItems = [
  { image: "/images/real-jersey-design.jpg", category: "Sublimation Jersey", title: "Custom SUBLAB Volleyball Jersey" },
  { image: "/images/real-jersey-rack.jpg", category: "Custom Jersey", title: "SUBLAB Basketball Jersey Collection" },
  { image: "/images/real-screen-print.jpg", category: "T-Shirt Printing", title: "Screen Printing Production" },
  { image: "/images/real-embroidery.jpg", category: "Embroidery", title: "Multi-Head SEWMEX Embroidery" },
  { image: "/images/real-digital-print.jpg", category: "Digital Printing", title: "Large-Format Banner Printing" },
  { image: "/images/real-mugs.jpg", category: "Premium Gifts", title: "Branded Mugs - Smart Talks Sabah" },
];

/* ─── Client Names ─── */
const clients = ["PETRA", "JKR Sabah", "SEDCO", "Sabah FC", "UMS", "UiTM", "SME Bank", "Sawit Kinabalu", "SESB", "Etiqa", "Politeknik", "Bank Rakyat"];

/* ─── Why Choose Data ─── */
const whyChooseData = [
  { icon: Award, title: "Sublimation Jersey Specialist", desc: "Deep expertise in full-dye sublimation for sports teams and events." },
  { icon: Layers, title: "Wide Range of Services", desc: "From jerseys to banners to premium gifts — all under one roof." },
  { icon: Factory, title: "In-House Production", desc: "Full control over quality, timeline and customization." },
  { icon: Users, title: "Experienced Team", desc: "Years of serving corporate, school and government clients across Sabah." },
  { icon: Building2, title: "Corporate & Event Ready", desc: "Bulk orders, uniform programs and event merchandise specialists." },
  { icon: MessageCircle, title: "Easy Quotation", desc: "Request quotes via WhatsApp or our online form — fast response." },
  { icon: Palette, title: "Design Support", desc: "Our team helps with artwork preparation and design guidance." },
  { icon: Heart, title: "Customer-Focused Service", desc: "We prioritize your satisfaction from first contact to delivery." },
];

/* ─── How to Order Steps ─── */
const steps = [
  { title: "Choose Product", desc: "Select jersey, apparel, banner or gift." },
  { title: "Design or Upload", desc: "Use our online tool or send your artwork." },
  { title: "Add Details", desc: "Specify quantity, sizes and deadline." },
  { title: "Get Quotation", desc: "Receive pricing from our sales team." },
  { title: "Confirm Artwork", desc: "Review and approve the final design." },
  { title: "Production", desc: "We print, sew, embroider and finish." },
  { title: "Collect or Deliver", desc: "Pick up in KK or arrange delivery." },
];

/* ─── Production Images ─── */
const productionImages = [
  { src: "/images/real-printer-jersey.jpg", alt: "TS55-1800 sublimation printer printing jersey designs" },
  { src: "/images/real-heat-press.jpg", alt: "Large-format heat transfer calendering machine" },
  { src: "/images/real-laser-cut.jpg", alt: "UNIKONEX laser cutting printed jerseys" },
  { src: "/images/real-embroidery-close.jpg", alt: "SEWMEX embroidery machine stitching logos" },
  { src: "/images/real-jersey-showroom.jpg", alt: "Jersey showroom with colourful collections" },
  { src: "/images/real-printer-fleet.jpg", alt: "Sublimation printing facility with multiple printers" },
];

/**
 * 06 §13 p.3 — "clear CTA after every section": a compact quotation + WhatsApp row closing a content
 * section. `dark` matches the dark-green sections, otherwise it sits on a light background.
 */
function SectionCta({ whatsappHref, dark = false, align = "start" }: { whatsappHref: string; dark?: boolean; align?: "start" | "center" }) {
  return (
    <div
      className={`mt-10 md:mt-12 flex flex-col sm:flex-row gap-3 ${align === "center" ? "sm:justify-center" : ""}`}
      data-section-cta
    >
      <Link
        to="/quotation"
        className={`px-6 py-3 rounded-md text-sm font-body font-medium transition-colors text-center ${dark ? "bg-[#d7ff00] text-[#0d1f16] hover:bg-[#e5ff4d]" : "bg-forest-900 text-white hover:bg-forest-800"}`}
      >
        Get Quotation
      </Link>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`px-6 py-3 rounded-md text-sm font-body font-medium transition-colors text-center flex items-center justify-center gap-2 ${dark ? "border border-white/30 text-white hover:border-[#d7ff00] hover:text-[#d7ff00]" : "border border-forest-900/30 text-forest-900 hover:border-forest-900 hover:bg-forest-900/5"}`}
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp Sales Team
      </a>
    </div>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { data: apiFeatures } = useFeatures();
  const { data: apiGallery } = useGallery();
  const { data: apiBrands } = useBrands();
  const { data: settings } = useSettings();
  const sales = useSalesWhatsApp();

  /**
   * 06 §2 p.3 — "Homepage should show trust indicators: years of experience, clients served, items
   * printed, production capability, and core services." The figures are admin-editable
   * (GET /settings → hero_stats, Admin → Landing → Settings → Hero Stats); a stat with no value is
   * not rendered, so the band never shows an empty figure.
   */
  const stats = useMemo(
    () => (settings?.hero_stats ?? []).filter((s: any) => s?.value && s?.label),
    [settings],
  );

  const trust = useMemo(() => {
    if (settings?.trust_points && settings.trust_points.length > 0) {
      return settings.trust_points.map((t: any) => ({ icon: ICON_MAP[t.icon] || MapPin, text: t.text }));
    }
    return trustPoints;
  }, [settings]);

  const whyChoose = useMemo(() => {
    if (settings?.why_choose && settings.why_choose.length > 0) {
      return settings.why_choose.map((w: any) => ({ icon: ICON_MAP[w.icon] || Award, title: w.title, desc: w.desc }));
    }
    return whyChooseData;
  }, [settings]);

  const orderSteps = useMemo(() => {
    if (settings?.order_steps && settings.order_steps.length > 0) {
      return settings.order_steps;
    }
    return steps;
  }, [settings]);

  const prodImages = useMemo(() => {
    if (settings?.production_images && settings.production_images.length > 0) {
      return settings.production_images;
    }
    return productionImages;
  }, [settings]);

  const services = useMemo(() => {
    if (apiFeatures && apiFeatures.length > 0) {
      return apiFeatures.map((f: any) => ({
        icon: ICON_MAP[f.icon] || Printer,
        title: f.title,
        desc: f.description || "",
        link: f.link_url || "/services",
      }));
    }
    return servicesData;
  }, [apiFeatures]);

  const gallery = useMemo(() => {
    if (apiGallery && apiGallery.items.length > 0) {
      return apiGallery.items.slice(0, 6).map((g: any) => ({
        image: g.image_path?.startsWith("/") ? g.image_path : (g.image_url || g.image_path),
        category: g.category || "General",
        title: g.title,
      }));
    }
    return galleryItems;
  }, [apiGallery]);

  const brandNames = useMemo(() => {
    if (apiBrands && apiBrands.length > 0) {
      return apiBrands.map((b: any) => b.name);
    }
    return clients;
  }, [apiBrands]);

  // Entrance animations for sections below the hero.
  useRevealOnScroll();

  return (
    <>
      <SEOHead
        title="ASK Creative Printing | Sublimation Jersey & Custom Printing Sabah"
        description="ASK Creative provides sublimation jersey printing, custom apparel, T-shirt printing, embroidery, banner printing and premium gifts in Kota Kinabalu, Sabah. Design online and request a quotation today."
        keywords="sublimation printing Sabah, jersey printing Kota Kinabalu, custom jersey Sabah, custom apparel Sabah, T-shirt printing Sabah, embroidery Kota Kinabalu, banner printing Kota Kinabalu, premium gift Sabah, printing company Kota Kinabalu"
        canonical="/"
      />

      {/* ─── HERO SECTION ─── */}
      <section
        ref={heroRef}
        className="relative w-full overflow-hidden bg-[#0d1f16]"
        style={{ height: "100vh", minHeight: "600px" }}
      >
        {/* Background Image - TS55-1800 Printer Fleet */}
        <div className="absolute inset-0 w-full h-full">
          {/* The page's LCP element: WebP (78 kB vs 121 kB JPEG), in the prerendered HTML, high priority. */}
          <img
            fetchPriority="high"
            src="/images/real-hero-printers.webp"
            width={1200}
            height={900}
            alt="ASK Creative TS55-1800 sublimation printer fleet in Kota Kinabalu"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-5 max-w-[800px]">
            <p className="text-[#d7ff00] text-sm font-body uppercase tracking-[0.1em] mb-4">
              ASK Creative Sdn Bhd
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[80px] text-white uppercase leading-[0.95] mb-6">
              <span className="block mb-2">Custom Printing</span>
              <span className="block">& Jersey Specialist</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg font-body max-w-[560px] mx-auto mb-8">
              Sublimation printing, custom apparel, embroidery, and premium gifts in Kota Kinabalu, Sabah.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* 06 §2 p.3 — hero CTAs in the brief's order: Get Instant Quotation, Design Your Apparel,
                  WhatsApp Sales Team, View Services. */}
              <Link
                to="/quotation"
                className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors w-full sm:w-auto text-center"
              >
                Get Instant Quotation
              </Link>
              <Link
                to="/online-design"
                className="border border-[#d7ff00] text-[#d7ff00] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#d7ff00]/10 transition-colors w-full sm:w-auto text-center"
              >
                Design Your Apparel
              </Link>
              <a
                href={sales.link("Hi ASK Creative, I would like to ask about custom printing.")}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/30 text-white px-6 py-3 rounded-md text-sm font-body font-medium hover:border-[#d7ff00] hover:text-[#d7ff00] transition-colors w-full sm:w-auto text-center flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Sales Team
              </a>
              {/* 06 §2 p.3 — the fourth hero CTA the brief names: "View Services". */}
              <Link
                to="/services"
                className="border border-white/30 text-white px-6 py-3 rounded-md text-sm font-body font-medium hover:border-[#d7ff00] hover:text-[#d7ff00] transition-colors w-full sm:w-auto text-center"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/60 text-xs font-body uppercase tracking-wider">Scroll</span>
          <div className="w-5 h-8 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-[#d7ff00] rounded-full" />
          </div>
        </div>
      </section>

      {/* ─── TRUST INDICATORS (06 §2 p.3) ─── */}
      {stats.length > 0 && (
        <section className="bg-[#d7ff00] py-8 md:py-10" data-trust-stats>
          <div className="max-w-[1280px] mx-auto px-5 md:px-10">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 text-center">
              {stats.map((stat: any, i: number) => (
                <div key={i} data-trust-stat={stat.label}>
                  <div className="font-display text-3xl md:text-4xl text-[#0d1f16] leading-none">{stat.value}</div>
                  <div className="text-[#0d1f16]/70 text-xs md:text-sm font-body uppercase tracking-wider mt-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── TRUST BAR ─── */}
      <section className="bg-forest-900 py-6 md:py-8">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8" data-stagger>
            {trust.map((point, i) => (
              <div key={i} className="flex items-center gap-3">
                <point.icon className="w-5 h-5 text-[#d7ff00] shrink-0" />
                <span className="text-white text-sm font-body">{point.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section className="bg-white py-20 md:py-32">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div data-animate>
              <p className="text-forest text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
                About Us
              </p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-forest-900 uppercase leading-[0.95] mb-6">
                Your Trusted Printing & Custom Apparel Partner in Sabah
              </h2>
              <p className="text-forest-900/80 text-base font-body leading-relaxed mb-6">
                ASK Creative is a Kota Kinabalu-based printing and apparel production company offering sublimation jersey printing, custom T-shirt printing, embroidery, digital printing, premium gifts and corporate merchandise. With a wide range of services and production capability, we help businesses, teams, schools and organizations create high-quality custom products.
              </p>
              <Link
                to="/about-us"
                className="inline-flex items-center gap-2 border border-forest-900 text-forest-900 px-5 py-2.5 rounded-md text-sm font-body font-medium hover:bg-forest-900 hover:text-white transition-colors"
              >
                View Company Profile
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div data-animate>
              <img
                loading="lazy"
                decoding="async"
                src="/images/real-building.jpg"
                alt="ASK Creative headquarters at Kepayan Perdana, Kota Kinabalu"
                className="w-full rounded-lg object-cover aspect-[4/3]"
              />
            </div>
          </div>
          <SectionCta whatsappHref={sales.link("Hi ASK Creative, I would like a quotation.")} />
        </div>
      </section>

      {/* ─── SERVICES SECTION ─── */}
      <section className="bg-[#0d1f16] py-20 md:py-36">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="mb-12 md:mb-16" data-animate>
            <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
              Our Services
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white uppercase leading-[0.95] mb-4">
              Printing, Apparel & Merchandise Solutions
            </h2>
            <p className="text-white/50 text-base font-body max-w-[640px]">
              Whether you need team jerseys, corporate shirts, banners, embroidered caps, event merchandise or premium gifts, ASK Creative offers flexible custom printing solutions.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-stagger>
            {services.map((svc, i) => (
              <Link
                key={i}
                to={svc.link}
                className="group bg-white/[0.03] border border-white/10 rounded-lg p-7 hover:border-[#d7ff00]/50 hover:bg-[#d7ff00]/[0.03] transition-all duration-300 hover:-translate-y-1"
              >
                <svc.icon className="w-10 h-10 text-[#d7ff00] mb-5" />
                <h3 className="text-white text-lg font-body font-medium mb-3">{svc.title}</h3>
                <p className="text-white/50 text-sm font-body leading-relaxed mb-4">{svc.desc}</p>
                <span className="text-[#d7ff00] text-sm font-body flex items-center gap-1 group-hover:underline">
                  Learn More <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
          <SectionCta whatsappHref={sales.link("Hi ASK Creative, I would like a quotation.")} dark />
        </div>
      </section>

      {/* ─── ONLINE DESIGN CTA ─── */}
      <section className="bg-gradient-to-br from-forest-900 to-[#0d1f16] py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div data-animate>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white uppercase leading-[0.95] mb-6">
                Design Your Custom Product Online
              </h2>
              <p className="text-white/50 text-base font-body leading-relaxed max-w-[520px] mb-8">
                Start your order faster with ASK Creative's online design and quotation tool. Choose a product, upload your logo or artwork, customize the design, add names and numbers, select quantity and submit your request.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/online-design"
                  className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors text-center"
                >
                  Start Designing Online
                </Link>
                <Link
                  to="/quotation"
                  className="border border-[#d7ff00] text-[#d7ff00] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#d7ff00]/10 transition-colors text-center"
                >
                  Upload Existing Design
                </Link>
              </div>
            </div>
            <div data-animate>
              <img
                loading="lazy"
                decoding="async"
                src="/images/real-designer.jpg"
                alt="ASK Creative designer working on custom jersey designs"
                className="w-full rounded-lg object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRODUCTION CAPABILITY ─── */}
      <section className="bg-off-white py-20 md:py-36">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="mb-12" data-animate>
            <p className="text-forest text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
              Our Facility
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-forest-900 uppercase leading-[0.95] mb-4">
              From Design to Production, We Handle the Details
            </h2>
            <p className="text-forest-900/80 text-base font-body">
              ASK Creative supports customers with artwork preparation, sublimation printing, digital printing, heat press, cutting, sewing, finishing and embroidery.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-stagger>
            {prodImages.map((img, i) => (
              <div key={i} className="overflow-hidden rounded-lg">
                <img
                loading="lazy"
                decoding="async"
                  src={img.src}
                  alt={img.alt}
                  className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
          <SectionCta whatsappHref={sales.link("Hi ASK Creative, I would like a quotation.")} />
        </div>
      </section>

      {/* ─── GALLERY PREVIEW ─── */}
      <section className="bg-[#0d1f16] py-20 md:py-36">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 md:mb-14 gap-4" data-animate>
            <div>
              <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
                Portfolio
              </p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white uppercase leading-[0.95]">
                Explore Our Custom Printing Work
              </h2>
            </div>
            <Link to="/portfolio" className="text-[#d7ff00] text-sm font-body flex items-center gap-1 hover:underline shrink-0">
              View Full Portfolio <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-stagger>
            {gallery.map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="overflow-hidden rounded-lg relative">
                  <img
                loading="lazy"
                decoding="async"
                    src={item.image}
                    alt={item.title}
                    className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <span className="text-white text-sm font-body font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      View Project
                    </span>
                  </div>
                </div>
                <p className="text-[#d7ff00] text-xs font-body uppercase tracking-wider mt-3">{item.category}</p>
                <p className="text-white text-base font-body font-medium mt-1">{item.title}</p>
              </div>
            ))}
          </div>
          <SectionCta whatsappHref={sales.link("Hi ASK Creative, I would like a quotation.")} dark />
        </div>
      </section>

      {/* ─── CLIENTS SECTION ─── */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="text-center mb-10 md:mb-14" data-animate>
            <p className="text-forest text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
              Our Clients
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-forest-900 uppercase leading-[0.95] mb-4">
              Trusted by Organizations Across Sabah
            </h2>
            <p className="text-forest-900/80 text-base font-body max-w-[560px] mx-auto">
              ASK Creative has worked with companies, agencies, schools, teams and organizations across different industries.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-stagger>
            {brandNames.map((client, i) => (
              <div
                key={i}
                className="flex items-center justify-center h-20 border border-forest-900/15 rounded-lg hover:border-forest-900 hover:bg-forest-50 transition-colors duration-200"
              >
                <span className="text-forest-900/80 text-sm font-body font-medium uppercase tracking-wider">
                  {client}
                </span>
              </div>
            ))}
          </div>
          <SectionCta whatsappHref={sales.link("Hi ASK Creative, I would like a quotation.")} align="center" />
        </div>
      </section>

      {/* ─── MARQUEE SECTION ─── */}
      <section className="bg-forest-900 py-10 md:py-14 overflow-hidden">
        <div className="animate-marquee-left whitespace-nowrap flex">
          {[...Array(2)].map((_, setIdx) => (
            <span key={setIdx} className="font-display text-5xl md:text-7xl lg:text-[100px] text-[#d7ff00] uppercase tracking-tight mx-4 shrink-0">
              Sublimation &bull; Jersey Printing &bull; Custom Apparel &bull; Embroidery &bull; Digital Printing &bull; Premium Gifts &bull; Corporate Merchandise &bull;&nbsp;
            </span>
          ))}
        </div>
      </section>

      {/* ─── WHY CHOOSE SECTION ─── */}
      <section className="bg-off-white py-20 md:py-36">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="mb-10 md:mb-14" data-animate>
            <p className="text-forest text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
              Why Us
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-forest-900 uppercase leading-[0.95]">
              Why Customers Choose ASK Creative
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" data-stagger>
            {whyChoose.map((item, i) => (
              <div key={i} className="flex flex-col">
                <item.icon className="w-8 h-8 text-teal-500 mb-4" />
                <h3 className="text-forest-900 text-base font-body font-medium mb-2">{item.title}</h3>
                <p className="text-forest-900/80 text-sm font-body leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <SectionCta whatsappHref={sales.link("Hi ASK Creative, I would like a quotation.")} />
        </div>
      </section>

      {/* ─── HOW TO ORDER SECTION ─── */}
      <section className="bg-[#0d1f16] py-20 md:py-36">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="mb-10 md:mb-14" data-animate>
            <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
              Process
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white uppercase leading-[0.95]">
              How to Start Your Custom Order
            </h2>
          </div>
          <div className="relative">
            {/* Connecting line - desktop */}
            <div className="hidden lg:block absolute top-5 left-0 right-0 h-px bg-[#d7ff00]/20" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-8 lg:gap-4" data-stagger>
              {orderSteps.map((step, i) => (
                <div key={i} className="relative flex flex-col items-start lg:items-center">
                  <div className="w-10 h-10 rounded-full border border-[#d7ff00] flex items-center justify-center text-[#d7ff00] font-display text-lg bg-[#0d1f16] shrink-0 mb-4 z-10">
                    {i + 1}
                  </div>
                  <h3 className="text-white text-base font-body font-medium mb-1 lg:text-center">{step.title}</h3>
                  <p className="text-white/50 text-sm font-body leading-relaxed lg:text-center">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA SECTION ─── */}
      <section className="bg-gradient-to-br from-forest-900 to-[#0d1f16] py-24 md:py-40">
        <div className="max-w-[720px] mx-auto px-5 md:px-10 text-center" data-animate>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white uppercase leading-[0.95] mb-6">
            Need Custom Printing, Jerseys or Corporate Merchandise?
          </h2>
          <p className="text-white/50 text-base font-body leading-relaxed max-w-[560px] mx-auto mb-10">
            Send us your design idea, product requirement or reference image. Our sales team will help you prepare a quotation and guide you through the next step.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/quotation"
              className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors w-full sm:w-auto"
            >
              Get Quotation Now
            </Link>
            <a
              href={sales.link("Hi ASK Creative, I would like a quotation.")}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#d7ff00] text-[#d7ff00] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#d7ff00]/10 transition-colors w-full sm:w-auto"
            >
              WhatsApp Our Team
            </a>
            <Link
              to="/online-design"
              className="border border-white/30 text-white px-6 py-3 rounded-md text-sm font-body font-medium hover:border-white hover:bg-white/5 transition-colors w-full sm:w-auto"
            >
              Start Your Design
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
