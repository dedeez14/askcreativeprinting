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

/** Every size of the form, small to large: adult sizes, then kids sizes (the order of the inputs). */
export const ALL_SIZES: readonly string[] = [...ADULT_SIZES, ...KIDS_SIZES];

/** The label of a size in a list that mixes adult and kids sizes ("KIDS-10" reads as "Kids 10"). */
export const sizeOptionLabel = (size: string): string =>
  size.startsWith('KIDS-') ? `Kids ${sizeLabel(size)}` : size;

/** The sizes of the breakdown with a quantity, small to large — what a name in the list may be given. */
export function breakdownSizes(matrix: SizeMatrix): string[] {
  const clean = cleanSizes(matrix);
  const known = ALL_SIZES.filter((size) => (clean[size] ?? 0) > 0);
  const other = Object.keys(clean).filter((size) => !ALL_SIZES.includes(size));
  return [...known, ...other];
}

/**
 * The name list and the size breakdown must agree (17-Nov-2026, verification T3). The breakdown is the
 * source of truth — it is the total quantity and what production cuts — and the names are a subset of it:
 * per size, the names given that size may not outnumber the pieces of that size, and a name may not carry
 * a size the breakdown does not have. Fewer names than pieces is fine (plain pieces without a name).
 * The ERP applies the same rule with the same words (EnquiryIntake::namesetSizeConflicts).
 */
export function namesetSizeConflicts(
  rows: { name?: string; size?: string }[],
  matrix: SizeMatrix,
): string[] {
  const pieces: Record<string, number> = {};
  for (const [size, qty] of Object.entries(cleanSizes(matrix))) {
    const key = size.trim().toUpperCase();
    pieces[key] = (pieces[key] ?? 0) + qty;
  }
  if (Object.keys(pieces).length === 0) return [];

  const named: Record<string, number> = {};
  for (const row of rows) {
    const size = (row.size ?? '').trim().toUpperCase();
    if ((row.name ?? '').trim() !== '' && size !== '') named[size] = (named[size] ?? 0) + 1;
  }

  const conflicts: string[] = [];
  for (const [size, count] of Object.entries(named)) {
    const have = pieces[size] ?? 0;
    if (have === 0) conflicts.push(`Name list: size ${size} is not in your size breakdown.`);
    else if (count > have) conflicts.push(`Name list: ${count} names in size ${size}, but the size breakdown has ${have} of ${size}.`);
  }
  return conflicts;
}
