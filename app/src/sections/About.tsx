import { useEffect, useRef } from 'react';

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const scrollText =
    'A LEADER IN SUBLIMATION JERSEY PRINTING IN SABAH WITH PROFITABLE GROWTH \u00A0\u2022\u00A0 ';

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative w-full"
      style={{ background: '#f4f6f7', paddingTop: 160, paddingBottom: 120 }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Label */}
        <p className="font-mono text-xs tracking-[2px] text-brand-teal-600 uppercase mb-4">
          WHO WE ARE
        </p>
        <h2
          className="font-display font-medium text-brand-teal-800 mb-16"
          style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', lineHeight: 1.1 }}
        >
          About ASK Creative
        </h2>
      </div>

      {/* Infinite Scroll Text */}
      <div className="infinite-text-wrapper mb-16" style={{ maxWidth: '100vw' }}>
        <div>{scrollText}</div>
        <div>{scrollText}</div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          <div className="fade-up opacity-0 translate-y-5 transition-all duration-700">
            <p className="font-body text-base leading-relaxed text-[#1a1a1a]/80 mb-6">
              ASK Creative is an innovative group of company which offers and emphasize
              on wide range of quality products and services, mainly in Sublimation
              Jersey Printing. We pride ourselves on being a revolutionary industry
              player in the market of Sabah. Always striving for greater height and
              achievements that allow us to stand above the competition.
            </p>
            <p className="font-body text-base leading-relaxed text-[#1a1a1a]/80">
              ASK Creative is defined by the quality of our products and services. We
              are committed to ensure that the outcome meets and exceed the highest
              industry standards. Our state-of-the-art facility in Kepayan Perdana
              houses the latest printing technology to deliver exceptional results.
            </p>
          </div>

          <div className="fade-up opacity-0 translate-y-5 transition-all duration-700 delay-200">
            {/* Vision */}
            <div className="mb-10 p-8 border border-brand-teal-800/15">
              <p className="font-mono text-xs tracking-[2px] text-brand-gold-500 uppercase mb-3">
                Our Vision
              </p>
              <p
                className="font-display font-medium text-brand-teal-800"
                style={{ fontSize: 'clamp(20px, 2vw, 28px)', lineHeight: 1.3 }}
              >
                "To become global industry player in Sublimation Jersey Printing"
              </p>
            </div>

            {/* Mission */}
            <div className="p-8 border border-brand-teal-800/15">
              <p className="font-mono text-xs tracking-[2px] text-brand-gold-500 uppercase mb-3">
                Our Mission
              </p>
              <p
                className="font-display font-medium text-brand-teal-800"
                style={{ fontSize: 'clamp(20px, 2vw, 28px)', lineHeight: 1.3 }}
              >
                "To provide opportunities to people with heart for success"
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20 pt-12 border-t border-brand-teal-800/15">
          {[
            { value: '10+', label: 'Years Experience' },
            { value: '500+', label: 'Clients Served' },
            { value: '50K+', label: 'Items Printed' },
            { value: '6', label: 'Core Services' },
          ].map((stat) => (
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
