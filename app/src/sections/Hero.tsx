import HeroCanvas from './HeroCanvas';
import { ChevronDown } from 'lucide-react';

export default function Hero() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100vh', minHeight: 600, background: '#062d2e' }}
    >
      {/* WebGL Canvas Background */}
      <HeroCanvas />

      {/* Content Panel */}
      <div className="relative z-10 flex flex-col justify-center h-full max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="max-w-xl">
          {/* H3 Label */}
          <p className="font-mono text-xs tracking-[2px] text-brand-gold-500 uppercase mb-6">
            Premium Printing & Branding Solutions
          </p>

          {/* H1 */}
          <h1
            className="font-display font-semibold text-white leading-[0.95] tracking-[-1.5px] mb-6"
            style={{ fontSize: 'clamp(40px, 5.5vw, 72px)' }}
          >
            Engineered Elegance.
            <br />
            Built for Impact.
          </h1>

          {/* Subtitle */}
          <p className="font-body text-base leading-relaxed text-white/75 mb-10 max-w-md">
            Premium sublimation, embroidery, and custom branding solutions crafted
            in the heart of Kota Kinabalu.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => scrollTo('#services')}
              className="border border-white/40 text-white font-mono text-xs tracking-[1.5px] px-8 py-4 rounded-pill hover:bg-white hover:text-[#062d2e] transition-all duration-300"
            >
              EXPLORE SERVICES
            </button>
            <button
              onClick={() => scrollTo('#studio')}
              className="bg-white text-[#062d2e] font-mono text-xs tracking-[1.5px] px-8 py-4 rounded-pill hover:bg-brand-gold-400 transition-all duration-300"
            >
              GET A QUOTE
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Chevron */}
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
