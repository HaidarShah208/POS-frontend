"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getApiErrorStatus, getApiErrorMessage } from "@/lib/apiErrors";

interface ApiErrorDisplayProps {
  error: unknown;
  onDismiss?: () => void;
  /** When true, 401 will redirect to login (default true) */
  redirectOn401?: boolean;
}

/**
 * Reusable API error display:
 * - 401 → redirect to /auth/login (if redirectOn401)
 * - 403 → show "Access denied"
 * - 500 / network → show generic error message
 */
export function ApiErrorDisplay({ error, onDismiss, redirectOn401 = true }: ApiErrorDisplayProps) {
  const router = useRouter();
  if (!error) return null;

  const status = getApiErrorStatus(error);
  const message = getApiErrorMessage(error);

  if (status === 401 && redirectOn401 && typeof window !== "undefined") {
    router.push("/auth/login");
    return null;
  }

  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]"
      role="alert"
    >
      <p className="font-medium">{status === 403 ? "Access denied" : "Error"}</p>
      <p className="mt-1 text-[var(--muted-foreground)]">{message}</p>
      {onDismiss && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={onDismiss}>
          Dismiss
        </Button>
      )}
    </div>
  );
}
