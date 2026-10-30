/**
 * The MOVERA ERP public landing API (https://erp.askcreativeprinting.com/api/landing/v1).
 *
 * Envelope: every /api/landing/v1 endpoint answers {success, data} or {success:false, error}.
 * A few ERP endpoints outside that prefix answer plain JSON (the customer tracking feed,
 * GET /p/job-status/{token}) — those use `fetchErpJson`, not `apiGet`.
 */
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'https://erp.askcreativeprinting.com/api/landing/v1';

/** The ERP origin behind the API base — used for pages served outside /api/landing/v1. */
export const ERP_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return 'https://erp.askcreativeprinting.com';
  }
})();

const BASE = API_BASE;

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** True when the ERP does not serve this endpoint yet (older deployment) — callers fall back. */
export const isMissingEndpoint = (err: unknown): boolean =>
  err instanceof ApiError && (err.status === 404 || err.status === 405 || err.status === 501);

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' }, ...init });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const err = body?.error ?? { code: `HTTP_${res.status}`, message: res.statusText };
    throw new ApiError(res.status, err.code, err.message, err.fields);
  }
  return body.data as T;
}

/**
 * Same GET, but the whole envelope — for the endpoints whose `meta` carries something the page needs
 * (06 §10: the gallery's own category list, so the portfolio filters are the client's eight categories
 * whether or not an entry exists in each yet).
 */
export async function apiGetEnvelope<T, M = Record<string, unknown>>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; meta?: M }> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' }, ...init });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const err = body?.error ?? { code: `HTTP_${res.status}`, message: res.statusText };
    throw new ApiError(res.status, err.code, err.message, err.fields);
  }
  return { data: body.data as T, meta: body.meta as M };
}

export async function apiPost<T, B = unknown>(path: string, body: B): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = json?.error ?? { code: `HTTP_${res.status}`, message: res.statusText };
    throw new ApiError(res.status, err.code, err.message, err.fields);
  }
  return json.data as T;
}

/**
 * A plain-JSON GET against the ERP origin (no {success, data} envelope), for the customer
 * tracking feed. `path` starts with a slash and is appended to the ERP origin.
 */
export async function fetchErpJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ERP_ORIGIN}${path}`, { headers: { Accept: 'application/json' }, ...init });
  } catch (e) {
    // Network error, or the browser refused the cross-origin read (the ERP must allow this
    // origin in config/cors.php). Reported as a missing endpoint so the caller can fall back.
    throw new ApiError(0, 'NETWORK', e instanceof Error ? e.message : 'Network error');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || body === null) {
    throw new ApiError(res.status, `HTTP_${res.status}`, res.statusText || 'Request failed');
  }
  return body as T;
}
