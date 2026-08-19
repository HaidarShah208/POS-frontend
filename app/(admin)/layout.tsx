"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/redux";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const rehydrated = useAppSelector((s) => s.auth._rehydrated);

  useEffect(() => {
    if (!rehydrated) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [user, rehydrated, router]);

  if (!rehydrated || !user || user.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--muted)]">
        <div className="animate-pulse text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
