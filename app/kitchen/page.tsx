"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { KDSOrderCard } from "@/components/kitchen/KDSOrderCard";
import { useGetKitchenOrdersQuery, useUpdateKitchenOrderStatusMutation } from "@/redux/api/ordersEndpoints";
import { useGetBranchesQuery } from "@/redux/api/branchesEndpoints";
import type { Order, KitchenOrderStatus } from "@/types/api/index";
import type { KitchenOrder } from "@/types/api";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

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

const FILTER_LABELS: Record<Filter, string> = {
  ALL: "All",
  NEW: "New",
  PREPARING: "Preparing",
  READY: "Ready",
};

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
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center ">
            <Button variant="ghost" size="sm" asChild className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <Link href="/dashboard"><ArrowLeft className='w-8 h-6'/> </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Kitchen Display</h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {filtered.length} order{filtered.length !== 1 ? "s" : ""} in view
                </p>
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1 rounded-lg bg-[var(--muted)]/50 p-1">
            {(["ALL", "NEW", "PREPARING", "READY"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "relative rounded-md px-4 py-2.5 text-sm font-medium transition-colors pos-touch min-h-[40px]",
                  filter === f
                    ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {FILTER_LABELS[f]}
                {f !== "ALL" && counts[f] > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                      filter === f ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    )}
                  >
                    {counts[f]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div
        ref={listRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 sm:p-6",
          "grid gap-4 sm:gap-5",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        )}
      >
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/20 py-16 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]/50 text-[var(--muted-foreground)]">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">No orders in this view</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Place orders from POS to see them here.</p>
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
