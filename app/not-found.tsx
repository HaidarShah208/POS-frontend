import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--muted)] px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-6">
          <FileQuestion className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          Page Not Found
        </h2>
        <p className="text-[var(--text-secondary)] mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Open POS
          </Link>
        </div>
      </div>
    </div>
  );
}
