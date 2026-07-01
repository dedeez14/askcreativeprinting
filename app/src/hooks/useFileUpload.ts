import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';

const BASE = import.meta.env.VITE_API_BASE ?? 'https://erp.askcreativeprinting.com/api/landing/v1';

export interface UploadedFile {
  path: string;
  url: string;
  original_name: string;
  mime: string;
  ext: string;
  size: number;
}

/**
 * Upload a single file to /uploads. Returned object can be appended to
 * `uploaded_files` in the enquiry payload.
 */
async function uploadOne(file: File): Promise<UploadedFile> {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`${BASE}/uploads`, {
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

export const useFileUpload = () =>
  useMutation<UploadedFile, ApiError, File>({
    mutationFn: uploadOne,
  });
