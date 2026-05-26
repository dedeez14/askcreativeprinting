import { useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';

const FALLBACK_STATS = [
  { value: '10+', label: 'Years Experience' },
  { value: '500+', label: 'Clients Served' },
  { value: '50K+', label: 'Items Printed' },
  { value: '6', label: 'Core Services' },
];

const FALLBACK_VISI = '"To become global industry player in Sublimation Jersey Printing"';
const FALLBACK_MISI = '"To provide opportunities to people with heart for success"';

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useSettings();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.2 }
    );

    if (contentRef.current) {
      const children = contentRef.current.querySelectorAll('.fade-up');
      children.forEach((child) => observer.observe(child));
    }

    return () => observer.disconnect();
  }, [settings]);

  const scrollText =
    'A LEADER IN SUBLIMATION JERSEY PRINTING IN SABAH WITH PROFITABLE GROWTH  •  ';

  const stats = settings?.hero_stats && settings.hero_stats.length > 0
    ? settings.hero_stats
    : FALLBACK_STATS;

  const visiTitle = settings?.visi_misi?.visi_title || 'Our Vision';
  const visiContent = settings?.visi_misi?.visi_content || FALLBACK_VISI;
  const visiShow = settings?.visi_misi?.visi_is_show ?? true;

  const misiTitle = settings?.visi_misi?.misi_title || 'Our Mission';
  const misiItems = settings?.visi_misi?.misi_items && settings.visi_misi.misi_items.length > 0
    ? settings.visi_misi.misi_items
    : [FALLBACK_MISI];
  const misiShow = settings?.visi_misi?.misi_is_show ?? true;

  const description = settings?.site_description ||
    'ASK Creative is an innovative group of company which offers and emphasize on wide range of quality products and services, mainly in Sublimation Jersey Printing. We pride ourselves on being a revolutionary industry player in the market of Sabah.';

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative w-full"
      style={{ background: '#f4f6f7', paddingTop: 160, paddingBottom: 120 }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <p className="font-mono text-xs tracking-[2px] text-brand-teal-600 uppercase mb-4">
          WHO WE ARE
        </p>
        <h2
          className="font-display font-medium text-brand-teal-800 mb-16"
          style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', lineHeight: 1.1 }}
        >
          About {settings?.site_name || 'ASK Creative'}
        </h2>
      </div>

      <div className="infinite-text-wrapper mb-16" style={{ maxWidth: '100vw' }}>
        <div>{scrollText}</div>
        <div>{scrollText}</div>
      </div>

      <div ref={contentRef} className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          <div className="fade-up opacity-0 translate-y-5 transition-all duration-700">
            <p className="font-body text-base leading-relaxed text-[#1a1a1a]/80 mb-6">
              {description}
            </p>
            <p className="font-body text-base leading-relaxed text-[#1a1a1a]/80">
              ASK Creative is defined by the quality of our products and services. We
              are committed to ensure that the outcome meets and exceed the highest
              industry standards. Our state-of-the-art facility in Kepayan Perdana
              houses the latest printing technology to deliver exceptional results.
            </p>
          </div>

          <div className="fade-up opacity-0 translate-y-5 transition-all duration-700 delay-200">
            {visiShow && (
              <div className="mb-10 p-8 border border-brand-teal-800/15">
                <p className="font-mono text-xs tracking-[2px] text-brand-gold-500 uppercase mb-3">
                  {visiTitle}
                </p>
                <p
                  className="font-display font-medium text-brand-teal-800"
                  style={{ fontSize: 'clamp(20px, 2vw, 28px)', lineHeight: 1.3 }}
                >
                  {visiContent}
                </p>
              </div>
            )}

            {misiShow && (
              <div className="p-8 border border-brand-teal-800/15">
                <p className="font-mono text-xs tracking-[2px] text-brand-gold-500 uppercase mb-3">
                  {misiTitle}
                </p>
                {misiItems.length === 1 ? (
                  <p
                    className="font-display font-medium text-brand-teal-800"
                    style={{ fontSize: 'clamp(20px, 2vw, 28px)', lineHeight: 1.3 }}
                  >
                    {misiItems[0]}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {misiItems.map((item, i) => (
                      <li
                        key={i}
                        className="font-display font-medium text-brand-teal-800 flex gap-3"
                        style={{ fontSize: 'clamp(16px, 1.4vw, 20px)', lineHeight: 1.4 }}
                      >
                        <span className="text-brand-gold-500">&bull;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20 pt-12 border-t border-brand-teal-800/15">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="fade-up opacity-0 translate-y-5 transition-all duration-700"
              >
                <p
                  className="font-display font-semibold text-brand-teal-800"
                  style={{ fontSize: 'clamp(28px, 3vw, 42px)', lineHeight: 1 }}
                >
                  {stat.value}
                </p>
                <p className="font-mono text-xs tracking-[1px] text-[#1a1a1a]/60 uppercase mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
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
