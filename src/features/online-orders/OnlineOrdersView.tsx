"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetBranchesQuery } from "@/redux/api/branchesEndpoints";
import { useGetKitchenOrdersQuery } from "@/redux/api/ordersEndpoints";
import { formatCurrency } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/api/index";
import { OrderDetailDrawer } from "./OrderDetailDrawer";

const STATUS_BADGE: Record<OrderStatus, "warning" | "info" | "secondary" | "purple" | "success" | "destructive"> = {
  pending: "warning",
  accepted: "info",
  preparing: "secondary",
  ready: "purple",
  completed: "success",
  cancelled: "destructive",
};

function getTimeElapsed(createdAt: string): string {
  const sec = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (sec < 60) return `${sec}m ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export function OnlineOrdersView() {
  const { data: branches = [] } = useGetBranchesQuery();
  const branchId = branches[0]?.id ?? "";
  const { data: orders = [] } = useGetKitchenOrdersQuery(branchId, { skip: !branchId });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = orders;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          (o.user?.name ?? "Walk-in").toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.tokenNumber.toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    if (dateFrom) list = list.filter((o) => new Date(o.createdAt) >= new Date(dateFrom));
    if (dateTo) list = list.filter((o) => new Date(o.createdAt) <= new Date(dateTo + "T23:59:59"));
    return list;
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const openDrawer = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Orders</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Orders for this branch</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search customer or order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:col-span-2 lg:col-span-1"
        />
        <select
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
          />
        </div>
      </div>

      {/* Order cards grid: desktop grid, tablet 2 col, mobile single */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="cursor-pointer hover:border-[var(--primary)]/50 transition-colors"
                onClick={() => openDrawer(order)}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div>
                    <p className="font-semibold">{order.user?.name ?? "Walk-in"}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{order.orderNumber} · #{order.tokenNumber}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[order.status]}>{order.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="text-[var(--muted-foreground)]">
                    {(order.items?.length ?? 0)} items · {formatCurrency(order.grandTotal)}
                  </p>
                  <p className="text-[var(--muted-foreground)]">
                    {order.orderType} · {order.paymentMethod}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{getTimeElapsed(order.createdAt)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-12 text-[var(--muted-foreground)]">No orders match your filters.</p>
      )}

      <OrderDetailDrawer
        order={selectedOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
