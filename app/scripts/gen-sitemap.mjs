#!/usr/bin/env node
/**
 * Generate dist/sitemap.xml at build time, entirely from the ERP landing API
 * (06 §11 / A11 SEO — the sitemap must list the pages that exist TODAY, not a list frozen in this repo).
 *
 *   static pages   the public routes of src/App.tsx (not /track, not the 404 catch-all)
 *   /services/{slug}   GET /pages        (SEO landing pages, ServiceDetail route)
 *   /products/{slug}   GET /products
 *   /blog/{slug}       GET /blogs        (lastmod = published_at)
 *   /services/{slug}   GET /features     (link_url) — only when the slug is a canonical /pages slug (an alias would be duplicate content)
 *
 * API unreachable? No stale slugs are ever invented. The previous sitemap (public/sitemap.xml, else
 * dist/sitemap.xml) is kept; with none, only the static pages are written. A warning is printed.
 *
 * Run via: node scripts/gen-sitemap.mjs (hooked into "build"). VITE_API_BASE overrides the API.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = (process.env.SITE_URL || 'https://askcreativeprinting.com').replace(/\/+$/, '');
const API = (process.env.VITE_API_BASE || 'https://erp.askcreativeprinting.com/api/landing/v1').replace(/\/+$/, '');
const MAX_PAGES = 50;

// Routes of src/App.tsx that are indexable.
const STATIC_PAGES = [
  { loc: '/', priority: 1.0, changefreq: 'weekly' },
  { loc: '/about-us', priority: 0.9, changefreq: 'monthly' },
  { loc: '/services', priority: 0.9, changefreq: 'monthly' },
  { loc: '/products', priority: 0.9, changefreq: 'weekly' },
  { loc: '/online-design', priority: 0.8, changefreq: 'monthly' },
  { loc: '/quotation', priority: 0.9, changefreq: 'monthly' },
  { loc: '/portfolio', priority: 0.8, changefreq: 'weekly' },
  { loc: '/clients', priority: 0.7, changefreq: 'monthly' },
  { loc: '/faq', priority: 0.6, changefreq: 'monthly' },
  { loc: '/blog', priority: 0.7, changefreq: 'weekly' },
  { loc: '/contact', priority: 0.8, changefreq: 'monthly' },
];

const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** GET a list endpoint; follows Laravel-style pagination if present. Returns null on any failure. */
async function fetchList(path) {
  const rows = [];
  let url = `${API}${path}`;
  for (let i = 0; i < MAX_PAGES && url; i++) {
    let body;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) return null;
      body = await res.json();
    } catch {
      return null;
    }
    if (!body?.success || !Array.isArray(body.data)) return null;
    rows.push(...body.data);

    // Pagination: links.next / meta.next_page_url, else meta.current_page < meta.last_page.
    const meta = body.meta ?? {};
    let next = body.links?.next ?? meta.next_page_url ?? null;
    if (!next && Number(meta.current_page) > 0 && Number(meta.current_page) < Number(meta.last_page)) {
      const u = new URL(`${API}${path}`);
      u.searchParams.set('page', String(Number(meta.current_page) + 1));
      next = u.toString();
    }
    url = next;
  }
  return rows;
}

function urlNode({ loc, lastmod, changefreq = 'monthly', priority = 0.5 }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(SITE + loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

const toXml = (urls) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(urlNode).join('\n')}
</urlset>
`;

/** Read the previously built sitemap (public/ first, then dist/) as raw <url> nodes keyed by path. */
function previousSitemap() {
  for (const dir of ['public', 'dist']) {
    const file = join(process.cwd(), dir, 'sitemap.xml');
    if (!existsSync(file)) continue;
    const xml = readFileSync(file, 'utf8');
    const entries = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => {
      const loc = /<loc>([^<]*)<\/loc>/.exec(m[0])?.[1] ?? '';
      const path = loc.replace(/&amp;/g, '&').replace(SITE, '') || '/';
      return { path, node: m[0] };
    });
    if (entries.length > 0) return { file, xml, entries };
  }
  return null;
}

const slugOf = (v) => (typeof v === 'string' ? v.trim().replace(/^\/+|\/+$/g, '') : '');

async function main() {
  const [pages, products, blogs, features] = await Promise.all([
    fetchList('/pages'),
    fetchList('/products'),
    fetchList('/blogs'),
    fetchList('/features'),
  ]);

  const out = join(process.cwd(), 'dist', 'sitemap.xml');
  mkdirSync(join(process.cwd(), 'dist'), { recursive: true });

  // Nothing came back: never invent slugs.
  if (!pages && !products && !blogs) {
    const prev = previousSitemap();
    if (prev) {
      writeFileSync(out, prev.xml, 'utf8');
      console.warn(`WARNING: landing API unreachable (${API}). Kept the previous sitemap from ${prev.file} (${prev.entries.length} URLs).`);
    } else {
      writeFileSync(out, toXml(STATIC_PAGES), 'utf8');
      console.warn(`WARNING: landing API unreachable (${API}) and no previous sitemap exists. Wrote the ${STATIC_PAGES.length} static pages only.`);
    }
    return;
  }

  const prev = previousSitemap();
  // A single endpoint failing keeps that endpoint's URLs from the previous sitemap instead of dropping them.
  const carryOver = (prefix, label) => {
    console.warn(`WARNING: GET ${API}/${label} failed.` + (prev ? ` Carrying over its URLs from the previous sitemap.` : ' Its URLs are missing from this sitemap.'));
    return (prev?.entries ?? []).filter((e) => e.path.startsWith(prefix)).map((e) => ({ raw: e.node }));
  };

  const urls = [...STATIC_PAGES];
  const counts = { static: STATIC_PAGES.length, pages: 0, products: 0, blogs: 0, features: 0 };

  // SEO landing pages → /services/:slug (ServiceDetail). Aliases resolve server-side (duplicate content), so only the canonical slug is listed.
  const pageSlugs = new Set();
  if (pages) {
    for (const p of pages) {
      const slug = slugOf(p.slug);
      if (!slug) continue;
      pageSlugs.add(slug);
      urls.push({ loc: `/services/${slug}`, changefreq: 'monthly', priority: 0.8, lastmod: (p.updated_at || '').slice(0, 10) || undefined });
      counts.pages++;
    }
  } else {
    const kept = carryOver('/services/', 'pages');
    urls.push(...kept);
    counts.pages = kept.length;
  }

  if (products) {
    for (const p of products) {
      const slug = slugOf(p.slug);
      if (!slug) continue;
      urls.push({ loc: `/products/${slug}`, changefreq: 'weekly', priority: 0.7, lastmod: (p.updated_at || '').slice(0, 10) || undefined });
      counts.products++;
    }
  } else {
    const kept = carryOver('/products/', 'products');
    urls.push(...kept);
    counts.products = kept.length;
  }

  if (blogs) {
    for (const b of blogs) {
      const slug = slugOf(b.slug);
      if (!slug) continue;
      urls.push({ loc: `/blog/${slug}`, changefreq: 'monthly', priority: 0.6, lastmod: (b.published_at || '').slice(0, 10) || undefined });
      counts.blogs++;
    }
  } else {
    const kept = carryOver('/blog/', 'blogs');
    urls.push(...kept);
    counts.blogs = kept.length;
  }

  // Service cards (features) link to /services/{slug}. Listed only when the slug is a canonical SEO page —
  // a card pointing at an alias or a slug the site no longer resolves is not a page worth indexing. When /pages itself is
  // down the check is impossible, so cards are skipped rather than trusted.
  if (features && pages) {
    for (const f of features) {
      const m = /^\/services\/([^/?#]+)\/?$/.exec(f.link_url || '');
      if (m && pageSlugs.has(m[1])) {
        urls.push({ loc: `/services/${m[1]}`, changefreq: 'monthly', priority: 0.8 });
        counts.features++;
      }
    }
  }

  // De-duplicate by path (first wins).
  const seen = new Set();
  const unique = urls.filter((u) => {
    const key = u.raw ? (/<loc>([^<]*)<\/loc>/.exec(u.raw)?.[1] ?? u.raw) : SITE + u.loc;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map((u) => (u.raw ? `  ${u.raw}` : urlNode(u))).join('\n')}
</urlset>
`;
  writeFileSync(out, xml, 'utf8');
  console.log(
    `sitemap.xml written -> ${out} (${unique.length} URLs: static ${counts.static}, /services ${counts.pages}, /products ${counts.products}, /blog ${counts.blogs}; ${urls.length - unique.length} duplicates removed (service-card links already listed: ${counts.features}))`,
  );
}

main().catch((e) => {
  console.error('Sitemap generation failed:', e);
  process.exit(1);
});
