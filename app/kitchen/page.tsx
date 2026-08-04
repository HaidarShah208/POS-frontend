"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
} from "lucide-react";

type Filter = "ALL" | "NEW" | "PREPARING" | "READY";

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

export default function KitchenPage() {
  const { data: branches = [] } = useGetBranchesQuery();
  const branchId = branches[0]?.id ?? "";
  const { data: orders = [] } = useGetKitchenOrdersQuery(branchId, { skip: !branchId });
  const [updateOrderStatus] = useUpdateKitchenOrderStatusMutation();
  const [filter, setFilter] = useState<Filter>("ALL");
  const listRef = useRef<HTMLDivElement>(null);

  const displayOrders = useMemo(() => orders.map(toKitchenOrderDisplay), [orders]);
  const filtered =
    filter === "ALL"
      ? displayOrders
      : displayOrders.filter((o) => o.status === filter);

  const counts = useMemo(
    () => ({
      ALL: displayOrders.length,
      NEW: displayOrders.filter((o) => o.status === "NEW").length,
      PREPARING: displayOrders.filter((o) => o.status === "PREPARING").length,
      READY: displayOrders.filter((o) => o.status === "READY").length,
    }),
    [displayOrders]
  );

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
                    {displayOrders.length} active order{displayOrders.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
            <LiveClock />
          </div>

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
                <ClipboardList className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold">No orders in this view</p>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)] max-w-xs">
                {filter === "ALL"
                  ? "Place orders from POS to see them here."
                  : `No ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} orders right now.`}
              </p>
            </motion.div>
          ) : (
            filtered.map((order) => (
              <KDSOrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
