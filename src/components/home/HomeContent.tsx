"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/redux";

export function HomeContent() {
  const businessName = useAppSelector((s) => s.settings?.general?.businessName?.trim()) || "Restaurant POS";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-(--muted) p-4">
      <h1 className="text-3xl font-bold">{businessName}</h1>
      <p className="text-(--muted-foreground)">Point of Sale system</p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button variant="accent" asChild>
          <Link href="/pos">Sales Counter</Link>
        </Button>
      </div>
    </div>
  );
}
