import { withBase } from "../lib/paths";
export interface Service {
  slug: string;
  title: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  longDescription: string;
  features: string[];
  image: string;
  icon: string;
  products?: string[];
}

/**
 * OFFLINE FALLBACK ONLY (06 §11 p.4 / §9 p.4).
 *
 * The live service / SEO pages are maintained by the client in the ERP CMS and read from
 * GET /api/landing/v1/pages (src/hooks/usePages.ts). This array is what the site shows when that
 * endpoint is unreachable, so it mirrors the eight keyword pages the brief names — including
 * "Custom Sportswear Malaysia" and "Jersey Printing for School and Company Events" — plus the two
 * extra pages the site has always published. Published slugs resolve through the ERP's own aliases.
 */
export const services: Service[] = [
  {
    slug: "sublimation-printing-sabah",
    title: "Sublimation Printing in Sabah",
    shortTitle: "Sublimation Printing",
    metaTitle: "Sublimation Printing Sabah | Custom Jersey & Fabric Printing",
    metaDescription: "Get sublimation printing in Sabah for custom jerseys, pants, lanyards, flags, aprons, table cloths, towels and event merchandise. Design online and request a quotation from ASK Creative.",
    description: "Full sublimation printing for jerseys, pants, lanyards, flags, aprons, table cloths, towels and pennants. Suitable for sports teams, events, corporate branding and custom fabric-based products.",
    longDescription: "ASK Creative provides sublimation printing for custom jerseys, teamwear, event products and fabric-based merchandise. Sublimation is suitable for vibrant full-colour designs, sports apparel, team uniforms and custom promotional items. Our large-format sublimation printers produce stunning, durable prints that won't crack, peel or fade over time.",
    features: [
      "Full-colour, all-over printing",
      "Minimum order 8 pcs for sublimation",
      "Quick turnaround time",
      "Durable, wash-resistant prints",
      "Design support available"
    ],
    image: withBase("/images/real-printer-jersey.jpg"),
    icon: "Printer",
    products: ["Jerseys", "Pants", "Lanyards", "Flags", "Aprons", "Table Cloths", "Towels", "Pennants"]
  },
  {
    slug: "custom-jersey-printing-sabah",
    title: "Custom Jersey Printing in Sabah",
    shortTitle: "Custom Jersey Printing",
    metaTitle: "Custom Jersey Printing Sabah | Football, Running & Team Jerseys",
    metaDescription: "Design and order custom jerseys in Sabah for football teams, running events, schools, clubs and corporate sports days. Add names, numbers, logos and sponsor designs.",
    description: "Custom jersey printing for football teams, running events, school teams, corporate sports days and clubs. Add your logo, player names, numbers, sponsor logos and team colours.",
    longDescription: "Create custom jerseys for your team, school, company or event with ASK Creative. Choose your jersey type, collar style, colours, logo placement, player names, numbers and size breakdown, then submit your design for quotation. We specialize in sublimation jerseys that offer unlimited colour options and all-over printing.",
    features: [
      "Football, basketball, running jerseys",
      "Full sublimation or heat press",
      "Name, number & sponsor printing",
      "Multiple collar styles",
      "Size breakdown support"
    ],
    image: withBase("/images/real-jersey-design.jpg"),
    icon: "Shirt",
    products: ["Football Jersey", "Running Singlet", "Basketball Jersey", "Baseball Jersey", "Corporate Sports Jersey", "Event Jersey", "Teamwear Set", "Jersey with Pants"]
  },
  {
    slug: "custom-apparel-sabah",
    title: "Custom Apparel in Sabah",
    shortTitle: "Custom Apparel",
    metaTitle: "Custom Apparel Sabah | Corporate Shirts, Jackets, Hoodies & Uniforms",
    metaDescription: "Order custom apparel in Sabah including corporate shirts, polo shirts, jackets, hoodies, windbreakers, uniforms and teamwear from ASK Creative.",
    description: "Custom apparel solutions for corporate shirts, polo shirts, jackets, hoodies, windbreakers, uniforms, teamwear and event apparel.",
    longDescription: "ASK Creative produces custom apparel for companies, teams, events and organizations. From corporate shirts and polo shirts to hoodies, jackets, windbreakers and uniforms, we help customers create apparel that matches their brand and purpose. Our in-house production ensures quality control and competitive pricing.",
    features: [
      "Corporate shirts & polo shirts",
      "Jackets & hoodies",
      "Uniform programs",
      "Teamwear & event apparel",
      "Embroidery & printing options"
    ],
    image: withBase("/images/real-sewing.jpg"),
    icon: "Vest",
    products: ["Corporate Shirt", "Polo Shirt", "Jacket", "Hoodie", "Windbreaker", "Uniform", "Teamwear"]
  },
  {
    slug: "t-shirt-printing-sabah",
    title: "T-Shirt Printing in Sabah",
    shortTitle: "T-Shirt Printing",
    metaTitle: "T-Shirt Printing Sabah | Custom T-Shirt Printing Kota Kinabalu",
    metaDescription: "Custom T-shirt printing in Sabah for events, uniforms, campaigns, corporate wear and promotional apparel. Request a quotation from ASK Creative in Kota Kinabalu.",
    description: "T-shirt printing for events, uniforms, campaigns, corporate wear and promotional apparel using suitable printing methods such as silkscreen, heat press and vinyl printing.",
    longDescription: "We provide T-shirt printing for events, uniforms, campaigns, corporate wear and promotional apparel. Depending on your design and quantity, we use the most suitable printing method — silkscreen for bulk orders, heat press for full-colour designs, and vinyl for names and numbers.",
    features: [
      "Silkscreen, heat press & vinyl",
      "Bulk order discounts",
      "Multiple colour options",
      "Various T-shirt brands",
      "Quick delivery available"
    ],
    image: withBase("/images/real-screen-print.jpg"),
    icon: "Scissors"
  },
  {
    slug: "embroidery-kota-kinabalu",
    title: "Embroidery Service in Kota Kinabalu",
    shortTitle: "Embroidery",
    metaTitle: "Embroidery Kota Kinabalu | Logo Embroidery for Uniforms & Caps",
    metaDescription: "Professional embroidery service in Kota Kinabalu for company logos, uniforms, corporate shirts, jackets, caps and patches.",
    description: "Professional embroidery for company logos, uniforms, caps, jackets, corporate shirts, patches and branded apparel.",
    longDescription: "Our professional embroidery service uses multi-head machines to produce high-quality stitched logos and designs on uniforms, caps, polo shirts, jackets and more. Embroidery offers a premium, long-lasting finish that is perfect for corporate apparel and uniforms.",
    features: [
      "Multi-head embroidery machines",
      "Logo digitization service",
      "Caps, shirts, jackets & patches",
      "Metallic thread options",
      "Durable, professional finish"
    ],
    image: withBase("/images/real-embroidery.jpg"),
    icon: "PenTool"
  },
  {
    slug: "digital-printing-kota-kinabalu",
    title: "Digital Printing in Kota Kinabalu",
    shortTitle: "Digital Printing",
    metaTitle: "Digital Printing Kota Kinabalu | Stickers, Backdrops & Display Prints",
    metaDescription: "Digital printing in Kota Kinabalu for stickers, backdrops, event displays, retail promotions and corporate branding materials.",
    description: "Digital printing for banners, buntings, backdrops, roll-up buntings, stickers and promotional materials for events, retail, campaigns and corporate branding.",
    longDescription: "Our digital printing services cover banners, buntings, backdrops, roll-up stands, stickers and all types of promotional materials. Using high-resolution large-format printers, we produce sharp, vibrant prints suitable for both indoor and outdoor use.",
    features: [
      "Large-format digital printing",
      "Indoor & outdoor materials",
      "High-resolution output",
      "Quick turnaround",
      "Design support available"
    ],
    image: withBase("/images/real-digital-print.jpg"),
    icon: "Image"
  },
  {
    slug: "banner-bunting-printing-kota-kinabalu",
    title: "Banner & Bunting Printing in Kota Kinabalu",
    shortTitle: "Banner & Bunting Printing",
    metaTitle: "Banner & Bunting Printing Kota Kinabalu | Event & Promotion Printing",
    metaDescription: "Banner, bunting, backdrop and roll-up bunting printing in Kota Kinabalu for events, promotions, campaigns and business branding.",
    description: "Banner, bunting, backdrop and roll-up bunting printing in Kota Kinabalu for events, promotions, campaigns and business branding.",
    longDescription: "We specialize in banner and bunting printing for events, promotions, campaigns and business branding. Our products include pull-up banners, backdrops, buntings, standees, and outdoor banners — all printed with weather-resistant inks on durable materials.",
    features: [
      "Pull-up & roll-up banners",
      "Event backdrops",
      "Triangle buntings",
      "Weather-resistant printing",
      "Standee displays"
    ],
    image: withBase("/images/real-digital-print.jpg"),
    icon: "Flag"
  },
  {
    slug: "premium-gifts-sabah",
    title: "Premium Gifts & Corporate Merchandise in Sabah",
    shortTitle: "Premium Gifts",
    metaTitle: "Premium Gifts Sabah | Corporate Gifts & Custom Merchandise",
    metaDescription: "Customize premium gifts and corporate merchandise in Sabah including mugs, medals, bags, umbrellas, plaques, keychains, wristbands and ID cards.",
    description: "Customized corporate gifts and event merchandise including mugs, medals, bags, umbrellas, hand fans, plaques, keychains, luggage tags, wristbands and ID cards.",
    longDescription: "ASK Creative offers a wide range of premium corporate gifts and event merchandise that can be customized with your company logo or event branding. From practical items like mugs, umbrellas and bags to commemorative pieces like medals, plaques and trophies.",
    features: [
      "Mugs, bottles & drinkware",
      "Umbrellas & bags",
      "Medals, plaques & trophies",
      "Keychains & lanyards",
      "Wristbands & ID cards"
    ],
    image: withBase("/images/real-mugs.jpg"),
    icon: "Gift"
  },
  {
    slug: "custom-sportswear-malaysia",
    title: "Custom Sportswear Malaysia",
    shortTitle: "Custom Sportswear",
    metaTitle: "Custom Sportswear Malaysia | Team Kits Made in Sabah",
    metaDescription: "Custom sportswear made in Malaysia: jerseys, singlets, tracksets, shorts and full team kits with your names, numbers and sponsor logos. Nationwide delivery from Sabah.",
    description: "Full team kits made in Malaysia — jersey, shorts, singlet or trackset, with names, numbers and sponsor logos, delivered nationwide.",
    longDescription: "ASK Creative manufactures custom sportswear in Malaysia from our own factory in Kota Kinabalu, Sabah, and delivers nationwide. One order can cover the whole kit: jersey, shorts, singlet, trackset and bag tags.",
    features: [
      "Jerseys, singlets, shorts, tracksets",
      "Sublimation printing — sponsor logos cost no extra",
      "Names, numbers and per-player size list",
      "Kids and adult measurement charts",
      "Nationwide delivery from Sabah"
    ],
    image: withBase("/images/real-jersey-design.jpg"),
    icon: "Shirt",
    products: ["Jersey", "Singlet", "Shorts", "Trackset", "Warm-Up", "Team Kit"]
  },
  {
    slug: "jersey-printing-school-company-events",
    title: "Jersey Printing for School and Company Events",
    shortTitle: "Event Jersey Printing",
    metaTitle: "Jersey Printing for School & Company Events | ASK Creative Sabah",
    metaDescription: "Jersey printing for school sports days, company family days, annual dinners, tournaments and corporate events in Sabah. Bulk sizes, class or department names, fast approval.",
    description: "Event jerseys for school sports days, company family days, tournaments and annual dinners — bulk sizes, class or department names, one approval for the whole order.",
    longDescription: "School sports days, company family days, tournaments and annual dinners run on a deadline, so the order is built around your event date. Submit one size list for every class, house or department and we handle the rest.",
    features: [
      "One order for many teams, each in its own colour",
      "Class, house or department names per group",
      "Bulk size breakdown, kids sizes included",
      "A single mockup approval for the whole order",
      "Delivery planned against your event date"
    ],
    image: withBase("/images/real-jersey-showroom.jpg"),
    icon: "Users",
    products: ["Sports Day Jersey", "Family Day Jersey", "Tournament Jersey", "Event T-Shirt", "Class Jersey"]
  }
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getRelatedServices(currentSlug: string): Service[] {
  return services.filter((s) => s.slug !== currentSlug).slice(0, 3);
}
