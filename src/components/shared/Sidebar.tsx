"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pos", label: "POS" },
  { href: "/kitchen", label: "Kitchen" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/staff", label: "Staff" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-56 flex-col border-r border-[var(--border)] bg-[var(--muted)]/30">
      <div className="p-4 border-b border-[var(--border)]">
        <Link href="/dashboard" className="text-lg font-bold text-[var(--foreground)]">
          POS Restaurant
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
