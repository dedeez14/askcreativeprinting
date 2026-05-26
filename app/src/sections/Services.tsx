import { useEffect, useRef } from 'react';
import { useFeatures } from '@/hooks/useFeatures';
import { SkeletonSection } from '@/components/SkeletonSection';
import { SectionErrorFallback } from '@/components/SectionErrorFallback';

const FALLBACK_SERVICES = [
  {
    title: 'SUBLIMATION PRINTING',
    description: 'Jersey, Pants, Lanyard, Flag, Apron, Table Cloth, Towel, Pennant — Full-color, all-over dye sublimation for vibrant, lasting prints.',
  },
  {
    title: 'T-SHIRT PRINTING',
    description: 'Silk Screen Printing, Heatpress, and Virus Print — Multiple techniques for every fabric type and order size.',
  },
  {
    title: 'PREMIUM GIFTS',
    description: 'Mug, Medal, Bags, Umbrella, Hand Fan, Plaque — Curated corporate gifts that leave a lasting impression.',
  },
  {
    title: 'EMBROIDERY',
    description: 'T-Shirt, Corporate Shirt, Jacket, Cap, Patches — Precision stitching for a premium, textured finish.',
  },
  {
    title: 'LARGE FORMAT PRINTING',
    description: 'Banner, Bunting, Backdrop, Roll-up Bunting, Sticker, Digital Print — Eye-catching displays for any event.',
  },
  {
    title: 'CUSTOM PRODUCTS',
    description: 'Corporate Shirt, Keychain, Luggage Tag, Wristband, ID Card — Fully customizable products for your brand.',
  },
];

const SHOWCASE = [
  { img: '/images/prod-sublimation.jpg', label: 'Sublimation Jerseys' },
  { img: '/images/prod-screen.jpg', label: 'Screen Printed Tees' },
  { img: '/images/prod-embroidery.jpg', label: 'Embroidery Work' },
];

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data, isPending, error, refetch } = useFeatures();

  const services = data && data.length > 0
    ? [...data].sort((a, b) => a.sort_order - b.sort_order).map((s, i) => ({
        num: String(i + 1).padStart(2, '0'),
        title: s.title,
        desc: s.description ?? '',
      }))
    : FALLBACK_SERVICES.map((s, i) => ({
        num: String(i + 1).padStart(2, '0'),
        title: s.title,
        desc: s.description,
      }));

  useEffect(() => {
    if (isPending) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll('.service-card');
      cards.forEach((card, i) => {
        (card as HTMLElement).style.transitionDelay = `${i * 100}ms`;
        observer.observe(card);
      });
    }

    return () => observer.disconnect();
  }, [isPending, services.length]);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative w-full"
      style={{ background: '#062d2e', paddingTop: 120, paddingBottom: 120 }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <p className="font-mono text-xs tracking-[2px] text-brand-gold-500 uppercase mb-4">
            WHAT WE DO
          </p>
          <h2
            className="font-display font-medium text-white"
            style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', lineHeight: 1.1 }}
          >
            Our Services
          </h2>
        </div>

        {isPending ? (
          <SkeletonSection variant="cards" />
        ) : error && (!data || data.length === 0) ? (
          <SectionErrorFallback retry={() => refetch()} message="Tidak bisa memuat layanan." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.num}
                className="service-card opacity-0 translate-y-5 transition-all duration-700 group p-8 border border-white/15 hover:bg-brand-teal-800 hover:border-brand-gold-500/30 cursor-default"
              >
                <span className="font-display font-semibold text-brand-gold-500 text-3xl mb-4 block">
                  {service.num}
                </span>
                <h3 className="font-display font-medium text-white text-xl mb-3 tracking-tight">
                  {service.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-white/60 group-hover:text-white/80 transition-colors">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SHOWCASE.map((item) => (
            <div key={item.label} className="group relative overflow-hidden aspect-video">
              <img
                src={item.img}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#062d2e]/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="font-mono text-xs tracking-[1.5px] text-brand-gold-500 uppercase">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </section>
  );
}
