"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopbarProps = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[var(--border)] bg-[var(--background)] px-4">
      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn("lg:hidden shrink-0")}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
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
