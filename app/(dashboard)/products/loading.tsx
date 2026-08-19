export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-[var(--border)] rounded-lg" />
        <div className="h-10 w-36 bg-[var(--border)] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-[var(--card)] rounded-2xl border border-[var(--border)]" />
        ))}
      </div>
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="h-12 bg-[var(--muted)] border-b border-[var(--border)]" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-[var(--border)] px-6 flex items-center gap-4">
            <div className="h-10 w-10 bg-[var(--border)] rounded-lg" />
            <div className="h-4 w-32 bg-[var(--border)] rounded" />
            <div className="flex-1" />
            <div className="h-4 w-16 bg-[var(--border)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
