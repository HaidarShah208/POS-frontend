"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/redux";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth?.user);
  const rehydrated = useAppSelector((s) => s.auth?._rehydrated);

  useEffect(() => {
    if (!rehydrated) return;
    if (!user) {
      router.replace("/auth/login");
    }
  }, [user, rehydrated, router]);

  if (!rehydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="animate-pulse text-gray-400">Loading Kitchen...</div>
      </div>
    );
  }

  return <>{children}</>;
}
