import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'HOME', href: '#hero' },
  { label: 'ABOUT', href: '#about' },
  { label: 'SERVICES', href: '#services' },
  { label: 'DESIGN STUDIO', href: '#studio' },
  { label: 'CONTACT', href: '#contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#062d2e]/90 backdrop-blur-md border-b border-white/15'
          : 'bg-transparent'
      }`}
      style={{ height: 80 }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => scrollTo('#hero')} className="flex items-center gap-2">
          <span className="font-display font-bold text-2xl tracking-tight text-white">
            ASK
          </span>
          <span className="font-display font-medium text-sm tracking-[0.2em] text-brand-gold-500 uppercase">
            Creative
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="font-mono text-xs tracking-[1.5px] text-white/75 hover:text-brand-gold-400 transition-colors duration-300"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* CTA Button */}
        <button
          onClick={() => scrollTo('#studio')}
          className="hidden lg:block bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-mono text-xs tracking-[1.5px] px-6 py-3 rounded-pill transition-colors duration-300"
        >
          GET A QUOTE
        </button>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#062d2e]/95 backdrop-blur-md border-t border-white/15">
          <nav className="flex flex-col px-6 py-6 gap-4">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="font-mono text-sm tracking-[1.5px] text-white/75 hover:text-brand-gold-400 transition-colors text-left py-2"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('#studio')}
              className="bg-brand-teal-600 hover:bg-brand-teal-500 text-white font-mono text-xs tracking-[1.5px] px-6 py-3 rounded-pill transition-colors mt-2 w-fit"
            >
              GET A QUOTE
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
