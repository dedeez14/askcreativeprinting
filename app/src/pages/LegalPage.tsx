import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import LegalMarkdown from "../components/LegalMarkdown";
import { useLegalPage } from "../hooks/useLegalPage";
import { useSettings } from "../hooks/useSettings";
import { LEGAL_DEFAULT_UPDATED_AT, LEGAL_PAGES, fillLegalTokens, formatLegalDate, type LegalKey } from "../lib/legal";

/**
 * /privacy-policy, /terms-of-service, /data-deletion — the three URLs Meta requires for the WhatsApp Business app.
 * Text from the ERP (Admin → Landing → Settings → Legal pages); the built-in default when the ERP does not serve it.
 */
export default function LegalPage({ pageKey }: { pageKey: LegalKey }) {
  const meta = LEGAL_PAGES[pageKey];
  const { data: page } = useLegalPage(pageKey);
  const { data: settings } = useSettings();

  const content = page?.content?.trim() ? page.content : fillLegalTokens(meta.defaultContent, settings);
  const updatedAt = page?.updated_at || LEGAL_DEFAULT_UPDATED_AT;
  const others = Object.values(LEGAL_PAGES).filter((p) => p.key !== pageKey);

  return (
    <>
      <SEOHead title={meta.seoTitle} description={meta.description} canonical={meta.path} />

      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-14 md:pb-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            {meta.title}
          </h1>
          <p className="text-white/50 text-sm md:text-base font-body">
            Last updated: {formatLegalDate(updatedAt)}
          </p>
        </div>
      </section>

      <section className="bg-white py-14 md:py-20">
        <article className="max-w-[800px] mx-auto px-5 md:px-10">
          <LegalMarkdown source={content} />

          <nav aria-label="Legal pages" className="mt-12 pt-6 border-t border-forest-900/10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-body">
            {others.map((p) => (
              <Link key={p.key} to={p.path} className="text-forest-900/60 hover:text-forest-900 underline underline-offset-2">
                {p.title}
              </Link>
            ))}
            <Link to="/contact" className="text-forest-900/60 hover:text-forest-900 underline underline-offset-2">
              Contact Us
            </Link>
          </nav>
        </article>
      </section>
    </>
  );
}
