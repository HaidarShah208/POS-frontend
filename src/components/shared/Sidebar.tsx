"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/hooks/redux";
import { getNavItemsForRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Package,
  Warehouse,
  BarChart3,
  ClipboardList,
  Settings,
  LayoutGrid,
  Users,
  Gift,
  Truck,
  FileText,
  Banknote,
  UserCog,
  Shield,
  PieChart,
} from "lucide-react";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/pos": ShoppingCart,
  "/kitchen": ChefHat,
  "/products": Package,
  "/inventory": Warehouse,
  "/reports": BarChart3,
  "/orders": ClipboardList,
  "/floor": LayoutGrid,
  "/customers": Users,
  "/loyalty": Gift,
  "/suppliers": Truck,
  "/purchase-orders": FileText,
  "/cash-register": Banknote,
  "/employees": UserCog,
  "/roles": Shield,
  "/analytics": PieChart,
  "/settings": Settings,
};

type SidebarProps = {
  collapsed?: boolean;
};

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth?.user);
  const businessName =
    useAppSelector((s) => s.settings?.general?.businessName?.trim()) || "Restaurant POS";
  const permissions = useAppSelector((s) => s.auth?.permissions);
  const navItems = user ? getNavItemsForRole(user.role, permissions) : [];

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center border-b border-[var(--border)] h-[var(--topbar-height)] shrink-0",
          collapsed ? "justify-center px-2" : "px-4"
        )}
      >
        <Link
          href="/dashboard"
          className="font-bold text-[var(--foreground)] truncate transition-all"
        >
          {collapsed ? businessName.charAt(0) : businessName}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto scroll-area-thin">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.href];
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors tap-target",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
