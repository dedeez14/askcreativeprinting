/**
 * The size matrix of the quotation form (06 B4 "Quantity — total qty and size breakdown",
 * "Size matrix is important for jersey and apparel production").
 *
 * The ERP stores the matrix as {size: qty} and sums it into total_qty when the form sends no
 * total, so the keys are what production reads on the SO line / FASE 3 matrix — keep them short
 * and unambiguous. Adult sizes first, then kids sizes (prefixed so an adult "6" can never be
 * mistaken for a kids 6).
 *
 * The Online Design Tool does NOT use these lists: its sizes come from the ERP's own
 * admin-editable option list (GET /design-submissions/options → sizes), because the server
 * validates each key against it.
 */

export const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] as const;

export const KIDS_SIZES = ['KIDS-2', 'KIDS-4', 'KIDS-6', 'KIDS-8', 'KIDS-10', 'KIDS-12', 'KIDS-14'] as const;

export type SizeMatrix = Record<string, number>;

/** Only the sizes with a real quantity — what the API should receive. */
export function cleanSizes(matrix: SizeMatrix): SizeMatrix {
  const out: SizeMatrix = {};
  for (const [size, qty] of Object.entries(matrix)) {
    const n = Math.trunc(Number(qty));
    if (size.trim() !== '' && Number.isFinite(n) && n > 0) out[size] = n;
  }
  return out;
}

/** Total pieces of a size matrix. */
export function sumSizes(matrix: SizeMatrix): number {
  return Object.values(cleanSizes(matrix)).reduce((a, b) => a + b, 0);
}

/** The label shown above a size input ("KIDS-10" reads as "10" under the Kids heading). */
export const sizeLabel = (size: string): string => size.replace(/^KIDS-/, '');
