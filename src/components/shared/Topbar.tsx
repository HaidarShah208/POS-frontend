"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[var(--border)] bg-[var(--background)] px-4">
      <div className="flex flex-1 items-center gap-2">
        <span className="text-sm font-medium text-[var(--muted-foreground)]">Restaurant POS</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pos">Open POS</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/auth/login">Logout</Link>
        </Button>
      </div>
    </header>
  );
}
