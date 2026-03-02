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
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">← Back</Link>
          </Button>
          <h1 className="text-xl font-semibold">Kitchen Display</h1>
        </div>
        <div className="flex gap-2">
          {(["ALL", "NEW", "PREPARING", "READY"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="pos-touch min-h-[40px]"
            >
              {f}
            </Button>
          ))}
        </div>
      </header>

      <div
        ref={listRef}
        className={cn(
          "flex-1 overflow-y-auto p-4",
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        )}
      >
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center text-[var(--muted-foreground)] py-12"
            >
              No orders in this view. Place orders from POS to see them here.
            </motion.p>
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
