"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetOnlineOrdersQuery, useAddMockOrderMutation } from "@/redux/api/onlineOrders";
import { formatCurrency } from "@/lib/utils";
import type { OnlineOrder, OrderSource, OnlineOrderStatus } from "@/types/online-orders";
import { OrderDetailDrawer } from "./OrderDetailDrawer";

const SOURCES: { value: OrderSource | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "website", label: "Website" },
  { value: "foodpanda", label: "Foodpanda" },
  { value: "ubereats", label: "UberEats" },
];

const STATUS_BADGE: Record<OnlineOrderStatus, "warning" | "info" | "secondary" | "purple" | "success" | "destructive"> = {
  pending: "warning",
  accepted: "info",
  preparing: "secondary",
  out_for_delivery: "purple",
  delivered: "success",
  rejected: "destructive",
};

function getTimeElapsed(createdAt: string): string {
  const sec = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (sec < 60) return `${sec}m ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export function OnlineOrdersView() {
  const { data: orders = [], refetch } = useGetOnlineOrdersQuery();
  const [addMockOrder] = useAddMockOrderMutation();
  const [sourceTab, setSourceTab] = useState<OrderSource | "all">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OnlineOrderStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ id: string; orderId: string; source: string } | null>(null);
  const [soundPulse, setSoundPulse] = useState(false);

  const filtered = useMemo(() => {
    let list = orders;
    if (sourceTab !== "all") list = list.filter((o) => o.source === sourceTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.orderId.toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    if (dateFrom) list = list.filter((o) => new Date(o.createdAt) >= new Date(dateFrom));
    if (dateTo) list = list.filter((o) => new Date(o.createdAt) <= new Date(dateTo + "T23:59:59"));
    return list;
  }, [orders, sourceTab, search, statusFilter, dateFrom, dateTo]);

  // Real-time mock: add a new order every 30s and show toast
  useEffect(() => {
    const sources: OrderSource[] = ["website", "foodpanda", "ubereats"];
    let idx = 0;
    const t = setInterval(() => {
      const source = sources[idx % sources.length];
      idx += 1;
      addMockOrder(source).then((res) => {
        if ("data" in res && res.data) {
          setToast({ id: res.data.id, orderId: res.data.orderId, source });
          setSoundPulse(true);
          setTimeout(() => setSoundPulse(false), 1500);
        }
      });
    }, 30000);
    return () => clearInterval(t);
  }, [addMockOrder]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  const openDrawer = (order: OnlineOrder) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Online Orders</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage website and delivery platform orders</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={soundPulse ? "animate-pulse text-amber-500" : "text-[var(--muted-foreground)]"}
            title="New order sound"
            aria-hidden
          >
            🔔
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] pb-2">
        {SOURCES.map(({ value, label }) => (
          <Button
            key={value}
            variant={sourceTab === value ? "default" : "ghost"}
            size="sm"
            onClick={() => setSourceTab(value)}
          >
            {label}
          </Button>
        ))}
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
          onChange={(e) => setStatusFilter(e.target.value as OnlineOrderStatus | "")}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="out_for_delivery">Out for delivery</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected</option>
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[100] rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg px-4 py-3 flex items-center gap-3"
          >
            <span className="text-lg">🔔</span>
            <div>
              <p className="font-medium">New order {toast.orderId}</p>
              <p className="text-xs text-[var(--muted-foreground)] capitalize">{toast.source}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setToast(null)}>Dismiss</Button>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{order.orderId}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[order.status]}>{order.status.replace(/_/g, " ")}</Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="text-[var(--muted-foreground)]">{order.itemsCount} items · {formatCurrency(order.total)}</p>
                  <p className="text-[var(--muted-foreground)]">
                    Payment: {order.paymentStatus} · {order.deliveryType}
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
