"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/redux";

/**
 * Redirects to /auth/login when the user is not authenticated (after rehydration).
 * Use on the root "/" route so unauthenticated users never see the home page.
 */
export function RedirectUnauthorized({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const rehydrated = useAppSelector((s) => s.auth?._rehydrated);
  const token = useAppSelector((s) => s.auth?.token ?? null);

  useEffect(() => {
    if (!rehydrated) return;
    if (!token) {
      router.replace("/auth/login");
    }
  }, [rehydrated, token, router]);

  if (!rehydrated || !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-(--muted)">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    );
  }

  return <>{children}</>;
}
