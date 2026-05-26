import HeroCanvas from './HeroCanvas';
import { ChevronDown } from 'lucide-react';
import { useHeroes } from '@/hooks/useHeroes';
import { useSettings } from '@/hooks/useSettings';

const FALLBACK = {
  label: 'Premium Printing & Branding Solutions',
  title: 'Engineered Elegance.\nBuilt for Impact.',
  subtitle: 'Premium sublimation, embroidery, and custom branding solutions crafted in the heart of Kota Kinabalu.',
  ctaText: 'GET A QUOTE',
};

export default function Hero() {
  const { data: heroes } = useHeroes();
  const { data: settings } = useSettings();

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const primary = heroes && heroes.length > 0
    ? [...heroes].sort((a, b) => a.sort_order - b.sort_order)[0]
    : null;

  const label = settings?.site_tagline || FALLBACK.label;
  const title = primary?.title || FALLBACK.title;
  const subtitle = primary?.subtitle || settings?.site_description || FALLBACK.subtitle;
  const ctaText = primary?.cta_text || settings?.cta?.button_text || FALLBACK.ctaText;
  const ctaUrl = primary?.cta_url || settings?.cta?.button_url || '#studio';

  const handleCta = () => {
    if (ctaUrl.startsWith('#')) {
      scrollTo(ctaUrl);
    } else {
      window.open(ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100vh', minHeight: 600, background: '#062d2e' }}
    >
      <HeroCanvas />

      <div className="relative z-10 flex flex-col justify-center h-full max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="max-w-xl">
          <p className="font-mono text-xs tracking-[2px] text-brand-gold-500 uppercase mb-6">
            {label}
          </p>

          <h1
            className="font-display font-semibold text-white leading-[0.95] tracking-[-1.5px] mb-6 whitespace-pre-line"
            style={{ fontSize: 'clamp(40px, 5.5vw, 72px)' }}
          >
            {title}
          </h1>

          <p className="font-body text-base leading-relaxed text-white/75 mb-10 max-w-md">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => scrollTo('#services')}
              className="border border-white/40 text-white font-mono text-xs tracking-[1.5px] px-8 py-4 rounded-pill hover:bg-white hover:text-[#062d2e] transition-all duration-300"
            >
              EXPLORE SERVICES
            </button>
            <button
              onClick={handleCta}
              className="bg-white text-[#062d2e] font-mono text-xs tracking-[1.5px] px-8 py-4 rounded-pill hover:bg-brand-gold-400 transition-all duration-300"
            >
              {ctaText}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={() => scrollTo('#about')}
          className="text-brand-gold-500 animate-pulse"
          aria-label="Scroll down"
        >
          <ChevronDown size={28} />
        </button>
      </div>
    </section>
  );
}
