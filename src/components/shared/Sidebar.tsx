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
  { href: "/staff", label: "Staff" },]
;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-56 flex-col lg:border-r border-(--border) ">
      <div className="p-3.5 border-b border-(--border)">
        <Link href="/dashboard" className="text-lg font-bold text-foreground)=">
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
                ? "bg-(--primary) text-(--primary-foreground)"
                : "text-foreground) hover:bg-(--border)"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
