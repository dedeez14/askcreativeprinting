interface Props {
  retry?: () => void;
  message?: string;
}

export function SectionErrorFallback({ retry, message }: Props) {
  return (
    <div className="p-8 text-center text-white/60">
      <p className="mb-3 font-body text-sm">{message ?? 'Gagal memuat konten.'}</p>
      {retry && (
        <button onClick={retry} className="font-mono text-xs text-brand-gold-500 hover:text-brand-gold-400 underline tracking-[1px]">
          COBA LAGI
        </button>
      )}
    </div>
  );
}
