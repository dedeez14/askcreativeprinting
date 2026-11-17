import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Phone, MessageCircle, Search } from "lucide-react";
import { useSettings } from "../hooks/useSettings";
import { withBase } from "../lib/paths";

type NavChild = { label: string; href: string };
type NavItem = { label: string; href: string; children?: NavChild[] };

// Primary links stay in the bar; secondary pages are grouped under "More" so
// the navbar reads cleanly at every width instead of wrapping / colliding.
const serviceLinks: NavChild[] = [
  { label: "Sublimation Printing", href: "/services/sublimation-printing-sabah" },
  { label: "Custom Jersey", href: "/services/custom-jersey-printing-sabah" },
  { label: "Custom Apparel", href: "/services/custom-apparel-sabah" },
  { label: "T-Shirt Printing", href: "/services/t-shirt-printing-sabah" },
  { label: "Embroidery", href: "/services/embroidery-kota-kinabalu" },
  { label: "Digital Printing", href: "/services/digital-printing-kota-kinabalu" },
  { label: "Banner & Bunting", href: "/services/banner-bunting-printing-kota-kinabalu" },
  { label: "Premium Gifts", href: "/services/premium-gifts-sabah" },
];

const moreLinks: NavChild[] = [
  { label: "Track Order", href: "/track" },
  { label: "Clients", href: "/clients" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
];

const navLinks: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Services", href: "/services", children: serviceLinks },
  { label: "Products", href: "/products" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Contact", href: "/contact" },
  { label: "More", href: "#more", children: moreLinks },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null); // desktop dropdown
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { data: settings } = useSettings();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logoUrl = settings?.logo_url || withBase("/images/ask-logo-header.webp"); // 1 kB copy of ask-logo.png (2954 px, 216 kB)
  const waPhone = settings?.contact_phone?.replace(/\D/g, "") || "60102174774";
  const phoneDisplay = settings?.contact_phone || "088 205 423";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close everything on route change.
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setMobileExpanded(null);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Escape closes any open desktop dropdown / mobile drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href.startsWith("#")) return false;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const isChildActive = (children?: NavChild[]) =>
    !!children?.some((c) => isActive(c.href));

  // Hover open with a small close delay so the pointer can travel from the
  // trigger to the panel without the menu flickering shut.
  const hoverOpen = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-[rgba(11,26,18,0.98)] backdrop-blur-xl shadow-lg shadow-black/20 border-white/10"
            : "bg-[rgba(13,31,22,0.92)] backdrop-blur-md border-transparent"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 lg:h-[72px] gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="ASK Creative — Home">
            <img
              src={logoUrl}
              alt="ASK Creative Sdn Bhd"
              className="h-9 lg:h-10 w-auto"
              onError={(e) => {
                const fallback = `
                  <div class="flex items-center gap-1">
                    <span class="text-xl lg:text-2xl font-display font-bold text-white tracking-tight">ASK</span>
                    <span class="text-[10px] lg:text-xs font-body text-[#9CA33F] tracking-[0.2em] uppercase">Creative</span>
                  </div>
                `;
                (e.target as HTMLElement).style.display = "none";
                (e.target as HTMLElement).parentElement!.innerHTML = fallback;
              }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main" className="hidden lg:flex items-center gap-4 xl:gap-6 mx-auto">
            {navLinks.map((link) => {
              const active = link.children ? isChildActive(link.children) || isActive(link.href) : isActive(link.href);
              if (link.children) {
                const isOpen = openMenu === link.label;
                const isServices = link.label === "Services";
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => hoverOpen(link.label)}
                    onMouseLeave={hoverClose}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenMenu(isOpen ? null : link.label)}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      className={`flex items-center gap-1 whitespace-nowrap text-[13px] xl:text-sm font-body font-medium uppercase tracking-wider transition-colors duration-200 ${
                        active ? "text-[#d7ff00]" : "text-white/80 hover:text-[#d7ff00]"
                      }`}
                    >
                      {link.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown panel */}
                    <div
                      className={`absolute top-full ${isServices ? "left-1/2 -translate-x-1/2" : "left-0"} pt-3 transition-all duration-200 origin-top ${
                        isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div className="bg-[#0d1f16] border border-white/10 rounded-xl p-2.5 shadow-2xl shadow-black/40">
                        {isServices ? (
                          <>
                            <div className="grid grid-cols-2 gap-1 w-[440px]">
                              {link.children.map((child) => (
                                <Link
                                  key={child.href}
                                  to={child.href}
                                  className={`block py-2.5 px-3 text-sm rounded-lg transition-colors ${
                                    isActive(child.href)
                                      ? "text-[#d7ff00] bg-white/5"
                                      : "text-white/70 hover:text-white hover:bg-white/5"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                            <div className="mt-1.5 pt-1.5 border-t border-white/10">
                              <Link
                                to="/services"
                                className="flex items-center justify-between py-2.5 px-3 text-sm font-medium text-[#d7ff00] hover:bg-white/5 rounded-lg transition-colors"
                              >
                                View all services
                                <span aria-hidden>→</span>
                              </Link>
                            </div>
                          </>
                        ) : (
                          <div className="w-52">
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                to={child.href}
                                className={`block py-2.5 px-3 text-sm rounded-lg transition-colors ${
                                  isActive(child.href)
                                    ? "text-[#d7ff00] bg-white/5"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative whitespace-nowrap text-[13px] xl:text-sm font-body font-medium uppercase tracking-wider transition-colors duration-200 ${
                    active ? "text-[#d7ff00]" : "text-white/80 hover:text-[#d7ff00]"
                  }`}
                >
                  {link.label}
                  {active && <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#d7ff00] rounded-full" />}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-white/90 hover:border-[#d7ff00] hover:text-[#d7ff00] transition-colors"
              aria-label="WhatsApp"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <Link
              to="/quotation"
              className="whitespace-nowrap bg-[#d7ff00] text-[#0d1f16] px-4 xl:px-5 py-2.5 rounded-lg text-[13px] xl:text-sm font-body font-semibold hover:bg-[#e5ff4d] transition-colors shadow-sm shadow-[#d7ff00]/20"
            >
              Get Quotation
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-white p-2 -mr-2"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer — inert while closed, so it is out of the focus order and the accessibility tree. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!mobileOpen}
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        {/* panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[86%] max-w-sm bg-[#0d1f16] border-l border-white/10 pt-20 pb-8 px-6 overflow-y-auto transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {navLinks.map((link, i) => {
              const active = link.children ? isChildActive(link.children) || isActive(link.href) : isActive(link.href);
              const divider = i > 0 ? "border-t border-white/8" : "";
              if (link.children) {
                const expanded = mobileExpanded === link.label;
                return (
                  <div key={link.label} className={divider}>
                    <button
                      type="button"
                      onClick={() => setMobileExpanded(expanded ? null : link.label)}
                      aria-expanded={expanded}
                      className={`w-full flex items-center justify-between py-3.5 text-base font-body font-medium ${
                        active ? "text-[#d7ff00]" : "text-white"
                      }`}
                    >
                      {link.label}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-[520px]" : "max-h-0"}`}
                    >
                      <div className="pl-3 border-l border-white/10 ml-1 pb-2 flex flex-col">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            className={`block py-2.5 text-sm ${
                              isActive(child.href) ? "text-[#d7ff00]" : "text-white/65 hover:text-white"
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block py-3.5 text-base font-body font-medium ${divider} ${
                    active ? "text-[#d7ff00]" : "text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-7 flex flex-col gap-3">
            <Link
              to="/quotation"
              className="bg-[#d7ff00] text-[#0d1f16] px-5 py-3 rounded-lg text-center font-body font-semibold"
            >
              Get Quotation
            </Link>
            <Link
              to="/track"
              className="border border-white/20 text-white px-5 py-3 rounded-lg text-center font-body font-medium flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Track Order
            </Link>
            <a
              href={`https://wa.me/${waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/20 text-white px-5 py-3 rounded-lg text-center font-body font-medium flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
            <a
              href={`tel:${phoneDisplay.replace(/\s/g, "")}`}
              className="text-white/60 text-sm text-center flex items-center justify-center gap-2 pt-1"
            >
              <Phone className="w-4 h-4" />
              {phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
