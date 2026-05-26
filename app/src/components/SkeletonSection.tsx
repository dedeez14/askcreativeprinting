interface Props {
  variant?: 'hero' | 'cards' | 'list';
}

export function SkeletonSection({ variant = 'cards' }: Props) {
  return (
    <div className="animate-pulse p-8">
      {variant === 'hero' && <div className="h-96 bg-white/10 rounded" />}
      {variant === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-white/10 rounded" />
          ))}
        </div>
      )}
      {variant === 'list' && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded" />
          ))}
        </div>
      )}
    </div>
  );
}
