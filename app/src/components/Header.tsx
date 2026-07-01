import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Phone, MessageCircle } from "lucide-react";
import { useSettings } from "../hooks/useSettings";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Sublimation Printing", href: "/services/sublimation-printing-sabah" },
      { label: "Custom Jersey", href: "/services/custom-jersey-printing-sabah" },
      { label: "Custom Apparel", href: "/services/custom-apparel-sabah" },
      { label: "T-Shirt Printing", href: "/services/t-shirt-printing-sabah" },
      { label: "Embroidery", href: "/services/embroidery-kota-kinabalu" },
      { label: "Digital Printing", href: "/services/digital-printing-kota-kinabalu" },
      { label: "Banner & Bunting", href: "/services/banner-bunting-printing-kota-kinabalu" },
      { label: "Premium Gifts", href: "/services/premium-gifts-sabah" },
    ],
  },
  { label: "Products", href: "/products" },
  { label: "Track Order", href: "/track" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Clients", href: "/clients" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { data: settings } = useSettings();

  const logoUrl = settings?.logo_url || "/images/ask-logo.png";
  const waPhone = settings?.contact_phone?.replace(/\D/g, "") || "60102174774";
  const phoneDisplay = settings?.contact_phone || "088 205 423";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[rgba(13,31,22,0.97)] backdrop-blur-xl shadow-lg shadow-black/15"
            : "bg-[rgba(13,31,22,0.95)] backdrop-blur-md"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 flex items-center justify-between h-16 md:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src={logoUrl}
              alt="ASK Creative Sdn Bhd"
              className="h-9 md:h-10 w-auto"
              onError={(e) => {
                const fallback = `
                  <div class="flex items-center gap-1">
                    <span class="text-xl md:text-2xl font-display font-bold text-white tracking-tight">ASK</span>
                    <span class="text-[10px] md:text-xs font-body text-[#9CA33F] tracking-[0.2em] uppercase">Creative</span>
                  </div>
                `;
                (e.target as HTMLElement).style.display = "none";
                (e.target as HTMLElement).parentElement!.innerHTML = fallback;
              }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div key={link.href} className="relative group">
                {link.children ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setServicesOpen(true)}
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    <button
                      className={`flex items-center gap-1 text-sm font-body font-medium uppercase tracking-wider transition-colors duration-200 ${
                        isActive(link.href)
                          ? "text-[#d7ff00]"
                          : "text-white/80 hover:text-[#d7ff00]"
                      }`}
                    >
                      {link.label}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {servicesOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[280px]">
                        <div className="bg-[#0d1f16] border border-white/10 rounded-lg p-4 shadow-xl">
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              to={child.href}
                              className="block py-2 px-3 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={link.href}
                    className={`text-sm font-body font-medium uppercase tracking-wider transition-colors duration-200 relative ${
                      isActive(link.href)
                        ? "text-[#d7ff00]"
                        : "text-white/80 hover:text-[#d7ff00]"
                    }`}
                  >
                    {link.label}
                    {isActive(link.href) && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#d7ff00]" />
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-[#d7ff00] hover:text-[#d7ff00] transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <Link
              to="/quotation"
              className="bg-[#d7ff00] text-[#0d1f16] px-5 py-2.5 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors"
            >
              Get Quotation
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#0d1f16] pt-20 px-6 pb-8 overflow-y-auto lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <div key={link.href}>
                {link.children ? (
                  <div className="mb-2">
                    <Link
                      to={link.href}
                      className="block py-3 text-lg text-white font-body font-medium"
                    >
                      {link.label}
                    </Link>
                    <div className="pl-4 border-l border-white/10 ml-2">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="block py-2 text-sm text-white/60 hover:text-white"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={link.href}
                    className="block py-3 text-lg text-white font-body font-medium"
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/quotation"
              className="bg-[#d7ff00] text-[#0d1f16] px-5 py-3 rounded-md text-center font-body font-medium"
            >
              Get Quotation
            </Link>
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/30 text-white px-5 py-3 rounded-md text-center font-body font-medium flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
            <a
              href={`tel:${phoneDisplay.replace(/\s/g, "")}`}
              className="text-white/60 text-sm text-center flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {phoneDisplay}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
