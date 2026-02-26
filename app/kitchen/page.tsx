"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { KDSOrderCard } from "@/components/kitchen/KDSOrderCard";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { updateOrderStatus } from "@/redux/api/kitchen";
import type { KitchenOrderStatus } from "@/types/api";
import { cn } from "@/lib/utils";

type Filter = "ALL" | "NEW" | "PREPARING" | "READY";

export default function KitchenPage() {
  const orders = useAppSelector((s) => s.kitchen.orders);
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<Filter>("ALL");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered =
    filter === "ALL"
      ? orders
      : orders.filter((o) => o.status === filter);

  // Auto-scroll when new orders arrive (NEW at top)
  useEffect(() => {
    if (filter !== "ALL" && filter !== "NEW") return;
    const hasNew = orders.some((o) => o.status === "NEW");
    if (hasNew && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [orders, filter]);

  const handleStatusChange = (orderId: string, status: KitchenOrderStatus) => {
    dispatch(updateOrderStatus({ orderId, status }));
  };

  // New orders arrive from POS when an order is placed (addOrder dispatched from CheckoutDrawer).

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
