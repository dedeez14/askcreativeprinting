/**
 * The site's public base path (Vite `base`, exposed as import.meta.env.BASE_URL).
 *
 * The live site is built with the default base '/', so every helper here returns exactly the
 * root-relative path it is given. A build with `--base=/some/sub-path/` (e.g. the dev ERP's
 * /website-preview/ copy) prefixes that sub-path instead, so public images and plain links keep
 * working when the SPA is served below the domain root.
 */
const BASE = import.meta.env.BASE_URL || '/';

/** React Router basename: '/' for the live site, '/some/sub-path' (no trailing slash) otherwise. */
export const ROUTER_BASENAME = BASE.replace(/\/+$/, '') || '/';

/** A root-relative public path ('/images/x.jpg', '/quotation') under the build's base. */
export const withBase = (path: string): string => `${BASE}${path.replace(/^\/+/, '')}`;
