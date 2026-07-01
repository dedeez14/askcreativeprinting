import { useEffect } from "react";

const SITE_URL = "https://askcreativeprinting.com";
const SITE_NAME = "ASK Creative Sdn Bhd";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;
const PER_PAGE_LDJSON_ID = "ldjson-page";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  /** Absolute or React-relative path (e.g. /images/foo.jpg). Defaults to site OG. */
  ogImage?: string;
  /** "website" (default) | "article" (blog post) | "product" (service) */
  ogType?: "website" | "article" | "product";
  /** ISO 8601 — used for og:article:published_time on blog posts */
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  articleSection?: string;
  articleTags?: string[];
  /** Optional structured-data override; takes precedence over auto-built one */
  structuredData?: Record<string, unknown>;
}

const absUrl = (path?: string) => {
  if (!path) return DEFAULT_OG_IMAGE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${SITE_URL}${path}`;
  return `${SITE_URL}/${path}`;
};

const setMetaName = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const setMetaProperty = (property: string, content: string) => {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const removeMetaProperty = (property: string) => {
  const tag = document.querySelector(`meta[property="${property}"]`);
  if (tag) tag.remove();
};

export default function SEOHead({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = "website",
  publishedTime,
  modifiedTime,
  author,
  articleSection,
  articleTags,
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

    const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
    const imageUrl = absUrl(ogImage);

    // Core meta
    setMetaName("description", description);
    if (keywords) setMetaName("keywords", keywords);
    setMetaName("author", author || SITE_NAME);

    // Open Graph
    setMetaProperty("og:type", ogType);
    setMetaProperty("og:site_name", SITE_NAME);
    setMetaProperty("og:title", title);
    setMetaProperty("og:description", description);
    setMetaProperty("og:url", canonicalUrl);
    setMetaProperty("og:image", imageUrl);
    setMetaProperty("og:image:secure_url", imageUrl);
    setMetaProperty("og:image:width", "1200");
    setMetaProperty("og:image:height", "630");
    setMetaProperty("og:image:alt", title);
    setMetaProperty("og:locale", "en_MY");

    // Twitter Card
    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", title);
    setMetaName("twitter:description", description);
    setMetaName("twitter:image", imageUrl);
    setMetaName("twitter:image:alt", title);

    // Article-specific (blog detail)
    if (ogType === "article") {
      if (publishedTime) setMetaProperty("article:published_time", publishedTime);
      if (modifiedTime) setMetaProperty("article:modified_time", modifiedTime);
      if (author) setMetaProperty("article:author", author);
      if (articleSection) setMetaProperty("article:section", articleSection);
      document.querySelectorAll('meta[property="article:tag"]').forEach((t) => t.remove());
      if (articleTags) {
        articleTags.forEach((tag) => {
          const meta = document.createElement("meta");
          meta.setAttribute("property", "article:tag");
          meta.setAttribute("content", tag);
          document.head.appendChild(meta);
        });
      }
    } else {
      removeMetaProperty("article:published_time");
      removeMetaProperty("article:modified_time");
      removeMetaProperty("article:author");
      removeMetaProperty("article:section");
      document.querySelectorAll('meta[property="article:tag"]').forEach((t) => t.remove());
    }

    // Canonical link
    let linkTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkTag) {
      linkTag = document.createElement("link");
      linkTag.setAttribute("rel", "canonical");
      document.head.appendChild(linkTag);
    }
    linkTag.setAttribute("href", canonicalUrl);

    // Per-page JSON-LD (separate from index.html's Organization JSON-LD)
    let scriptTag = document.getElementById(PER_PAGE_LDJSON_ID);
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.setAttribute("type", "application/ld+json");
      scriptTag.id = PER_PAGE_LDJSON_ID;
      document.head.appendChild(scriptTag);
    }

    let ld: Record<string, unknown>;
    if (structuredData) {
      ld = structuredData;
    } else if (ogType === "article") {
      ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description,
        image: imageUrl,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        author: { "@type": "Organization", name: author || SITE_NAME, url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/images/ask-logo.png` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
        articleSection,
        keywords: articleTags?.join(", "),
      };
    } else {
      // LocalBusiness for all non-article pages
      ld = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}#localbusiness`,
        name: SITE_NAME,
        alternateName: "ASK Creative Printing Services",
        url: SITE_URL,
        logo: `${SITE_URL}/images/ask-logo.png`,
        image: imageUrl,
        description,
        telephone: "+60-88-205423",
        email: "sales@askcreativeprinting.com",
        priceRange: "RM",
        address: {
          "@type": "PostalAddress",
          streetAddress: "No A6-1, Ground Floor, Block A, Kepayan Perdana",
          addressLocality: "Kota Kinabalu",
          addressRegion: "Sabah",
          postalCode: "88200",
          addressCountry: "MY",
        },
        geo: { "@type": "GeoCoordinates", latitude: 5.9804, longitude: 116.0735 },
        openingHoursSpecification: [
          { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:30", closes: "17:30" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "13:00" },
        ],
        sameAs: [
          "https://www.instagram.com/askcreativeprinting",
          "https://www.facebook.com/ASKCreativePrintingServices",
        ],
      };
    }
    scriptTag.textContent = JSON.stringify(ld);
  }, [title, description, keywords, canonical, ogImage, ogType, publishedTime, modifiedTime, author, articleSection, articleTags, structuredData]);

  return null;
}
