import { useEffect } from 'react';

interface DocumentMeta {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

/**
 * Lightweight client-side SEO meta tag injection. Updates <title>,
 * <meta name="description">, and Open Graph + Twitter Card tags in
 * document.head whenever the input changes.
 *
 * For non-JS-executing crawlers (e.g. LinkedIn unfurl, Slack preview),
 * a server-side prerender layer would be needed — this is the MVP.
 */
export function useDocumentMeta(meta: DocumentMeta): void {
  useEffect(() => {
    const prevTitle = document.title;
    if (meta.title) document.title = meta.title;

    const upsert = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        Object.entries(attrs).forEach(([k, v]) => { if (k !== 'content') el!.setAttribute(k, v); });
        document.head.appendChild(el);
      }
      el.setAttribute('content', attrs.content);
    };

    if (meta.description) {
      upsert('meta[name="description"]', { name: 'description', content: meta.description });
      upsert('meta[property="og:description"]', { property: 'og:description', content: meta.description });
      upsert('meta[name="twitter:description"]', { name: 'twitter:description', content: meta.description });
    }
    if (meta.title) {
      upsert('meta[property="og:title"]', { property: 'og:title', content: meta.title });
      upsert('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
    }
    if (meta.image) {
      upsert('meta[property="og:image"]', { property: 'og:image', content: meta.image });
      upsert('meta[name="twitter:image"]', { name: 'twitter:image', content: meta.image });
      upsert('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    }
    if (meta.url) {
      upsert('meta[property="og:url"]', { property: 'og:url', content: meta.url });
      let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canon) {
        canon = document.createElement('link');
        canon.rel = 'canonical';
        document.head.appendChild(canon);
      }
      canon.href = meta.url;
    }
    if (meta.type) {
      upsert('meta[property="og:type"]', { property: 'og:type', content: meta.type });
    }

    // Robots
    upsert('meta[name="robots"]', {
      name: 'robots',
      content: meta.noindex ? 'noindex,nofollow' : 'index,follow',
    });

    return () => {
      document.title = prevTitle;
    };
  }, [meta.title, meta.description, meta.image, meta.url, meta.type, meta.noindex]);
}
