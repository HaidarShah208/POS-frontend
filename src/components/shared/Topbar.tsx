"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { logout, saveAuthToStorage } from "@/redux/api/auth";
import { cn } from "@/lib/utils";
import {
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  LogOut,
  Zap,
} from "lucide-react";

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  inventory: "Inventory",
  orders: "Orders",
  reports: "Reports",
  settings: "Settings",
  pos: "Sales Counter",
  kitchen: "Kitchen",
};

type TopbarProps = {
  onMenuClick?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Topbar({ onMenuClick, collapsed, onToggleCollapse }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth?.user);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    saveAuthToStorage(null);
    router.push("/auth/login");
  };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <header className="sticky top-0 z-40 flex h-[var(--topbar-height)] items-center justify-between gap-4 border-b border-[var(--border)] bg-white/80 backdrop-blur-sm px-4">
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>

        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex shrink-0 h-8 w-8"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        )}

        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {crumb.isLast ? (
                <span className="font-medium text-[var(--foreground)]">{crumb.label}</span>
              ) : (
                <>
                  <Link
                    href={crumb.href}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                </>
              )}
            </span>
          ))}
        </nav>

        <span className="text-sm font-medium sm:hidden">
          {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : ""}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative" ref={profileRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProfileOpen(!profileOpen)}
            className="gap-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold">
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-sm">{user?.name ?? "User"}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-lg)] py-1 z-50">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">{user?.email}</p>
                <p className="text-xs text-[var(--muted-foreground)] capitalize mt-0.5">
                  {user?.role}
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/pos"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)]",
                    "hover:bg-[var(--muted)] transition-colors"
                  )}
                >
                  <Zap className="h-4 w-4" />
                  Sales Counter
                </Link>
                <button
                  className={cn(
                    "flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[var(--destructive)]",
                    "hover:bg-[var(--muted)] transition-colors"
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
