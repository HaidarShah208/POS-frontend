"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/redux";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { OfflineSyncProvider } from "@/components/shared/OfflineSyncProvider";
import { QuickActionsFAB } from "@/components/shared/QuickActionsFAB";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock } from "lucide-react";

const SIDEBAR_STORAGE_KEY = "pos-sidebar-collapsed";

function loadCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth?.user);
  const rehydrated = useAppSelector((s) => s.auth?._rehydrated);
  const subscription = useAppSelector((s) => s.auth?.subscription);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(loadCollapsed());
  }, []);

  useEffect(() => {
    if (!rehydrated) return;
    if (user === null) {
      router.replace("/auth/login");
      return;
    }
  }, [user, rehydrated, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  if (!rehydrated || user === null) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          "hidden flex-col border-r border-[var(--border)] bg-[var(--background)] shrink-0 transition-[width] duration-300 ease-in-out",
          "lg:flex",
          collapsed
            ? "w-[var(--sidebar-collapsed-width)]"
            : "w-[var(--sidebar-width)]"
        )}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent side="left" className="max-w-[16rem] lg:hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <span className="font-semibold">Menu</span>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close menu">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </Button>
              </DrawerClose>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {subscription?.status === "trialing" && subscription?.trialEndsAt && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">
              Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}.
              Upgrade your plan to continue using all features.
            </span>
            <a href="/subscription" className="shrink-0 font-medium underline underline-offset-2 hover:text-amber-900">
              Upgrade Now
            </a>
          </div>
        )}
        {subscription?.status === "pending_verification" && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-200 text-blue-800 text-sm">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Your payment is being verified. You will be notified once your plan is activated.</span>
          </div>
        )}
        <OfflineBanner />
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-[var(--surface)] scroll-area-thin">
          <OfflineSyncProvider>
            {children}
          </OfflineSyncProvider>
        </main>
        <QuickActionsFAB />
      </div>
    </div>
  );
}
