export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--muted)]/50">
      {children}
    </div>
  );
}
