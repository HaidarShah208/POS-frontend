"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KDSOrderCard } from "@/components/kitchen/KDSOrderCard";
import { useGetKitchenOrdersQuery, useUpdateKitchenOrderStatusMutation } from "@/redux/api/ordersEndpoints";
import { useGetBranchesQuery } from "@/redux/api/branchesEndpoints";
import type { Order, KitchenOrderStatus } from "@/types/api/index";
import type { KitchenOrder } from "@/types/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChefHat,
  ClipboardList,
  Flame,
  CheckCircle2,
  Clock,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  RefreshCw,
  ConciergeBell,
  Ban,
  Search,
  SlidersHorizontal,
} from "lucide-react";

type Filter = "ALL" | "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

const PRIORITY_ORDER: Record<string, number> = { rush: 0, vip: 1, normal: 2 };

function toKitchenOrderDisplay(order: Order): KitchenOrder {
  const status = (order.kitchenStatus as KitchenOrderStatus) || "NEW";
  return {
    id: order.id,
    token: order.tokenNumber,
    items: (order.items ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      note: i.note ?? undefined,
      modifiers: i.modifiers?.map((m) => (typeof m === "string" ? m : m.name)) ?? [],
    })),
    orderType: order.orderType,
    status,
    createdAt: order.createdAt,
  };
}

const FILTERS: { id: Filter; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "ALL", label: "All Orders", icon: <ClipboardList className="h-4 w-4" />, color: "" },
  { id: "NEW", label: "New", icon: <Flame className="h-4 w-4" />, color: "text-amber-500" },
  { id: "PREPARING", label: "Preparing", icon: <ChefHat className="h-4 w-4" />, color: "text-blue-500" },
  { id: "READY", label: "Ready", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-500" },
  { id: "SERVED", label: "Served", icon: <ConciergeBell className="h-4 w-4" />, color: "text-slate-500" },
  { id: "CANCELLED", label: "Cancelled", icon: <Ban className="h-4 w-4" />, color: "text-red-500" },
];

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
      <Clock className="h-4 w-4" />
      <span className="tabular-nums font-medium">
        {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
    </div>
  );
}

function AutoRefreshIndicator({ isFetching }: { isFetching: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
      isFetching
        ? "bg-blue-100 text-blue-700"
        : "bg-[var(--muted)]/50 text-[var(--muted-foreground)]"
    )}>
      <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
      <span className="hidden sm:inline">{isFetching ? "Syncing..." : "Live"}</span>
      {!isFetching && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
    </div>
  );
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
  }, []);

  return { isFullscreen, toggle };
}

function useNewOrderSound(enabled: boolean, newCount: number) {
  const prevCountRef = useRef(newCount);

  useEffect(() => {
    if (!enabled) {
      prevCountRef.current = newCount;
      return;
    }
    if (newCount > prevCountRef.current) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.value = 0.15;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);

        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1100;
          osc2.type = "sine";
          gain2.gain.value = 0.15;
          osc2.start();
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc2.stop(ctx.currentTime + 0.3);
        }, 150);
      } catch {}
    }
    prevCountRef.current = newCount;
  }, [enabled, newCount]);
}

export default function KitchenPage() {
  const { data: branches = [] } = useGetBranchesQuery();
  const branchId = branches[0]?.id ?? "";
  const { data: orders = [], isFetching } = useGetKitchenOrdersQuery(branchId, {
    skip: !branchId,
    pollingInterval: 5000,
  });
  const [updateOrderStatus] = useUpdateKitchenOrderStatusMutation();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("kds-sound");
    return stored === null ? true : stored === "true";
  });
  const listRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const displayOrders = useMemo(() => orders.map(toKitchenOrderDisplay), [orders]);

  const sortedOrders = useMemo(() => {
    return [...displayOrders].sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority ?? "normal"] ?? 2;
      const pb = PRIORITY_ORDER[b.priority ?? "normal"] ?? 2;
      if (pa !== pb) return pa - pb;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [displayOrders]);

  const filtered = useMemo(() => {
    let result = filter === "ALL"
      ? sortedOrders.filter((o) => o.status !== "SERVED" && o.status !== "CANCELLED")
      : sortedOrders.filter((o) => o.status === filter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.token.toLowerCase().includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [sortedOrders, filter, searchQuery]);

  const counts = useMemo(
    () => ({
      ALL: displayOrders.filter((o) => o.status !== "SERVED" && o.status !== "CANCELLED").length,
      NEW: displayOrders.filter((o) => o.status === "NEW").length,
      PREPARING: displayOrders.filter((o) => o.status === "PREPARING").length,
      READY: displayOrders.filter((o) => o.status === "READY").length,
      SERVED: displayOrders.filter((o) => o.status === "SERVED").length,
      CANCELLED: displayOrders.filter((o) => o.status === "CANCELLED").length,
    }),
    [displayOrders]
  );

  const delayedCount = useMemo(() => {
    return displayOrders.filter((o) => {
      const sec = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 1000);
      return (o.status === "NEW" && sec > 300) || (o.status === "PREPARING" && sec > 600);
    }).length;
  }, [displayOrders]);

  useNewOrderSound(soundEnabled, counts.NEW);

  useEffect(() => {
    localStorage.setItem("kds-sound", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    if (filter !== "ALL" && filter !== "NEW") return;
    const hasNew = displayOrders.some((o) => o.status === "NEW");
    if (hasNew && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [displayOrders, filter]);

  const handleStatusChange = (orderId: string, status: KitchenOrderStatus) => {
    updateOrderStatus({ orderId, status });
  };

  const handleCancel = (orderId: string) => {
    updateOrderStatus({ orderId, status: "CANCELLED" });
  };

  const avgPrepTime = useMemo(() => {
    const preparing = displayOrders.filter((o) => o.status === "PREPARING" || o.status === "READY");
    if (preparing.length === 0) return null;
    const total = preparing.reduce((sum, o) => {
      return sum + Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 1000);
    }, 0);
    const avg = Math.floor(total / preparing.length / 60);
    return avg;
  }, [displayOrders]);

  return (
    <div className="flex h-screen flex-col bg-[var(--background)]">
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
                  <ChefHat className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">Kitchen Display</h1>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {counts.ALL} active · {avgPrepTime !== null ? `~${avgPrepTime}m avg` : "No data"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AutoRefreshIndicator isFetching={isFetching} />

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9",
                  soundEnabled
                    ? "text-[var(--primary)] hover:text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>

              <LiveClock />
            </div>
          </div>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder="Search by token or item name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-4 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4 overflow-x-auto pb-0.5">
            <nav className="flex items-center gap-1 rounded-xl bg-[var(--muted)]/50 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                    filter === f.id
                      ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  )}
                >
                  <span className={cn(filter === f.id && f.color)}>{f.icon}</span>
                  <span className="hidden sm:inline">{f.label}</span>
                  {counts[f.id] > 0 && (
                    <Badge
                      variant={filter === f.id ? "default" : "secondary"}
                      className={cn(
                        "ml-0.5 h-5 min-w-5 px-1.5 text-[10px]",
                        f.id === "NEW" && counts.NEW > 0 && filter !== f.id && "bg-amber-100 text-amber-700"
                      )}
                    >
                      {counts[f.id]}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>

            <div className="ml-auto hidden items-center gap-3 md:flex">
              {delayedCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 animate-pulse">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  {delayedCount} delayed
                </div>
              )}
              {counts.NEW > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  {counts.NEW} new
                </div>
              )}
              {counts.PREPARING > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  <ChefHat className="h-3 w-3" />
                  {counts.PREPARING} cooking
                </div>
              )}
              {counts.READY > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {counts.READY} ready
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        ref={listRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 sm:p-6",
          "grid gap-4 sm:gap-5 content-start",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        )}
      >
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/10 py-20 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]/50 text-[var(--muted-foreground)]">
                {searchQuery.trim() ? <Search className="h-8 w-8" /> : <ClipboardList className="h-8 w-8" />}
              </div>
              <p className="text-base font-semibold">
                {searchQuery.trim() ? "No matching orders" : "No orders in this view"}
              </p>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)] max-w-xs">
                {searchQuery.trim()
                  ? `No orders found for "${searchQuery}".`
                  : filter === "ALL"
                    ? "Place orders from POS to see them here."
                    : `No ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} orders right now.`}
              </p>
              {searchQuery.trim() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </motion.div>
          ) : (
            filtered.map((order) => (
              <KDSOrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onCancel={handleCancel}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
