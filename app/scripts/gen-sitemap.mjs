#!/usr/bin/env node
/**
 * Generate sitemap.xml at build time.
 * Fetches blog + service slugs from MOVERA landing API.
 * Falls back to static known URLs if API is unreachable.
 *
 * Run via: node scripts/gen-sitemap.mjs
 * Hooked into "build" script in package.json.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://askcreativeprinting.com';
const API  = process.env.VITE_API_BASE || 'https://erp.askcreativeprinting.com/api/landing/v1';

const STATIC_PAGES = [
  { loc: '/',            priority: 1.0, changefreq: 'weekly' },
  { loc: '/about-us',    priority: 0.9, changefreq: 'monthly' },
  { loc: '/services',    priority: 0.9, changefreq: 'monthly' },
  { loc: '/portfolio',   priority: 0.8, changefreq: 'weekly' },
  { loc: '/clients',     priority: 0.7, changefreq: 'monthly' },
  { loc: '/online-design', priority: 0.8, changefreq: 'monthly' },
  { loc: '/quotation',   priority: 0.9, changefreq: 'monthly' },
  { loc: '/faq',         priority: 0.6, changefreq: 'monthly' },
  { loc: '/blog',        priority: 0.7, changefreq: 'weekly' },
  { loc: '/contact',     priority: 0.8, changefreq: 'monthly' },
];

const STATIC_SERVICES = [
  'sublimation-printing-sabah',
  'custom-jersey-printing-sabah',
  'custom-apparel-sabah',
  't-shirt-printing-sabah',
  'embroidery-kota-kinabalu',
  'digital-printing-kota-kinabalu',
  'banner-bunting-printing-kota-kinabalu',
  'premium-gifts-sabah',
];

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

function urlNode({ loc, lastmod, changefreq = 'monthly', priority = 0.5 }) {
  return [
    '  <url>',
    `    <loc>${SITE}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  // 1) Blog posts from API (fallback to known seeded slugs if API down)
  const blogs = await fetchJson(`${API}/blogs`);
  const blogUrls = (blogs || []).map((b) => ({
    loc: `/blog/${b.slug}`,
    lastmod: (b.published_at || today).slice(0, 10),
    changefreq: 'monthly',
    priority: 0.6,
  }));
  if (blogUrls.length === 0) {
    [
      'how-to-design-custom-sublimation-jersey',
      'sublimation-vs-screen-vs-heat-press',
      'top-10-corporate-gift-ideas-sabah',
      'choosing-right-fabric-custom-apparel',
      'how-to-prepare-print-ready-artwork',
      'planning-team-uniforms-school-sports-day',
    ].forEach((s) => blogUrls.push({ loc: `/blog/${s}`, lastmod: today, changefreq: 'monthly', priority: 0.6 }));
  }

  // 2) Service detail pages — try features API; fallback to static list
  const features = await fetchJson(`${API}/features`);
  const serviceSlugs = features
    ? features.map((f) => (f.link_url || '').replace(/^\/services\//, '')).filter(Boolean)
    : STATIC_SERVICES;
  const serviceUrls = serviceSlugs.map((slug) => ({
    loc: `/services/${slug}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: 0.8,
  }));

  // 3) Static pages
  const staticUrls = STATIC_PAGES.map((p) => ({ ...p, lastmod: today }));

  const all = [...staticUrls, ...serviceUrls, ...blogUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(urlNode).join('\n')}
</urlset>
`;

  const out = join(process.cwd(), 'dist', 'sitemap.xml');
  writeFileSync(out, xml, 'utf8');
  console.log(`✓ sitemap.xml written → ${out} (${all.length} URLs)`);
}

main().catch((e) => {
  console.error('Sitemap generation failed:', e);
  process.exit(1);
});
