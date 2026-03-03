"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/redux";
import { getNavItemsForRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth?.user);
  const navItems = user ? getNavItemsForRole(user.role) : [];

  return (
    <aside className="flex h-full  flex-col border-r border-[var(--border)] ">
      <div className="px-4 pt-4 pb-[15px] border-b border-[var(--border)]">
        <Link href="/dashboard" className="text-lg font-bold text-[var(--foreground)]">
          Cheezy Bites
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors tap-target",
              pathname === item.href
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--foreground)] hover:bg-[var(--border)]"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
