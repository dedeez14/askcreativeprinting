import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { useSettings } from "../hooks/useSettings";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Clients", href: "/clients" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const serviceLinks = [
  { label: "Sublimation Printing", href: "/services/sublimation-printing-sabah" },
  { label: "Custom Jersey", href: "/services/custom-jersey-printing-sabah" },
  { label: "Custom Apparel", href: "/services/custom-apparel-sabah" },
  { label: "T-Shirt Printing", href: "/services/t-shirt-printing-sabah" },
  { label: "Embroidery", href: "/services/embroidery-kota-kinabalu" },
  { label: "Digital Printing", href: "/services/digital-printing-kota-kinabalu" },
  { label: "Banner & Bunting", href: "/services/banner-bunting-printing-kota-kinabalu" },
  { label: "Premium Gifts", href: "/services/premium-gifts-sabah" },
  { label: "Online Design", href: "/online-design" },
  { label: "Get Quotation", href: "/quotation" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Data Deletion", href: "/data-deletion" },
];

const FALLBACK_SALES_TEAM = [
  { name: "Mrs. Dayang", phone: "60102174774" },
  { name: "Mrs. Khalisah", phone: "60143584774" },
  { name: "Mrs. Michelle", phone: "60162164774" },
  { name: "Ms. Suhaznie", phone: "60146024474" },
  { name: "Ms. Fara", phone: "60102174750" },
];

export default function Footer() {
  const { data: settings } = useSettings();
  const logoUrl = settings?.logo_url || "/images/ask-logo-header.webp"; // 1 kB copy of ask-logo.png (2954 px, 216 kB)
  const tagline = settings?.site_tagline || "Custom Printing & Sublimation Jersey Specialist in Kota Kinabalu, Sabah.";
  const instagramUrl = settings?.social?.instagram || "https://www.instagram.com/askcreativeprinting";
  const facebookUrl = settings?.social?.facebook || "https://www.facebook.com/ASKCreativePrintingServices";
  const contactPhone = settings?.contact_phone || "088 205 423";
  const contactEmail = settings?.contact_email || "sales@askcreativeprinting.com";
  const contactAddress = settings?.contact_address || "ASK Creative, No A6-1, Ground Floor, Block A, Kepayan Perdana, 88200 Kota Kinabalu, Sabah, Malaysia";
  const salesTeam = (settings?.sales_team && settings.sales_team.length > 0) ? settings.sales_team : FALLBACK_SALES_TEAM;

  return (
    <footer className="bg-[#0d1f16] text-white">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 pt-16 md:pt-20 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img
                src={logoUrl}
                alt="ASK Creative"
                loading="lazy"
                className="h-12 w-auto brightness-0 invert opacity-90"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </Link>
            <p className="text-white/50 text-sm font-body leading-relaxed mb-6">
              {tagline}
            </p>
            <div className="flex items-center gap-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-[#d7ff00] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-[#d7ff00] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.08em] mb-5">
              Quick Links
            </h2>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white/50 text-sm font-body hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h2 className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.08em] mb-5">
              Our Services
            </h2>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white/50 text-sm font-body hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.08em] mb-5">
              Contact Us
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
                <div>
                  <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="text-white/70 text-sm font-body hover:text-white transition-colors block">
                    {contactPhone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-white/70 text-sm font-body hover:text-white transition-colors"
                >
                  {contactEmail}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
                <p className="text-white/50 text-sm font-body leading-relaxed">
                  {contactAddress}
                </p>
              </div>

              <div className="pt-2">
                <p className="text-white/60 text-xs font-body mb-2">WhatsApp Sales Team:</p>
                <div className="flex flex-wrap gap-2">
                  {salesTeam.map((member) => (
                    <a
                      key={member.phone}
                      href={`https://wa.me/${member.phone.replace(/\+/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-body text-white/60 hover:text-[#d7ff00] transition-colors border border-white/10 hover:border-[#d7ff00]/30 rounded px-2 py-1"
                    >
                      {member.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-xs font-body">
            &copy; 2025 ASK Creative Sdn Bhd. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-white/60 text-xs font-body hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
