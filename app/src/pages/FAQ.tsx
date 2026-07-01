import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import SEOHead from "../components/SEOHead";
import { useFaqs } from "../hooks/useFaqs";

interface FAQItem {
  q: string;
  a: string;
  category: string;
  borderColor: string;
}

const FALLBACK_FAQS: FAQItem[] = [
  { q: "Where is ASK Creative located?", a: "We are located at No A6-1, Ground Floor, Block A, Kepayan Perdana, 88200 Kota Kinabalu, Sabah, Malaysia.", category: "General Questions", borderColor: "border-l-forest-900" },
  { q: "How can I contact ASK Creative?", a: "You can reach us by phone at 088 205 423 or email sales@askcreativeprinting.com.", category: "General Questions", borderColor: "border-l-forest-900" },
  { q: "How do I request a quotation?", a: "Submit our online form at /quotation, WhatsApp our team, or email us.", category: "Ordering & Quotation", borderColor: "border-l-teal-500" },
];

const categoryColors: Record<string, string> = {
  "General Questions": "border-l-[#1B4332]",
  "Ordering & Quotation": "border-l-[#2A9D8F]",
  "Design & Artwork": "border-l-[#9CA33F]",
  "Production & Delivery": "border-l-[#d7ff00]",
};

function AccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border-l-[3px] ${categoryColors[item.category] || "border-l-forest-900"} pl-5`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-forest-900 text-base font-body font-medium">{item.q}</span>
        <ChevronDown
          className={`w-5 h-5 text-forest-900/50 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48 pb-4" : "max-h-0"}`}
      >
        <p className="text-forest-900/70 text-[15px] font-body leading-relaxed">{item.a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const { data: apiFaqs } = useFaqs();

  const faqs: FAQItem[] = useMemo(() => {
    if (apiFaqs && apiFaqs.length > 0) {
      return apiFaqs.map((f: any) => ({
        q: f.question,
        a: f.answer,
        category: f.category || "General Questions",
        borderColor: "border-l-forest-900",
      }));
    }
    return FALLBACK_FAQS;
  }, [apiFaqs]);

  const grouped = faqs.reduce<Record<string, FAQItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <>
      <SEOHead
        title="Frequently Asked Questions | ASK Creative Printing Sabah"
        description="Find answers to common questions about our printing services, ordering process and delivery in Kota Kinabalu, Sabah."
        keywords="FAQ, frequently asked questions, printing FAQ, custom printing questions, delivery Kota Kinabalu"
        canonical="/faq"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[640px] mx-auto">
            Find answers to common questions about our printing services, ordering process and delivery.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-5 md:px-10">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-10 last:mb-0">
              <h2 className="font-display text-xl text-forest-900 uppercase mb-4">{category}</h2>
              <div className="divide-y divide-forest-900/10">
                {items.map((item, i) => (
                  <AccordionItem key={i} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
