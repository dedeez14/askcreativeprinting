import { useEffect, useRef } from 'react';

const CLIENTS = [
  { name: 'PETRA', abbr: 'PE' },
  { name: 'JKR SABAH', abbr: 'JK' },
  { name: 'SEDCO', abbr: 'SE' },
  { name: 'SABAH FC', abbr: 'SF' },
  { name: 'UMS', abbr: 'UM' },
  { name: 'Etiqa', abbr: 'ET' },
  { name: 'FGV', abbr: 'FG' },
  { name: 'SME BANK', abbr: 'SM' },
  { name: 'POLITEKNIK', abbr: 'PO' },
  { name: 'BANK RAKYAT', abbr: 'BR' },
  { name: 'SAZA RICE', abbr: 'SR' },
  { name: 'NEXUS GOLF', abbr: 'NG' },
];

function ClientLogo({ client }: { client: typeof CLIENTS[0] }) {
  return (
    <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center mx-8 group cursor-default">
      <div className="flex items-center gap-2 opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:border-brand-gold-500/50 group-hover:bg-brand-gold-500/10 transition-all">
          <span className="font-display font-semibold text-xs text-white group-hover:text-brand-gold-400 transition-colors">
            {client.abbr}
          </span>
        </div>
        <span className="font-mono text-xs tracking-[1px] text-white/70 group-hover:text-white transition-colors whitespace-nowrap">
          {client.name}
        </span>
      </div>
    </div>
  );
}

export default function Clients() {
  const sectionRef = useRef<HTMLElement>(null);

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
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const doubledClients = [...CLIENTS, ...CLIENTS];

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden opacity-0 translate-y-5 transition-all duration-700"
      style={{ background: '#062d2e', paddingTop: 100, paddingBottom: 100 }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mb-12">
        <p className="font-mono text-xs tracking-[2px] text-brand-gold-500 uppercase mb-4">
          TRUSTED BY
        </p>
        <h2
          className="font-display font-medium text-white"
          style={{ fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.1 }}
        >
          Our Clients
        </h2>
      </div>

      {/* Marquee */}
      <div className="relative flex overflow-hidden">
        <div className="flex animate-marquee">
          {doubledClients.map((client, i) => (
            <ClientLogo key={`${client.name}-${i}`} client={client} />
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
