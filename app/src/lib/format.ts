/**
 * Display formats for ASK Creative (Malaysia): dates dd/mm/yyyy, money RM.
 * Everything is formatted explicitly — never through a machine-dependent default locale.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** dd/mm/yyyy, or '' when the value is not a usable date. */
export function formatDate(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** dd/mm/yyyy HH:mm (24h), or '' when the value is not a usable date. */
export function formatDateTime(value?: string | number | Date | null): string {
  const date = formatDate(value);
  if (!date) return '';
  const d = value instanceof Date ? value : new Date(value as string | number);
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** RM 1,250.00 — MYR is the only currency ASK Creative quotes in. */
export function formatMoney(amount?: number | string | null): string {
  if (amount === null || amount === undefined || amount === '') return '';
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (Number.isNaN(n)) return '';
  const [whole, cents] = n.toFixed(2).split('.');
  return `RM ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
}

/** yyyy-mm-dd for an <input type="date"> / the API (which wants ISO dates). */
export function isoDate(value?: string | number | Date | null): string {
  if (value === null || value === undefined || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
