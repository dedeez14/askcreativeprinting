const BASE = import.meta.env.VITE_API_BASE ?? 'https://erp.askcreativeprinting.com/api/landing/v1';

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

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' }, ...init });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const err = body?.error ?? { code: `HTTP_${res.status}`, message: res.statusText };
    throw new ApiError(res.status, err.code, err.message, err.fields);
  }
  return body.data as T;
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
