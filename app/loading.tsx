export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--muted)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-3 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
