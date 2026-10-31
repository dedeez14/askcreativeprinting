/**
 * Rewrite an ERP file URL so the browser is allowed to read the pixels.
 *
 * The customer's uploaded artwork lives on the ERP, which is a different origin from this
 * site. A plain <img> renders such a file happily, but WebGL refuses to turn it into a
 * texture unless the server says the page may read it, and the ERP sends no CORS header for
 * /storage — only for its landing API. The result was an upload that showed as a thumbnail
 * and then never appeared on the 3D model.
 *
 * Rather than widen the ERP's CORS policy, the site passes these files through its own
 * origin at /erp-media/ (see nginx/default.conf), where the cross-origin question does not
 * arise at all. The signed query string is preserved — the ERP checks it.
 */
export function sameOriginMedia(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url, window.location.origin);
    if (u.origin === window.location.origin) return url;   // already ours
    if (!u.pathname.startsWith("/storage/")) return url;   // not an ERP file
    return `/erp-media/${u.pathname.slice("/storage/".length)}${u.search}`;
  } catch {
    return url;
  }
}
