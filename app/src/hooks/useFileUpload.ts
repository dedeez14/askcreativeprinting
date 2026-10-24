import { useMutation } from '@tanstack/react-query';
import { API_BASE, ApiError } from '@/lib/api';
import type { UploadRole, UploadedFile, UploadedFileRef } from '@/types/landing';

export type { UploadedFile } from '@/types/landing';

/**
 * 06 B10 — the customer's files go to the ERP first, then the enquiry references them.
 *
 * POST /uploads takes one `file` (multipart) and returns the descriptor
 * {path, url, original_name, mime, ext, size}. The ERP chooses the stored path, checks the
 * extension AND the sniffed mime type and refuses active SVG; the enquiry / design submission
 * is then validated against that same path, so a path we did not get from here is refused.
 *
 * Accepted: PNG, JPG, WEBP, GIF, PDF, SVG, AI, EPS, CSV, XLS, XLSX — 10 MB per file.
 */
export const UPLOAD_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,.pdf,.svg,.ai,.eps,.csv,.xls,.xlsx';
export const UPLOAD_ACCEPT_LABEL = 'PNG, JPG, WEBP, GIF, PDF, SVG, AI, EPS, CSV, XLS or XLSX — up to 10 MB each';
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const UPLOAD_MAX_FILES = 20;

/** A file plus what it is for, as the enquiry sends it. */
export interface UploadedFileWithRole extends UploadedFile {
  role: UploadRole;
}

/** The ERP's own default when no role is sent (App\Support\Landing\AskFileName::type). */
export function roleForFile(name: string): UploadRole {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['csv', 'xls', 'xlsx'].includes(ext)) return 'sizelist';
  if (['ai', 'eps', 'svg', 'pdf'].includes(ext)) return 'artwork';
  return 'reference';
}

export async function uploadOne(file: File): Promise<UploadedFile> {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: fd,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = json?.error ?? { code: `HTTP_${res.status}`, message: res.statusText };
    throw new ApiError(res.status, err.code, err.message, err.fields);
  }
  return json.data as UploadedFile;
}

/** Only the fields the enquiry endpoint accepts for a file (never the url). */
export const toFileRef = (file: UploadedFileWithRole): UploadedFileRef => ({
  path: file.path,
  original_name: file.original_name,
  mime: file.mime,
  size: file.size,
  role: file.role,
});

export const useFileUpload = () =>
  useMutation<UploadedFile, ApiError, File>({
    mutationFn: uploadOne,
  });
