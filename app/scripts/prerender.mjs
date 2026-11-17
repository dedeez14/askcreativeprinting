#!/usr/bin/env node
/**
 * Prerender the home page into dist/index.html (run after `vite build` and the SSR build of
 * src/entry-server.tsx into dist-ssr/; hooked into "build").
 *
 * Why: the site is a client-rendered SPA, so on a phone nothing — not even the hero — painted until the
 * whole JavaScript bundle had downloaded and run. With the markup in the HTML, the hero text and image
 * paint straight from the HTML and CSS, and src/main.tsx hydrates the same markup.
 *
 *   dist/index.html  served for "/" only: the shell with the home page inside <div id="root">
 *   dist/app.html    the untouched shell (empty root) — nginx serves it for every other route
 *
 * The SSR bundle is deleted afterwards; nothing in dist-ssr/ is deployed.
 */
import { copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');
const shellFile = join(dist, 'index.html');
const EMPTY_ROOT = '<div id="root"></div>';

const shell = readFileSync(shellFile, 'utf8');
if (!shell.includes(EMPTY_ROOT)) {
  throw new Error(`prerender: ${EMPTY_ROOT} not found in dist/index.html (already prerendered?)`);
}
copyFileSync(shellFile, join(dist, 'app.html'));

const { render } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);
const html = render('/');
if (!html.includes('<h1')) throw new Error('prerender: the home page rendered without its <h1>');

writeFileSync(shellFile, shell.replace(EMPTY_ROOT, `<div id="root" data-prerendered>${html}</div>`));
rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerender: "/" → dist/index.html (${(html.length / 1024).toFixed(1)} kB of markup), shell → dist/app.html`);
