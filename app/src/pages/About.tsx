import { Link } from "react-router-dom";
import { Eye, Target, Printer, Image, Flame, Scissors, PenTool, CheckCircle } from "lucide-react";
import SEOHead from "../components/SEOHead";
import { useAbout } from "../hooks/useAbout";
import { useSettings } from "../hooks/useSettings";
import { withBase } from "../lib/paths";

const equipment = [
  { icon: Printer, title: "Sublimation Printers", desc: "Large-format sublimation printers for vibrant full-colour fabric printing." },
  { icon: Image, title: "Digital Printers", desc: "High-resolution digital printers for banners, stickers and promotional materials." },
  { icon: Flame, title: "Heat Press Machines", desc: "Industrial heat press for durable, high-quality transfers." },
  { icon: Scissors, title: "Cutting & Sewing", desc: "Precision cutting and professional sewing for custom apparel." },
  { icon: PenTool, title: "Embroidery Machines", desc: "Multi-head embroidery for logos, patches and detailed stitching." },
  { icon: CheckCircle, title: "Quality Finishing", desc: "Careful inspection and professional packaging for every order." },
];

const FALLBACK_DESCRIPTION = "ASK Creative is an innovative printing and apparel production company based in Kota Kinabalu, Sabah. We provide quality products and services with a strong focus on sublimation jersey printing, custom apparel, T-shirt printing, embroidery, digital printing, premium gifts and corporate merchandise.";
const FALLBACK_VISI = "To become a global industry player in sublimation jersey printing and custom apparel production.";
const FALLBACK_MISI = ["To provide opportunities for passionate people to grow, succeed and contribute through creativity, quality and innovation."];

export default function About() {
  const { data: aboutData } = useAbout();
  const { data: settings } = useSettings();
  const about = aboutData as any;

  const heroTitle = about?.title || "About ASK Creative";
  const heroSubtitle = about?.subtitle || "An innovative printing and apparel production company based in Kota Kinabalu, Sabah — specializing in sublimation jersey printing, custom apparel, and corporate merchandise.";
  const description = about?.description || FALLBACK_DESCRIPTION;
  const visi: string = about?.visi || FALLBACK_VISI;
  const misi: string[] = (about?.misi && Array.isArray(about.misi) && about.misi.length > 0) ? about.misi : FALLBACK_MISI;

  const phoneDisplay = settings?.contact_phone || "088 205 423";
  const emailDisplay = settings?.contact_email || "sales@askcreativeprinting.com";
  const addressDisplay = settings?.contact_address || "No A6-1, Ground Floor, Block A, Kepayan Perdana, 88200 Kota Kinabalu, Sabah, Malaysia";

  return (
    <>
      <SEOHead
        title="About ASK Creative | Printing & Sublimation Jersey Company in Sabah"
        description="Learn about ASK Creative, a Kota Kinabalu-based printing and custom apparel company specializing in sublimation jersey printing, custom apparel, embroidery, digital printing and premium gifts."
        keywords="ASK Creative, printing company Kota Kinabalu, sublimation jersey Sabah, custom apparel Sabah, about ASK Creative"
        canonical="/about-us"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">About Us</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            {heroTitle}
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[640px]">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-forest-900 uppercase leading-[0.95] mb-6">
                Our Story
              </h2>
              <div className="text-forest-900/70 text-base font-body leading-relaxed mb-6 whitespace-pre-line">
                {description}
              </div>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 border border-forest-900 text-forest-900 px-5 py-2.5 rounded-md text-sm font-body font-medium hover:bg-forest-900 hover:text-white transition-colors"
              >
                View Our Services
              </Link>
            </div>
            <div>
              <img
                src={withBase("/images/real-storefront.jpg")}
                alt="ASK Creative storefront - Sabah Custom Jersey Expert"
                className="w-full rounded-lg object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="bg-off-white py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-white rounded-lg p-10 md:p-12 border border-forest-900/10">
              <Eye className="w-8 h-8 text-teal-500 mb-5" />
              <p className="text-forest text-xs font-body font-medium uppercase tracking-[0.1em] mb-3">Our Vision</p>
              <p className="font-display text-2xl md:text-3xl text-forest-900 leading-tight">
                {visi}
              </p>
            </div>
            <div className="bg-white rounded-lg p-10 md:p-12 border border-forest-900/10">
              <Target className="w-8 h-8 text-teal-500 mb-5" />
              <p className="text-forest text-xs font-body font-medium uppercase tracking-[0.1em] mb-3">Our Mission</p>
              <div className="font-display text-2xl md:text-3xl text-forest-900 leading-tight space-y-3">
                {misi.map((m, i) => (
                  <p key={i}>{m}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facility & Production */}
      <section className="bg-[#0d1f16] py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="mb-12">
            <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">Our Facility</p>
            <h2 className="font-display text-3xl md:text-4xl text-white uppercase leading-[0.95] mb-4">
              Production Capability
            </h2>
            <p className="text-white/50 text-base font-body max-w-[600px]">
              Our in-house facility in Kepayan Perdana, Kota Kinabalu is equipped with modern printing and production equipment.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item, i) => (
              <div key={i} className="flex flex-col">
                <item.icon className="w-8 h-8 text-[#d7ff00] mb-4" />
                <h3 className="text-white text-lg font-body font-medium mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm font-body leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-forest-900 uppercase leading-[0.95] mb-6">
                Visit Us in Kota Kinabalu
              </h2>
              <div className="space-y-5">
                <div>
                  <p className="text-forest-900 text-lg font-body font-medium">ASK Creative</p>
                  <p className="text-forest-900/70 text-base font-body leading-relaxed">
                    {addressDisplay}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-forest-900/70 text-sm font-body">
                    <span className="font-medium text-forest-900">Phone:</span>{" "}
                    <a href={`tel:${phoneDisplay.replace(/\s/g, "")}`} className="hover:text-teal-600 transition-colors">{phoneDisplay}</a>
                  </p>
                  <p className="text-forest-900/70 text-sm font-body">
                    <span className="font-medium text-forest-900">Email:</span>{" "}
                    <a href={`mailto:${emailDisplay}`} className="hover:text-teal-600 transition-colors">{emailDisplay}</a>
                  </p>
                </div>
                <a
                  href="https://maps.google.com/?q=Kepayan+Perdana+Kota+Kinabalu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#d7ff00] text-[#0d1f16] px-5 py-2.5 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors"
                >
                  Get Directions
                </a>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden h-[360px] bg-off-white">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3968.3!2d116.0735!3d5.9804!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwNTgnNDkuNCJFIDExNsKwMDQnMjQuNiJF!5e0!3m2!1sen!2smy!4v1"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "grayscale(20%)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="ASK Creative Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-forest-900 py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-white uppercase leading-tight mb-2">
              Work With ASK Creative
            </h3>
            <p className="text-white/50 text-base font-body">Let's discuss your next project.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/contact"
              className="bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors text-center"
            >
              Contact Us
            </Link>
            <Link
              to="/quotation"
              className="border border-[#d7ff00] text-[#d7ff00] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#d7ff00]/10 transition-colors text-center"
            >
              Get Quotation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
