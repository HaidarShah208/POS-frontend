export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-[var(--border)] rounded-lg" />
        <div className="h-10 w-32 bg-[var(--border)] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-[var(--card)] rounded-2xl border border-[var(--border)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-[var(--card)] rounded-2xl border border-[var(--border)]" />
        <div className="h-72 bg-[var(--card)] rounded-2xl border border-[var(--border)]" />
      </div>
    </div>
  );
}
