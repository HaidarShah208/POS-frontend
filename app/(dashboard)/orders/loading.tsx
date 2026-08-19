export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-[var(--border)] rounded-lg" />
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-[var(--border)] rounded-xl" />
          <div className="h-10 w-28 bg-[var(--border)] rounded-xl" />
        </div>
      </div>
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="h-12 bg-[var(--muted)] border-b border-[var(--border)]" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-[var(--border)] px-6 flex items-center gap-4">
            <div className="h-4 w-24 bg-[var(--border)] rounded" />
            <div className="h-4 w-20 bg-[var(--border)] rounded" />
            <div className="h-4 w-16 bg-[var(--border)] rounded" />
            <div className="flex-1" />
            <div className="h-6 w-20 bg-[var(--border)] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
