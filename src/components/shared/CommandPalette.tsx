"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "@/hooks/redux";
import { getNavItemsForRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  Search, LayoutDashboard, ShoppingCart, ChefHat, Package, Warehouse,
  BarChart3, ClipboardList, Settings, LayoutGrid, Users, Gift, Truck,
  FileText, Banknote, UserCog, Shield, PieChart, ArrowRight, Command,
} from "lucide-react";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
  group: string;
};

const ICON_MAP: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard className="h-4 w-4" />,
  "/pos": <ShoppingCart className="h-4 w-4" />,
  "/kitchen": <ChefHat className="h-4 w-4" />,
  "/products": <Package className="h-4 w-4" />,
  "/inventory": <Warehouse className="h-4 w-4" />,
  "/reports": <BarChart3 className="h-4 w-4" />,
  "/orders": <ClipboardList className="h-4 w-4" />,
  "/floor": <LayoutGrid className="h-4 w-4" />,
  "/customers": <Users className="h-4 w-4" />,
  "/loyalty": <Gift className="h-4 w-4" />,
  "/suppliers": <Truck className="h-4 w-4" />,
  "/purchase-orders": <FileText className="h-4 w-4" />,
  "/cash-register": <Banknote className="h-4 w-4" />,
  "/employees": <UserCog className="h-4 w-4" />,
  "/roles": <Shield className="h-4 w-4" />,
  "/analytics": <PieChart className="h-4 w-4" />,
  "/settings": <Settings className="h-4 w-4" />,
};

const DESCRIPTIONS: Record<string, string> = {
  "/dashboard": "Overview and key metrics",
  "/pos": "Take new orders",
  "/kitchen": "Kitchen display system",
  "/products": "Manage menu items",
  "/inventory": "Stock and inventory",
  "/reports": "Sales and analytics reports",
  "/orders": "View and manage orders",
  "/floor": "Restaurant floor layout",
  "/customers": "Customer management",
  "/loyalty": "Loyalty program",
  "/suppliers": "Supplier management",
  "/purchase-orders": "Purchase order management",
  "/cash-register": "Cash drawer management",
  "/employees": "Staff management",
  "/roles": "Roles and permissions",
  "/analytics": "Business analytics",
  "/settings": "System settings",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const user = useAppSelector((s) => s.auth?.user);
  const permissions = useAppSelector((s) => s.auth?.permissions);

  const commands: CommandItem[] = useMemo(() => {
    if (!user) return [];
    const navItems = getNavItemsForRole(user.role, permissions);
    return navItems.map((item) => ({
      id: item.href,
      label: item.label,
      description: DESCRIPTIONS[item.href],
      href: item.href,
      icon: ICON_MAP[item.href] ?? <ArrowRight className="h-4 w-4" />,
      group: "Pages",
    }));
  }, [user]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || (c.description?.toLowerCase().includes(q))
    );
  }, [commands, query]);

  useEffect(() => { setSelectedIndex(0); }, [filtered]);

  const handleSelect = useCallback((item: CommandItem) => {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }, [router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex]);
    }
  };

  useEffect(() => {
    const selected = listRef.current?.querySelector("[data-selected='true']");
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-4 top-[15%] sm:inset-auto sm:left-1/2 sm:top-[20%] sm:-translate-x-1/2 w-auto sm:w-full sm:max-w-lg z-50"
            >
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                  <Search className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleListKeyDown}
                    placeholder="Search pages, actions..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
                  />
                  <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                    ESC
                  </kbd>
                </div>

                <div ref={listRef} className="max-h-[320px] overflow-y-auto scroll-area-thin p-1.5">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Search className="h-6 w-6 text-[var(--muted-foreground)] mb-2" />
                      <p className="text-sm font-medium">No results</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Try a different search term</p>
                    </div>
                  ) : (
                    filtered.map((item, i) => (
                      <button
                        key={item.id}
                        type="button"
                        data-selected={i === selectedIndex}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                          i === selectedIndex
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "hover:bg-[var(--muted)]"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                          i === selectedIndex ? "bg-white/20" : "bg-[var(--muted)]"
                        )}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          {item.description && (
                            <p className={cn("text-xs truncate mt-0.5", i === selectedIndex ? "text-white/70" : "text-[var(--muted-foreground)]")}>
                              {item.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className={cn("h-3.5 w-3.5 shrink-0", i === selectedIndex ? "text-white/50" : "text-[var(--muted-foreground)]")} />
                      </button>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-3">
                    <span><kbd className="font-medium">↑↓</kbd> Navigate</span>
                    <span><kbd className="font-medium">↵</kbd> Select</span>
                    <span><kbd className="font-medium">Esc</kbd> Close</span>
                  </div>
                  <span>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
