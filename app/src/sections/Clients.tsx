import { useEffect, useRef } from 'react';
import { useBrands } from '@/hooks/useBrands';
import type { LandingBrand } from '@/types/landing';

interface ClientDisplay {
  name: string;
  abbr: string;
  logo_url: string | null;
}

const FALLBACK_CLIENTS: ClientDisplay[] = [
  { name: 'PETRA', abbr: 'PE', logo_url: null },
  { name: 'JKR SABAH', abbr: 'JK', logo_url: null },
  { name: 'SEDCO', abbr: 'SE', logo_url: null },
  { name: 'SABAH FC', abbr: 'SF', logo_url: null },
  { name: 'UMS', abbr: 'UM', logo_url: null },
  { name: 'Etiqa', abbr: 'ET', logo_url: null },
  { name: 'FGV', abbr: 'FG', logo_url: null },
  { name: 'SME BANK', abbr: 'SM', logo_url: null },
  { name: 'POLITEKNIK', abbr: 'PO', logo_url: null },
  { name: 'BANK RAKYAT', abbr: 'BR', logo_url: null },
  { name: 'SAZA RICE', abbr: 'SR', logo_url: null },
  { name: 'NEXUS GOLF', abbr: 'NG', logo_url: null },
];

function makeAbbr(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function brandsToDisplay(brands: LandingBrand[]): ClientDisplay[] {
  return [...brands]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((b) => ({ name: b.name, abbr: makeAbbr(b.name), logo_url: b.logo_url }));
}

function ClientLogo({ client }: { client: ClientDisplay }) {
  return (
    <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center mx-8 group cursor-default">
      <div className="flex items-center gap-2 opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300">
        {client.logo_url ? (
          <img
            src={client.logo_url}
            alt={client.name}
            className="h-10 w-auto max-w-[80px] object-contain"
          />
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:border-brand-gold-500/50 group-hover:bg-brand-gold-500/10 transition-all">
              <span className="font-display font-semibold text-xs text-white group-hover:text-brand-gold-400 transition-colors">
                {client.abbr}
              </span>
            </div>
            <span className="font-mono text-xs tracking-[1px] text-white/70 group-hover:text-white transition-colors whitespace-nowrap">
              {client.name}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function Clients() {
  const sectionRef = useRef<HTMLElement>(null);
  const { data } = useBrands();

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

  const clients = data && data.length > 0 ? brandsToDisplay(data) : FALLBACK_CLIENTS;

  if (clients.length === 0) return null;

  const doubledClients = [...clients, ...clients];

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
