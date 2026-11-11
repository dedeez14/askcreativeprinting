import { useEffect, useRef, type ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * The full-screen editor for phones and tablets (and for anyone who wants the room on a desktop):
 * the garment fills the top of the screen, the tools scroll in a sheet underneath — on a wide screen
 * they sit beside it. The page under it does not scroll while it is open.
 */
export default function EditorSheet({ open, onClose, title, stage, tools }: {
  open: boolean; onClose: () => void; title: string; stage: ReactNode; tools: ReactNode;
}) {
  const done = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    done.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      className="fixed inset-0 z-[70] flex flex-col bg-white lg:grid lg:grid-cols-[1fr_400px] lg:grid-rows-[auto_1fr]">
      <div className="flex items-center gap-2 border-b border-forest-900/10 px-3 py-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] lg:col-span-2">
        <p className="min-w-0 flex-1 truncate font-display text-lg uppercase text-forest-900">{title}</p>
        <button ref={done} type="button" onClick={onClose}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[#0d1f16] px-4 text-sm font-body font-medium text-[#d7ff00]">
          <Check className="h-4 w-4" /> Done
        </button>
      </div>
      <div className="relative min-h-0 flex-1 bg-off-white p-2 lg:p-6">{stage}</div>
      <div className="max-h-[46vh] overflow-y-auto overscroll-contain border-t border-forest-900/10 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:max-h-none lg:border-l lg:border-t-0">
        {tools}
      </div>
    </div>
  );
}
