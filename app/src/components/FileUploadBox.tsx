import { useRef, useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  UPLOAD_ACCEPT,
  UPLOAD_ACCEPT_LABEL,
  UPLOAD_MAX_BYTES,
  UPLOAD_MAX_FILES,
  roleForFile,
  uploadOne,
  type UploadedFileWithRole,
} from "../hooks/useFileUpload";
import type { UploadRole } from "../types/landing";

const ROLE_LABELS: Record<UploadRole, string> = {
  logo: "Logo",
  artwork: "Artwork",
  reference: "Design reference",
  sizelist: "Size list",
  nameset: "Name & number list",
};

export interface FileUploadBoxProps {
  files: UploadedFileWithRole[];
  onChange: (files: UploadedFileWithRole[]) => void;
  /** Shown inside the drop area. */
  hint?: string;
  /** Let the customer say what each file is for (06 B10 file types). */
  showRoles?: boolean;
  /** Upper bound on the number of files (the ERP accepts 20 per enquiry). */
  max?: number;
  /** Fired the first time the visitor interacts, for form-funnel tracking. */
  onInteract?: () => void;
}

/**
 * 06 B10 file upload. Each file goes to the ERP straight away (POST /uploads) and only the
 * returned descriptor is kept, so the enquiry that follows references a path the ERP wrote
 * itself. Nothing is submitted from the browser's own file object.
 */
export default function FileUploadBox({
  files,
  onChange,
  hint,
  showRoles = true,
  max = UPLOAD_MAX_FILES,
  onInteract,
}: FileUploadBoxProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);

  const handleFiles = async (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    onInteract?.();

    const room = max - files.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${max} files.`);
      return;
    }

    const batch = Array.from(picked).slice(0, room);
    if (batch.length < picked.length) {
      toast.error(`Only the first ${batch.length} file(s) were added — the limit is ${max}.`);
    }

    const accepted: UploadedFileWithRole[] = [];
    for (const file of batch) {
      if (file.size > UPLOAD_MAX_BYTES) {
        toast.error(`${file.name} is larger than 10 MB.`);
        continue;
      }
      setBusy((n) => n + 1);
      try {
        const uploaded = await uploadOne(file);
        accepted.push({ ...uploaded, role: roleForFile(uploaded.original_name || file.name) });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        toast.error(`${file.name}: ${message}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }

    if (accepted.length > 0) onChange([...files, ...accepted]);
    if (input.current) input.current.value = "";
  };

  const setRole = (path: string, role: UploadRole) =>
    onChange(files.map((f) => (f.path === path ? { ...f, role } : f)));

  const remove = (path: string) => onChange(files.filter((f) => f.path !== path));

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="w-full border-2 border-dashed border-forest-900/15 hover:border-[#d7ff00] rounded-lg p-6 text-center transition-colors"
      >
        {busy > 0 ? (
          <Loader2 className="w-6 h-6 text-forest-900/40 mx-auto mb-2 animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-forest-900/30 mx-auto mb-2" />
        )}
        <p className="text-forest-900/70 text-sm font-body">
          {busy > 0 ? `Uploading ${busy} file(s)…` : hint ?? "Upload your logo, artwork or design reference"}
        </p>
        <p className="text-forest-900/40 text-xs font-body mt-1">{UPLOAD_ACCEPT_LABEL}</p>
      </button>

      <input
        ref={input}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.path}
              className="flex flex-wrap items-center gap-2 rounded-md border border-forest-900/10 bg-off-white px-3 py-2"
            >
              <FileText className="w-4 h-4 text-forest-900/40 shrink-0" />
              <span className="text-sm font-body text-forest-900 truncate max-w-[180px] sm:max-w-[260px]">
                {file.original_name}
              </span>
              <span className="text-xs font-body text-forest-900/40">
                {Math.max(1, Math.round(file.size / 1024))} KB
              </span>
              {showRoles && (
                <select
                  value={file.role}
                  onChange={(e) => setRole(file.path, e.target.value as UploadRole)}
                  aria-label={`What is ${file.original_name} for?`}
                  className="ml-auto rounded-md border border-forest-900/15 bg-white px-2 py-1 text-xs font-body text-forest-900"
                >
                  {(Object.keys(ROLE_LABELS) as UploadRole[]).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => remove(file.path)}
                aria-label={`Remove ${file.original_name}`}
                className={`${showRoles ? "" : "ml-auto "}text-forest-900/40 hover:text-red-600 transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
